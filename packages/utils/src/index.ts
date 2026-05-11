import type { AnalysisResponse, RiskLevel } from "@social-zeka-ai/types";

export const clampNumber = (value: number, min: number, max: number, fallback: number) => {
  if (Number.isFinite(value)) {
    return Math.min(Math.max(value, min), max);
  }
  return fallback;
};

export const normalizeRisk = (risk: string | undefined, fallback: RiskLevel = "yellow"): RiskLevel => {
  if (risk === "green" || risk === "yellow" || risk === "red") {
    return risk;
  }
  return fallback;
};

export const buildWhatsAppShareUrl = (text: string) =>
  `https://wa.me/?text=${encodeURIComponent(text)}`;

export const ensureAnalysisDefaults = (analysis: AnalysisResponse): AnalysisResponse => {
  const interest = clampNumber(analysis.score?.interest ?? 0, 0, 100, 0);
  const risk = normalizeRisk(analysis.score?.risk);

  const growth = analysis.growth ?? { quality: 0, investment: 0, tone: 0, power: 0 };
  return {
    vibe_check: analysis.vibe_check ?? "",
    strategy: analysis.strategy ?? "",
    responses: {
      A: analysis.responses?.A ?? "",
      B: analysis.responses?.B ?? "",
      C: analysis.responses?.C ?? "",
      bonus: analysis.responses?.bonus ?? ""
    },
    score: {
      interest,
      risk
    },
    growth: {
      quality: clampNumber(growth.quality ?? 0, 0, 100, 0),
      investment: clampNumber(growth.investment ?? 0, 0, 100, 0),
      tone: clampNumber(growth.tone ?? 0, 0, 100, 0),
      power: clampNumber(growth.power ?? 0, 0, 100, 0)
    }
  };
};
