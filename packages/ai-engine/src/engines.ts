import type { AnalysisResponse, RiskLevel } from "@social-zeka-ai/types";
import { clampNumber, normalizeRisk } from "@social-zeka-ai/utils";

const trimValue = (value: string) => value?.trim() ?? "";

export const applyPersonaEngine = (analysis: AnalysisResponse): AnalysisResponse => ({
  ...analysis,
  responses: {
    A: trimValue(analysis.responses.A),
    B: trimValue(analysis.responses.B),
    C: trimValue(analysis.responses.C),
    bonus: trimValue(analysis.responses.bonus)
  }
});

export const applyRedFlagEngine = (analysis: AnalysisResponse): AnalysisResponse => {
  const risk: RiskLevel = normalizeRisk(analysis.score.risk);
  const bonus =
    risk === "red" && !analysis.responses.bonus
      ? "Tamamdır, burada bitirelim. Görüşürüz."
      : analysis.responses.bonus;
  return {
    ...analysis,
    score: {
      ...analysis.score,
      risk
    },
    responses: {
      ...analysis.responses,
      bonus
    }
  };
};

export const applyPowerDynamicsEngine = (analysis: AnalysisResponse): AnalysisResponse => ({
  ...analysis,
  score: {
    ...analysis.score,
    interest: clampNumber(analysis.score.interest, 0, 100, 0)
  }
});

export const applyGrowthEngine = (analysis: AnalysisResponse): AnalysisResponse => ({
  ...analysis,
  growth: {
    quality: clampNumber(analysis.growth.quality, 0, 100, 0),
    investment: clampNumber(analysis.growth.investment, 0, 100, 0),
    tone: clampNumber(analysis.growth.tone, 0, 100, 0),
    power: clampNumber(analysis.growth.power, 0, 100, 0)
  }
});
