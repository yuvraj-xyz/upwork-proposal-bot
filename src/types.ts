export interface FileConfig {
  keywords: string[];
  pollIntervalMs: number;
  budget: { fixedMin: number; hourlyMin: number };
  outputFolder: string;
  freelancer: {
    name: string;
    tagline: string;
    portfolio: Record<string, string>;
  };
}

export interface Secrets {
  anthropicApiKey: string;
  anthropicModel: string;
  anthropicFilterModel: string;
  telegramBotToken: string;
  telegramChatId: string;
  upworkClientId: string;
  upworkClientSecret: string;
  upworkAccessToken: string;
  upworkRefreshToken: string;
}

export type Config = FileConfig & { secrets: Secrets };

export interface Job {
  id: string;
  title: string;
  description: string;
  link: string;
  postedAt: string;
  budgetType: "fixed" | "hourly" | "unknown";
  budgetAmount: number | null;
  budgetRaw: string | null;
  hourlyMin: number | null;
  hourlyMax: number | null;
  paymentVerified: boolean;
  country: string | null;
  category: string | null;
}

export interface ProposalResult {
  client_analysis: {
    company: string;
    wants: string;
    concern: string;
    budget_signal: string;
  };
  proposal: {
    opening_hook: string;
    value_bridge: string;
    social_proof_line: string;
    cta: string;
    full_proposal_text: string;
  };
  alert_summary: {
    summary: string;
    recommendation: "APPLY NOW" | "APPLY TODAY" | "SKIP";
    reason: string;
  };
}
