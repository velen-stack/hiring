import type { Stage, Department, Facet } from "@prisma/client";

export const STAGES: { key: Stage; label: string; color: string }[] = [
  { key: "TOP_OF_FUNNEL", label: "Top of funnel", color: "bg-slate-100 text-slate-800" },
  { key: "REACHED_OUT", label: "Reached out", color: "bg-blue-100 text-blue-800" },
  { key: "SCREENING", label: "Screening", color: "bg-indigo-100 text-indigo-800" },
  { key: "TECHNICAL", label: "Technical", color: "bg-violet-100 text-violet-800" },
  { key: "ONSITE", label: "Onsite", color: "bg-amber-100 text-amber-800" },
  { key: "OFFER", label: "Offer", color: "bg-emerald-100 text-emerald-800" },
  { key: "OFFER_ACCEPTED", label: "Accepted", color: "bg-green-100 text-green-900" },
  { key: "REJECTED", label: "Rejected", color: "bg-rose-100 text-rose-800" },
  { key: "FOLLOW_UP", label: "Follow up later", color: "bg-sky-100 text-sky-800" },
];

export const PIPELINE_STAGES: Stage[] = [
  "TOP_OF_FUNNEL",
  "REACHED_OUT",
  "SCREENING",
  "TECHNICAL",
  "ONSITE",
  "OFFER",
  "OFFER_ACCEPTED",
  "REJECTED",
];

export function stageMeta(stage: Stage) {
  return STAGES.find((s) => s.key === stage)!;
}

export const DEPARTMENTS: { key: Department; label: string }[] = [
  { key: "ENGINEERING", label: "Engineering" },
  { key: "BUSINESS_OPS", label: "Business / Ops" },
  { key: "RESEARCH", label: "Research" },
  { key: "OTHER", label: "Other" },
];

export const FACETS: { key: Facet; label: string; blurb: string }[] = [
  { key: "TECHNICAL", label: "Technical capability", blurb: "Craft, depth, and quality of work." },
  { key: "EXECUTIVE_PRESENCE", label: "Executive presence", blurb: "Communication, gravitas, stakeholder impact." },
  { key: "SENIORITY", label: "Seniority / experience", blurb: "Scope of ownership and track record." },
  { key: "PROBLEM_SOLVING", label: "Problem solving", blurb: "Reasoning, decomposition, and judgement." },
  { key: "CULTURE", label: "Cultural fit", blurb: "Values alignment, collaboration, and trust." },
];

export function facetLabel(f: Facet) {
  return FACETS.find((x) => x.key === f)?.label ?? f;
}
