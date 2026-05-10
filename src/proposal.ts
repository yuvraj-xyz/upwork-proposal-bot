import Anthropic from "@anthropic-ai/sdk";
import { Config, Job, ProposalResult } from "./types";

const SYSTEM_PROMPT = `You are a senior freelance SaaS motion designer with 5+ years of experience, writing Upwork proposals in a sharp, confident, peer-to-peer tone.

You never sound like a template. You lead with insight about the client's specific problem, not with credentials. You write like someone who has already understood the product, the audience, and the real business outcome the client cares about — not like someone applying for a job.

You always return valid JSON matching the exact schema requested. No markdown, no commentary outside the JSON.`;

function buildUserPrompt(job: Job, cfg: Config): string {
  const portfolio = Object.entries(cfg.freelancer.portfolio)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `Analyze this Upwork job and generate a proposal.

JOB TITLE: ${job.title}

JOB DESCRIPTION:
${job.description}

BUDGET: ${job.budgetRaw ?? "Not listed"}
POSTED: ${job.postedAt}
CLIENT COUNTRY: ${job.country ?? "unknown"}
PAYMENT VERIFIED: ${job.paymentVerified}

FREELANCER CONTEXT:
- Name: ${cfg.freelancer.name}
- Positioning: ${cfg.freelancer.tagline}
- Recent relevant work to reference in social_proof_line (pick ONE that fits the job):
${portfolio}

Return JSON with this EXACT shape:
{
  "client_analysis": {
    "company": "stage, industry, size signals",
    "wants": "the actual outcome they want, not just the deliverable",
    "concern": "their likely concern or risk (budget/vision/deadline/etc)",
    "budget_signal": "if no budget listed, estimate from context; else confirm it"
  },
  "proposal": {
    "opening_hook": "First 2 sentences. Reference something specific from their description. Show you understand their product/audience. Never start with 'I am a motion designer with X years...'",
    "value_bridge": "1 short paragraph connecting what they need to what you deliver. Use outcome language ('your trial sign-ups', 'visitors who bounce in 10 seconds').",
    "social_proof_line": "1 sentence referencing ONE of the portfolio links above that fits this job. Include the URL.",
    "cta": "Soft single ask. NOT 'let me know if interested.' Example: 'Happy to share a quick concept approach if you want to see how I'd structure this.'",
    "full_proposal_text": "Assembled final proposal under 150 words. Upwork rewards short proposals that get to the point. Combine hook + value_bridge + social_proof_line + cta naturally."
  },
  "alert_summary": {
    "summary": "One line: '[Budget] — [Company type] needs [deliverable] — [urgency signal]'",
    "recommendation": "APPLY NOW | APPLY TODAY | SKIP",
    "reason": "one-line reason for recommendation"
  }
}`;
}

function extractJson(text: string): any {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(candidate.slice(start, end + 1));
}

export async function generateProposal(
  job: Job,
  cfg: Config
): Promise<ProposalResult> {
  const client = new Anthropic({ apiKey: cfg.secrets.anthropicApiKey });
  const resp = await client.messages.create({
    model: cfg.secrets.anthropicModel,
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(job, cfg) }],
  });
  const text = resp.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n");
  return extractJson(text) as ProposalResult;
}
