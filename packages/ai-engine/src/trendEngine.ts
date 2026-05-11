import type { RiskLevel, TrendReport, TrendReportPoint } from "@social-zeka-ai/types";
import { clampNumber, normalizeRisk } from "@social-zeka-ai/utils";

export interface TrendInput {
  createdAt: string;
  interest: number;
  risk: RiskLevel;
  growth: {
    quality: number;
    investment: number;
    tone: number;
    power: number;
  };
}

const toDateKey = (value: string) => new Date(value).toISOString().slice(0, 10);

export const buildTrendReport = (entries: TrendInput[]): TrendReport => {
  const map = new Map<string, TrendReportPoint>();

  for (const entry of entries) {
    const dateKey = toDateKey(entry.createdAt);
    const risk = normalizeRisk(entry.risk);
    const point = map.get(dateKey) ?? {
      date: dateKey,
      averageInterest: 0,
      risk: { green: 0, yellow: 0, red: 0 },
      growth: { quality: 0, investment: 0, tone: 0, power: 0 }
    };

    point.averageInterest += entry.interest;
    point.risk[risk] += 1;
    point.growth.quality += entry.growth.quality;
    point.growth.investment += entry.growth.investment;
    point.growth.tone += entry.growth.tone;
    point.growth.power += entry.growth.power;
    map.set(dateKey, point);
  }

  const points = Array.from(map.values()).map((point) => {
    const total = point.risk.green + point.risk.yellow + point.risk.red;
    const divisor = total || 1;
    return {
      ...point,
      averageInterest: clampNumber(point.averageInterest / divisor, 0, 100, 0),
      growth: {
        quality: clampNumber(point.growth.quality / divisor, 0, 100, 0),
        investment: clampNumber(point.growth.investment / divisor, 0, 100, 0),
        tone: clampNumber(point.growth.tone / divisor, 0, 100, 0),
        power: clampNumber(point.growth.power / divisor, 0, 100, 0)
      }
    };
  });

  const summary = points.reduce(
    (acc, point) => {
      acc.averageInterest += point.averageInterest;
      acc.riskDistribution.green += point.risk.green;
      acc.riskDistribution.yellow += point.risk.yellow;
      acc.riskDistribution.red += point.risk.red;
      acc.averageGrowth.quality += point.growth.quality;
      acc.averageGrowth.investment += point.growth.investment;
      acc.averageGrowth.tone += point.growth.tone;
      acc.averageGrowth.power += point.growth.power;
      return acc;
    },
    {
      averageInterest: 0,
      riskDistribution: { green: 0, yellow: 0, red: 0 },
      averageGrowth: { quality: 0, investment: 0, tone: 0, power: 0 }
    }
  );

  const pointCount = points.length || 1;
  return {
    points,
    summary: {
      averageInterest: clampNumber(summary.averageInterest / pointCount, 0, 100, 0),
      riskDistribution: summary.riskDistribution,
      averageGrowth: {
        quality: clampNumber(summary.averageGrowth.quality / pointCount, 0, 100, 0),
        investment: clampNumber(summary.averageGrowth.investment / pointCount, 0, 100, 0),
        tone: clampNumber(summary.averageGrowth.tone / pointCount, 0, 100, 0),
        power: clampNumber(summary.averageGrowth.power / pointCount, 0, 100, 0)
      }
    }
  };
};
