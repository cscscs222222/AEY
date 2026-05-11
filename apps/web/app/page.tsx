"use client";

import { useMemo, useState } from "react";
import { Card, Button } from "@social-zeka-ai/ui";
import type { AnalysisResponse } from "@social-zeka-ai/types";
import { buildWhatsAppShareUrl } from "@social-zeka-ai/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const buildShareText = (analysis: AnalysisResponse) =>
  [
    `Vibe: ${analysis.vibe_check}`,
    `Strateji: ${analysis.strategy}`,
    `A: ${analysis.responses.A}`,
    `B: ${analysis.responses.B}`,
    `C: ${analysis.responses.C}`,
    analysis.responses.bonus ? `Bonus: ${analysis.responses.bonus}` : ""
  ]
    .filter(Boolean)
    .join("\n");

const formatScore = (value: number) => `${Math.round(value)}/100`;

export default function Home() {
  const [message, setMessage] = useState("");
  const [context, setContext] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const shareUrl = useMemo(() => (analysis ? buildWhatsAppShareUrl(buildShareText(analysis)) : ""), [
    analysis
  ]);

  const handleCopy = async (text: string) => {
    if (!text) {
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  const analyze = async () => {
    if (!message.trim()) {
      setError("Önce bir mesaj gir.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/analyze-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context: context || undefined })
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Analiz başarısız.");
      }
      const data = (await response.json()) as AnalysisResponse;
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sunucu hatası.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sz-app">
      <header className="sz-header">
        <div>
          <h1>Social Zeka AI</h1>
          <p>Premium flört ve sosyal zekâ asistanın.</p>
        </div>
        {analysis && (
          <a className="sz-share" href={shareUrl} target="_blank" rel="noreferrer">
            WhatsApp’ta paylaş
          </a>
        )}
      </header>

      <main className="sz-main">
        <Card title="Mesaj Analizi">
          <label className="sz-label" htmlFor="message">
            Mesaj
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Karşı taraftan gelen mesajı buraya yapıştır..."
          />
          <label className="sz-label" htmlFor="context">
            Kontekst (opsiyonel)
          </label>
          <textarea
            id="context"
            value={context}
            onChange={(event) => setContext(event.target.value)}
            placeholder="Önceki konuşma veya özel notlar..."
            rows={4}
          />
          {error && <div className="sz-error">{error}</div>}
          <Button onClick={analyze} disabled={loading}>
            {loading ? "Analiz ediliyor..." : "Analiz Et"}
          </Button>
        </Card>

        {analysis && (
          <div className="sz-results">
            <Card title="Vibe Check">
              <p>{analysis.vibe_check}</p>
            </Card>
            <Card title="Taktik">
              <p>{analysis.strategy}</p>
            </Card>
            <Card title="Skorlar">
              <div className="sz-grid">
                <div>
                  <span>İlgi</span>
                  <strong>{formatScore(analysis.score.interest)}</strong>
                </div>
                <div>
                  <span>Risk</span>
                  <strong className={`sz-risk sz-risk-${analysis.score.risk}`}>{analysis.score.risk}</strong>
                </div>
                <div>
                  <span>Kalite</span>
                  <strong>{formatScore(analysis.growth.quality)}</strong>
                </div>
                <div>
                  <span>Yatırım</span>
                  <strong>{formatScore(analysis.growth.investment)}</strong>
                </div>
                <div>
                  <span>Tone</span>
                  <strong>{formatScore(analysis.growth.tone)}</strong>
                </div>
                <div>
                  <span>Power</span>
                  <strong>{formatScore(analysis.growth.power)}</strong>
                </div>
              </div>
            </Card>

            <Card
              title="Persona A • Fırlama & Eğlenceli"
              action={
                <div className="sz-actions">
                  <Button variant="ghost" onClick={() => handleCopy(analysis.responses.A)}>
                    Kopyala
                  </Button>
                  <a className="sz-link" href={buildWhatsAppShareUrl(analysis.responses.A)} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </div>
              }
            >
              <p>{analysis.responses.A}</p>
            </Card>

            <Card
              title="Persona B • Soğuk & Gizemli"
              action={
                <div className="sz-actions">
                  <Button variant="ghost" onClick={() => handleCopy(analysis.responses.B)}>
                    Kopyala
                  </Button>
                  <a className="sz-link" href={buildWhatsAppShareUrl(analysis.responses.B)} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </div>
              }
            >
              <p>{analysis.responses.B}</p>
            </Card>

            <Card
              title="Persona C • Samimi & Zekice"
              action={
                <div className="sz-actions">
                  <Button variant="ghost" onClick={() => handleCopy(analysis.responses.C)}>
                    Kopyala
                  </Button>
                  <a className="sz-link" href={buildWhatsAppShareUrl(analysis.responses.C)} target="_blank" rel="noreferrer">
                    WhatsApp
                  </a>
                </div>
              }
            >
              <p>{analysis.responses.C}</p>
            </Card>

            {analysis.responses.bonus && (
              <Card
                title="Bonus • Soğuk Bitiriş"
                action={
                  <div className="sz-actions">
                    <Button variant="ghost" onClick={() => handleCopy(analysis.responses.bonus)}>
                      Kopyala
                    </Button>
                    <a
                      className="sz-link"
                      href={buildWhatsAppShareUrl(analysis.responses.bonus)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      WhatsApp
                    </a>
                  </div>
                }
              >
                <p>{analysis.responses.bonus}</p>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
