import Parser from "rss-parser";
import { Job } from "./types";

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Upwork-Monitor/1.0",
  },
});

export function buildFeedUrl(keyword: string): string {
  return `https://www.upwork.com/ab/feed/jobs/rss?q=${encodeURIComponent(
    keyword
  )}&sort=recency`;
}

function extractJobId(link: string, guid?: string): string {
  const m = (guid || link).match(/~([0-9a-f]{16,})/i);
  if (m) return m[1];
  const m2 = (guid || link).match(/_~([^/?&]+)/);
  if (m2) return m2[1];
  return (guid || link).slice(-32);
}

function parseDescription(raw: string): {
  description: string;
  budgetType: Job["budgetType"];
  budgetAmount: number | null;
  budgetRaw: string | null;
  hourlyMin: number | null;
  hourlyMax: number | null;
  paymentVerified: boolean;
  country: string | null;
  category: string | null;
} {
  const text = raw.replace(/<[^>]+>/g, "\n").replace(/&nbsp;/g, " ");

  const budgetMatch = text.match(/Budget[:\s]*\$([\d,]+)/i);
  const hourlyRange = text.match(
    /Hourly Range[:\s]*\$([\d.]+)\s*[-–]\s*\$([\d.]+)/i
  );
  const hourlySingle = text.match(/Hourly[:\s]*\$([\d.]+)/i);
  const paymentVerified = /Payment verified/i.test(text);
  const countryMatch = text.match(/Country[:\s]*([^\n]+)/i);
  const categoryMatch = text.match(/Category[:\s]*([^\n]+)/i);

  let budgetType: Job["budgetType"] = "unknown";
  let budgetAmount: number | null = null;
  let budgetRaw: string | null = null;
  let hourlyMin: number | null = null;
  let hourlyMax: number | null = null;

  if (budgetMatch) {
    budgetType = "fixed";
    budgetAmount = parseInt(budgetMatch[1].replace(/,/g, ""), 10);
    budgetRaw = `$${budgetMatch[1]} fixed`;
  } else if (hourlyRange) {
    budgetType = "hourly";
    hourlyMin = parseFloat(hourlyRange[1]);
    hourlyMax = parseFloat(hourlyRange[2]);
    budgetRaw = `$${hourlyMin}-$${hourlyMax}/hr`;
  } else if (hourlySingle) {
    budgetType = "hourly";
    hourlyMin = parseFloat(hourlySingle[1]);
    hourlyMax = hourlyMin;
    budgetRaw = `$${hourlyMin}/hr`;
  }

  // description body: strip trailing metadata block
  const description = text
    .split(/\nBudget:|\nHourly Range:|\nHourly:|\nPosted On:|\nCategory:/i)[0]
    .trim();

  return {
    description,
    budgetType,
    budgetAmount,
    budgetRaw,
    hourlyMin,
    hourlyMax,
    paymentVerified,
    country: countryMatch ? countryMatch[1].trim() : null,
    category: categoryMatch ? categoryMatch[1].trim() : null,
  };
}

export async function fetchFeed(keyword: string): Promise<Job[]> {
  const url = buildFeedUrl(keyword);
  const feed = await parser.parseURL(url);
  const jobs: Job[] = [];
  for (const item of feed.items) {
    if (!item.link) continue;
    const id = extractJobId(item.link, item.guid);
    const rawDesc = item.contentSnippet || item.content || item.summary || "";
    const parsed = parseDescription(rawDesc);
    jobs.push({
      id,
      title: item.title || "(no title)",
      description: parsed.description,
      link: item.link,
      postedAt: item.pubDate || new Date().toISOString(),
      budgetType: parsed.budgetType,
      budgetAmount: parsed.budgetAmount,
      budgetRaw: parsed.budgetRaw,
      hourlyMin: parsed.hourlyMin,
      hourlyMax: parsed.hourlyMax,
      paymentVerified: parsed.paymentVerified,
      country: parsed.country,
      category: parsed.category,
    });
  }
  return jobs;
}
