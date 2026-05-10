import fs from "fs";
import path from "path";
import readline from "readline";
import { Config, Job } from "./src/types";
import { loadConfig, validateConfig } from "./src/config";
import { fetchFeed } from "./src/feed";
import { fetchMockFeed } from "./src/mockFeed";
import { passesBudget } from "./src/filter";
import { hasSeen, markSeen, resetSeen } from "./src/db";
import { generateProposal } from "./src/proposal";
import { qualifyJob } from "./src/qualify";
import { sendTelegram, saveProposalMarkdown } from "./src/notify";

function ts(): string {
  return new Date().toISOString();
}

async function runSetup(): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  console.log("=== Upwork Proposal Bot Setup ===\n");

  const fields: [string, string][] = [
    ["ANTHROPIC_API_KEY", "Anthropic API key (console.anthropic.com)"],
    ["ANTHROPIC_MODEL", "Anthropic model (press enter for claude-sonnet-4-6)"],
    ["ANTHROPIC_FILTER_MODEL", "Filter model (press enter for claude-haiku-4-5-20251001)"],
    ["TELEGRAM_BOT_TOKEN", "Telegram bot token (@BotFather on Telegram)"],
    ["TELEGRAM_CHAT_ID", "Telegram chat ID (@userinfobot on Telegram)"],
    ["UPWORK_CLIENT_ID", "Upwork client ID (leave blank if pending approval)"],
    ["UPWORK_CLIENT_SECRET", "Upwork client secret (leave blank if pending)"],
    ["UPWORK_ACCESS_TOKEN", "Upwork access token (leave blank if pending)"],
    ["UPWORK_REFRESH_TOKEN", "Upwork refresh token (leave blank if pending)"],
  ];

  const defaults: Record<string, string> = {
    ANTHROPIC_MODEL: "claude-sonnet-4-6",
    ANTHROPIC_FILTER_MODEL: "claude-haiku-4-5-20251001",
  };

  const lines: string[] = [];
  for (const [key, label] of fields) {
    const def = defaults[key];
    const prompt = def ? `${label} [${def}]: ` : `${label}: `;
    const val = (await ask(prompt)).trim() || def || "";
    lines.push(`${key}=${val}`);
  }

  rl.close();
  fs.writeFileSync(path.join(process.cwd(), ".env"), lines.join("\n") + "\n", "utf8");
  console.log("\nSetup complete. Run npm start to begin monitoring.");
}

async function processJob(job: Job, cfg: Config): Promise<void> {
  console.log(
    `[${ts()}] MATCH ${job.id} | ${job.budgetRaw ?? "no budget"} | ${job.title}`
  );
  try {
    const result = await generateProposal(job, cfg);
    const file = saveProposalMarkdown(job, result, cfg);
    console.log(
      `[${ts()}]   → ${result.alert_summary.recommendation}: ${
        result.alert_summary.reason
      }`
    );
    console.log(`[${ts()}]   → saved ${file}`);
    await sendTelegram(cfg, job, result);
  } catch (err: any) {
    console.error(
      `[${ts()}]   ✗ proposal generation failed for ${job.id}:`,
      err?.message || err
    );
  }
}

async function pollOnce(cfg: Config, mock: boolean): Promise<void> {
  const fetcher = mock ? fetchMockFeed : fetchFeed;
  const results = await Promise.allSettled(
    cfg.keywords.map((k) => fetcher(k))
  );

  const newJobs = new Map<string, Job>();
  results.forEach((r, i) => {
    const kw = cfg.keywords[i];
    if (r.status === "rejected") {
      console.error(`[${ts()}] feed "${kw}" failed:`, r.reason?.message || r.reason);
      return;
    }
    for (const job of r.value) {
      if (newJobs.has(job.id)) continue;
      if (hasSeen(job.id)) continue;
      newJobs.set(job.id, job);
    }
  });

  if (newJobs.size === 0) {
    console.log(`[${ts()}] poll: 0 new jobs`);
    return;
  }

  console.log(`[${ts()}] poll: ${newJobs.size} new jobs`);

  for (const job of newJobs.values()) {
    // mark seen first so a crash mid-process doesn't spam later
    markSeen(job.id, job.title);

    if (!job.paymentVerified) {
      console.log(
        `[${ts()}] skip ${job.id} (payment not verified): ${job.title}`
      );
      continue;
    }
    if (!passesBudget(job, cfg)) {
      console.log(
        `[${ts()}] skip ${job.id} (budget ${job.budgetRaw ?? "unknown"}): ${
          job.title
        }`
      );
      continue;
    }

    try {
      const q = await qualifyJob(job, cfg);
      if (!q.qualified) {
        console.log(
          `[${ts()}] skip ${job.id} (Haiku fit=${q.fit_score}): ${q.reason}`
        );
        continue;
      }
      console.log(
        `[${ts()}] qualified ${job.id} (fit=${q.fit_score}): ${q.reason}`
      );
    } catch (err: any) {
      console.error(
        `[${ts()}] qualify failed for ${job.id}, proceeding anyway:`,
        err?.message || err
      );
    }

    await processJob(job, cfg);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--setup")) {
    await runSetup();
    return;
  }

  if (!args.includes("--start")) {
    console.log("Usage: ts-node monitor.ts --start | --setup");
    process.exit(1);
  }

  const cfg = loadConfig();
  validateConfig(cfg);

  const mock = args.includes("--mock");
  const once = args.includes("--once");
  if (args.includes("--reset")) {
    const n = resetSeen();
    console.log(`[${ts()}] reset: cleared ${n} seen job ids`);
  }
  console.log(
    `[${ts()}] Upwork monitor starting — ${cfg.keywords.length} keywords, every ${
      cfg.pollIntervalMs / 1000
    }s${mock ? " [MOCK MODE]" : ""}`
  );

  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await pollOnce(cfg, mock);
    } catch (err: any) {
      console.error(`[${ts()}] poll error:`, err?.message || err);
    } finally {
      running = false;
    }
  };

  await run();
  if (once) return;
  setInterval(run, cfg.pollIntervalMs);
}

main().catch((e) => {
  console.error("fatal:", e);
  process.exit(1);
});
