export const parseJsonFromText = (rawText: string) => {
  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  }
  throw new Error("LLM response is not valid JSON.");
};
