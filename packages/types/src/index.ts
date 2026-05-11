export type RiskLevel = "green" | "yellow" | "red";

export interface AnalyzeMessageRequest {
  message: string;
  context?: string;
}

export interface AnalysisResponse {
  vibe_check: string;
  strategy: string;
  responses: {
    A: string;
    B: string;
    C: string;
    bonus: string;
  };
  score: {
    interest: number;
    risk: RiskLevel;
  };
  growth: {
    quality: number;
    investment: number;
    tone: number;
    power: number;
  };
}

export interface SaveMessageRequest {
  userId?: string;
  message: string;
  context?: string;
  analysis?: AnalysisResponse;
}

export interface ConversationMessage {
  id: string;
  user_id?: string | null;
  message: string;
  context?: string | null;
  created_at: string;
}

export interface ConversationRecord {
  message: ConversationMessage;
  analysis: AnalysisResponse;
}

export interface TrendReportPoint {
  date: string;
  averageInterest: number;
  risk: {
    green: number;
    yellow: number;
    red: number;
  };
  growth: {
    quality: number;
    investment: number;
    tone: number;
    power: number;
  };
}

export interface TrendReportSummary {
  averageInterest: number;
  riskDistribution: {
    green: number;
    yellow: number;
    red: number;
  };
  averageGrowth: {
    quality: number;
    investment: number;
    tone: number;
    power: number;
  };
}

export interface TrendReport {
  points: TrendReportPoint[];
  summary: TrendReportSummary;
}
