import "dotenv/config";

import Fastify, { type FastifyReply, type FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import postgres from "@fastify/postgres";
import { z } from "zod";
import { buildTrendReport, runAIAnalysis } from "@social-zeka-ai/ai-engine";
import type {
  AnalysisResponse,
  AnalyzeMessageRequest,
  ConversationMessage,
  SaveMessageRequest
} from "@social-zeka-ai/types";

type TrendRow = {
  created_at: string;
  interest: number;
  risk: "green" | "yellow" | "red";
  quality: number;
  investment: number;
  tone: number;
  power: number;
};

const envSchema = z.object({
  PORT: z.string().default("4000"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENAI_BASE_URL: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  CORS_ORIGINS: z.string().optional()
});

const env = envSchema.parse(process.env);

const fastify = Fastify({
  logger: true
});

const corsOrigins = env.CORS_ORIGINS?.split(",").map((origin) => origin.trim()).filter(Boolean);

await fastify.register(cors, {
  origin: corsOrigins && corsOrigins.length > 0 ? corsOrigins : true
});

if (env.DATABASE_URL) {
  await fastify.register(postgres, {
    connectionString: env.DATABASE_URL
  });
}

const analysisRequestSchema = z.object({
  message: z.string().min(1),
  context: z.string().optional()
});

const saveMessageSchema = z.object({
  userId: z.string().optional(),
  message: z.string().min(1),
  context: z.string().optional(),
  analysis: z.custom<AnalysisResponse>().optional()
});

const requireDatabase = () => {
  if (!fastify.pg) {
    return false;
  }
  return true;
};

const requireOpenAI = () => {
  if (!env.OPENAI_API_KEY) {
    return false;
  }
  return true;
};

fastify.get("/health", async () => ({ status: "ok" }));

const performAnalysis = async (
  request: FastifyRequest,
  reply: FastifyReply,
  payload: AnalyzeMessageRequest
): Promise<AnalysisResponse | undefined> => {
  try {
    return await runAIAnalysis(payload.message, payload.context, {
      apiKey: env.OPENAI_API_KEY ?? "",
      model: env.OPENAI_MODEL,
      baseUrl: env.OPENAI_BASE_URL
    });
  } catch (error) {
    request.log.error({ err: error }, "LLM analysis failed");
    reply.status(502).send({ error: "LLM servisine ulaşılamadı." });
    return undefined;
  }
};

fastify.post("/analyze-message", async (request, reply) => {
  const body = analysisRequestSchema.safeParse(request.body);
  if (!body.success) {
    return reply.status(400).send({ error: "Message is required." });
  }

  if (!requireOpenAI()) {
    return reply.status(500).send({ error: "OPENAI_API_KEY is not configured." });
  }

  const payload = body.data as AnalyzeMessageRequest;
  const analysis = await performAnalysis(request, reply, payload);
  if (!analysis) {
    return;
  }

  return analysis;
});

fastify.post("/save-message", async (request, reply) => {
  const body = saveMessageSchema.safeParse(request.body);
  if (!body.success) {
    return reply.status(400).send({ error: "Message is required." });
  }

  if (!requireDatabase()) {
    return reply.status(503).send({ error: "Database is not configured." });
  }

  const payload = body.data as SaveMessageRequest;
  let analysis = payload.analysis;

  if (!analysis) {
    if (!requireOpenAI()) {
      return reply.status(500).send({ error: "OPENAI_API_KEY is not configured." });
    }
    analysis = await performAnalysis(request, reply, payload);
    if (!analysis) {
      return;
    }
  }

  const client = await fastify.pg.connect();
  try {
    const messageResult = await client.query<ConversationMessage>(
      `insert into conversation_messages (user_id, message, context)
       values ($1, $2, $3)
       returning id, user_id, message, context, created_at`,
      [payload.userId ?? null, payload.message, payload.context ?? null]
    );

    const messageRow = messageResult.rows[0];
    await client.query(
      `insert into conversation_scores (message_id, interest, risk)
       values ($1, $2, $3)`,
      [messageRow.id, analysis.score.interest, analysis.score.risk]
    );
    await client.query(
      `insert into user_growth_scores (message_id, quality, investment, tone, power)
       values ($1, $2, $3, $4, $5)`,
      [
        messageRow.id,
        analysis.growth.quality,
        analysis.growth.investment,
        analysis.growth.tone,
        analysis.growth.power
      ]
    );

    return {
      message: messageRow,
      analysis
    };
  } finally {
    client.release();
  }
});

fastify.get("/conversation-history", async (request, reply) => {
  if (!requireDatabase()) {
    return reply.status(503).send({ error: "Database is not configured." });
  }

  const userId = (request.query as { userId?: string }).userId;
  const params = userId ? [userId] : [];
  const query = userId
    ? `select id, user_id, message, context, created_at
       from conversation_messages
       where user_id = $1
       order by created_at desc
       limit 20`
    : `select id, user_id, message, context, created_at
       from conversation_messages
       order by created_at desc
       limit 20`;

  const result = await fastify.pg.query<ConversationMessage>(query, params);
  return { messages: result.rows };
});

fastify.get("/trend-report", async (request, reply) => {
  if (!requireDatabase()) {
    return reply.status(503).send({ error: "Database is not configured." });
  }

  const userId = (request.query as { userId?: string }).userId;
  const params = userId ? [userId] : [];
  const query = userId
    ? `select m.created_at,
          s.interest,
          s.risk,
          g.quality,
          g.investment,
          g.tone,
          g.power
        from conversation_messages m
        join conversation_scores s on s.message_id = m.id
        join user_growth_scores g on g.message_id = m.id
        where m.user_id = $1
        order by m.created_at desc
        limit 200`
    : `select m.created_at,
          s.interest,
          s.risk,
          g.quality,
          g.investment,
          g.tone,
          g.power
        from conversation_messages m
        join conversation_scores s on s.message_id = m.id
        join user_growth_scores g on g.message_id = m.id
        order by m.created_at desc
        limit 200`;

  const result = await fastify.pg.query<TrendRow>(query, params);

  const trend = buildTrendReport(
    (result.rows as TrendRow[]).map((row) => ({
      createdAt: row.created_at,
      interest: row.interest,
      risk: row.risk,
      growth: {
        quality: row.quality,
        investment: row.investment,
        tone: row.tone,
        power: row.power
      }
    }))
  );

  return trend;
});

await fastify.listen({
  port: Number(env.PORT),
  host: "0.0.0.0"
});
