import { z } from "zod";

export const analysisSchema = z.object({
  vibe_check: z.string().catch("").default(""),
  strategy: z.string().catch("").default(""),
  responses: z
    .object({
      A: z.string().catch("").default(""),
      B: z.string().catch("").default(""),
      C: z.string().catch("").default(""),
      bonus: z.string().catch("").default("")
    })
    .catch({
      A: "",
      B: "",
      C: "",
      bonus: ""
    })
    .default({
      A: "",
      B: "",
      C: "",
      bonus: ""
    }),
  score: z
    .object({
      interest: z.number().catch(0).default(0),
      risk: z.enum(["green", "yellow", "red"]).catch("yellow").default("yellow")
    })
    .catch({
      interest: 0,
      risk: "yellow"
    })
    .default({
      interest: 0,
      risk: "yellow"
    }),
  growth: z
    .object({
      quality: z.number().catch(0).default(0),
      investment: z.number().catch(0).default(0),
      tone: z.number().catch(0).default(0),
      power: z.number().catch(0).default(0)
    })
    .catch({
      quality: 0,
      investment: 0,
      tone: 0,
      power: 0
    })
    .default({
      quality: 0,
      investment: 0,
      tone: 0,
      power: 0
    })
});

export type AnalysisSchema = z.infer<typeof analysisSchema>;
