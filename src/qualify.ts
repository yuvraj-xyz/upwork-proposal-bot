import Anthropic from "@anthropic-ai/sdk";
import { Config, Job } from "./types";

export interface QualifyResult {
  qualified: boolean;
  fit_score: number;
  reason: string;
}

const SYSTEM_PROMPT = `You are a fast pre-screener for Upwork jobs. Given a job and a freelancer profile, decide if the freelancer should spend a Connect on this job. You return ONLY valid JSON. No prose. Be strict — skip vague, low-effort, or off-fit jobs.`;

function buildPrompt(job: Job, cfg: Config): string {
  const skills = Object.keys(cfg.freelancer.portfolio).join(", ");
  return `FREELANCER:
- Name: ${cfg.freelancer.name}
- Positioning: ${cfg.freelancer.tagline}
- Skill areas: ${skills}

JOB:
- Title: ${job.title}
- Budget: ${job.budgetRaw ?? "not listed"}
- Payment verified: ${job.paymentVerified}
- Country: ${job.country ?? "unknown"}
- Description: ${job.description}

Return JSON:
{
  "qualified": true | false,
  "fit_score": 0-10,
  "reason": "one short sentence"
}

Rules:
- qualified=false if job is vague, spammy, wrong niche, or clearly a bad fit for the freelancer's positioning.
- qualified=false if fit_score < 6.
- qualified=true only if it's worth writing a real proposal for.`;
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function qualifyJob(
  job: Job,
  cfg: Config
): Promise<QualifyResult> {
  const client = new Anthropic({ apiKey: cfg.secrets.anthropicApiKey });
  const resp = await client.messages.create({
    model: cfg.secrets.anthropicFilterModel,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildPrompt(job, cfg) }],
  });
  const text = resp.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
  return extractJson(text) as QualifyResult;
}
