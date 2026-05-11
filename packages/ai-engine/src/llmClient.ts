import OpenAI from "openai";

export interface LLMClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface ChatRequest {
  model: string;
  systemPrompt: string;
  userMessage: string;
}

export const createOpenAIClient = ({ apiKey, baseUrl }: LLMClientOptions) =>
  new OpenAI({ apiKey, baseURL: baseUrl });

export const runChatCompletion = async (
  client: OpenAI,
  request: ChatRequest
): Promise<string> => {
  const completion = await client.chat.completions.create({
    model: request.model,
    messages: [
      { role: "system", content: request.systemPrompt },
      { role: "user", content: request.userMessage }
    ],
    temperature: 0.7,
    response_format: { type: "json_object" }
  });

  return completion.choices[0]?.message?.content ?? "";
};
