import type { AnalysisResponse } from "@social-zeka-ai/types";
import { analysisSchema } from "./schema.js";
import { applyGrowthEngine, applyPersonaEngine, applyPowerDynamicsEngine, applyRedFlagEngine } from "./engines.js";
import { parseJsonFromText } from "./jsonParser.js";
import { createOpenAIClient, runChatCompletion } from "./llmClient.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";

export interface RunAIAnalysisOptions {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  systemPrompt?: string;
}

const buildUserMessage = (message: string, context?: string) => {
  if (!context) {
    return message;
  }
  return `Mesaj: ${message}\n\nKontekst:\n${context}`;
};

export const runAIAnalysis = async (
  message: string,
  context: string | undefined,
  options: RunAIAnalysisOptions
): Promise<AnalysisResponse> => {
  const client = createOpenAIClient({ apiKey: options.apiKey, baseUrl: options.baseUrl });
  const content = await runChatCompletion(client, {
    model: options.model ?? "gpt-4o-mini",
    systemPrompt: options.systemPrompt ?? SYSTEM_PROMPT,
    userMessage: buildUserMessage(message, context)
  });

  const parsed = parseJsonFromText(content);
  const base = analysisSchema.parse(parsed);
  const withPersona = applyPersonaEngine(base);
  const withRisk = applyRedFlagEngine(withPersona);
  const withPower = applyPowerDynamicsEngine(withRisk);
  return applyGrowthEngine(withPower);
};
