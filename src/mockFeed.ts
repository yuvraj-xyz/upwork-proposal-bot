import { Job } from "./types";

export const SAMPLE_JOBS: Job[] = [
  {
    id: "mock-001-saas-explainer-pm-tool",
    title: "SaaS Explainer Video for Project Management Tool",
    description:
      "We need a 60-90 second animated explainer video for our B2B project management SaaS. Target audience is operations managers at mid-size companies. Put banana or any other fruit at the top of your proposal so i know you read it till here",
    link: "https://www.upwork.com/jobs/mock-001-saas-explainer-pm-tool",
    postedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    budgetType: "fixed",
    budgetAmount: 800,
    budgetRaw: "$800 fixed",
    hourlyMin: null,
    hourlyMax: null,
    paymentVerified: true,
    country: "United States",
    category: "Video Animation",
  },
  {
    id: "mock-002-low-budget",
    title: "Quick 15-second logo animation",
    description: "Need a logo sting done fast, not much budget.",
    link: "https://www.upwork.com/jobs/mock-002-low-budget",
    postedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    budgetType: "fixed",
    budgetAmount: 75,
    budgetRaw: "$75 fixed",
    hourlyMin: null,
    hourlyMax: null,
    paymentVerified: true,
    country: "India",
    category: "Video Animation",
  },
  {
    id: "mock-003-hourly-good",
    title: "Ongoing motion design for B2B fintech startup",
    description:
      "Seed-stage fintech platform, we're building out our landing page and need motion design for product demo sections. Looking for someone long-term.",
    link: "https://www.upwork.com/jobs/mock-003-hourly-good",
    postedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    budgetType: "hourly",
    budgetAmount: null,
    budgetRaw: "$35-$60/hr",
    hourlyMin: 35,
    hourlyMax: 60,
    paymentVerified: true,
    country: "Canada",
    category: "Video Animation",
  },
  {
    id: "mock-004-budget-unknown",
    title: "Product launch video for AI writing assistant",
    description:
      "Launching next month on ProductHunt. Need a punchy 45-second video that shows the product in action and hooks trial sign-ups.",
    link: "https://www.upwork.com/jobs/mock-004-budget-unknown",
    postedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    budgetType: "unknown",
    budgetAmount: null,
    budgetRaw: null,
    hourlyMin: null,
    hourlyMax: null,
    paymentVerified: true,
    country: "United Kingdom",
    category: "Video Animation",
  },
  {
    id: "mock-005-unverified",
    title: "Explainer video — big budget, no payment verification",
    description:
      "Huge project, $5000 budget, but our payment method isn't set up yet.",
    link: "https://www.upwork.com/jobs/mock-005-unverified",
    postedAt: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
    budgetType: "fixed",
    budgetAmount: 5000,
    budgetRaw: "$5000 fixed",
    hourlyMin: null,
    hourlyMax: null,
    paymentVerified: false,
    country: "Unknown",
    category: "Video Animation",
  },
];

export async function fetchMockFeed(_keyword: string): Promise<Job[]> {
  return SAMPLE_JOBS;
}
