import fs from "fs";
import path from "path";
import { Config, FileConfig, Secrets } from "./types";

function loadEnv(): void {
  const envPath = path.join(process.cwd(), ".env");
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function opt(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export function loadConfig(): Config {
  loadEnv();
  const fileCfg = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "config.json"), "utf8")
  ) as FileConfig;

  const secrets: Secrets = {
    anthropicApiKey: opt("ANTHROPIC_API_KEY"),
    anthropicModel: opt("ANTHROPIC_MODEL", "claude-sonnet-4-6"),
    anthropicFilterModel: opt("ANTHROPIC_FILTER_MODEL", "claude-haiku-4-5-20251001"),
    telegramBotToken: opt("TELEGRAM_BOT_TOKEN"),
    telegramChatId: opt("TELEGRAM_CHAT_ID"),
    upworkClientId: opt("UPWORK_CLIENT_ID"),
    upworkClientSecret: opt("UPWORK_CLIENT_SECRET"),
    upworkAccessToken: opt("UPWORK_ACCESS_TOKEN"),
    upworkRefreshToken: opt("UPWORK_REFRESH_TOKEN"),
  };

  return { ...fileCfg, secrets };
}

export function validateConfig(cfg: Config): void {
  let hasError = false;

  if (!cfg.secrets.anthropicApiKey) {
    console.error("ERROR: ANTHROPIC_API_KEY not set. Add it to your .env file.");
    hasError = true;
  }

  if (!cfg.secrets.telegramBotToken || !cfg.secrets.telegramChatId) {
    console.error("ERROR: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set.");
    hasError = true;
  }

  if (hasError) process.exit(1);

  if (!cfg.secrets.upworkClientId || !cfg.secrets.upworkClientSecret) {
    console.warn("WARNING: Upwork OAuth keys not set. Running in RSS-only mode.");
  }
}
