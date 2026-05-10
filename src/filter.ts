import { Config, Job } from "./types";

export function passesBudget(job: Job, cfg: Config): boolean {
  if (!job.paymentVerified) return false;
  if (job.budgetType === "fixed") {
    return (job.budgetAmount ?? 0) >= cfg.budget.fixedMin;
  }
  if (job.budgetType === "hourly") {
    const ref = job.hourlyMax ?? job.hourlyMin ?? 0;
    return ref >= cfg.budget.hourlyMin;
  }
  // unknown budget: let through
  return true;
}
