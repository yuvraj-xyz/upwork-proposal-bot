import axios from "axios";
import fs from "fs";
import path from "path";
import { Config, Job, ProposalResult } from "./types";

export async function sendTelegram(
  cfg: Config,
  job: Job,
  result: ProposalResult
): Promise<void> {
  const botToken = cfg.secrets.telegramBotToken;
  const chatId = cfg.secrets.telegramChatId;
  if (!botToken || !chatId) {
    console.log("[telegram] skipped — token/chat id not set in .env");
    return;
  }

  const escape = (s: string) =>
    s.replace(/[_*[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);

  const lines = [
    `*${escape(result.alert_summary.recommendation)}* — ${escape(
      result.alert_summary.reason
    )}`,
    "",
    escape(result.alert_summary.summary),
    "",
    `*Budget:* ${escape(job.budgetRaw ?? "Not listed")}`,
    `*Posted:* ${escape(job.postedAt)}`,
    `*Link:* ${escape(job.link)}`,
    "",
    "*Proposal:*",
    escape(result.proposal.full_proposal_text),
  ];

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: chatId,
      text: lines.join("\n"),
      parse_mode: "MarkdownV2",
      disable_web_page_preview: false,
    });
  } catch (err: any) {
    console.error(
      "[telegram] send failed:",
      err?.response?.data || err?.message
    );
  }
}

export function saveProposalMarkdown(
  job: Job,
  result: ProposalResult,
  cfg: Config
): string {
  const date = new Date().toISOString().slice(0, 10);
  const dir = path.join(process.cwd(), cfg.outputFolder, date);
  fs.mkdirSync(dir, { recursive: true });

  const safeTitle = job.title
    .replace(/[^a-z0-9]+/gi, "-")
    .slice(0, 60)
    .toLowerCase();
  const file = path.join(dir, `${job.id}-${safeTitle}.md`);

  const md = `# ${job.title}

- **Job ID:** ${job.id}
- **Link:** ${job.link}
- **Posted:** ${job.postedAt}
- **Budget:** ${job.budgetRaw ?? "Not listed"}
- **Payment verified:** ${job.paymentVerified}
- **Country:** ${job.country ?? "unknown"}
- **Recommendation:** ${result.alert_summary.recommendation} — ${result.alert_summary.reason}

## Alert summary
${result.alert_summary.summary}

## Client analysis
- **Company:** ${result.client_analysis.company}
- **Wants:** ${result.client_analysis.wants}
- **Concern:** ${result.client_analysis.concern}
- **Budget signal:** ${result.client_analysis.budget_signal}

## Proposal

**Opening hook**
${result.proposal.opening_hook}

**Value bridge**
${result.proposal.value_bridge}

**Social proof**
${result.proposal.social_proof_line}

**CTA**
${result.proposal.cta}

---

### Full proposal (copy-paste)

${result.proposal.full_proposal_text}

---

## Original job description

${job.description}
`;
  fs.writeFileSync(file, md, "utf8");
  return file;
}
