import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as Clipboard from "expo-clipboard";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Linking
} from "react-native";
import type { AnalysisResponse } from "@social-zeka-ai/types";
import { buildWhatsAppShareUrl } from "@social-zeka-ai/utils";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

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

export default function App() {
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
    await Clipboard.setStringAsync(text);
  };

  const handleAnalyze = async () => {
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
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Social Zeka AI</Text>
            <Text style={styles.subtitle}>Premium flört ve sosyal zekâ asistanın.</Text>
          </View>
          {analysis && (
            <TouchableOpacity onPress={() => Linking.openURL(shareUrl)} style={styles.shareButton}>
              <Text style={styles.shareText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Mesaj</Text>
          <TextInput
            style={styles.input}
            placeholder="Karşı taraftan gelen mesajı buraya yapıştır..."
            placeholderTextColor="#9aa3b2"
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <Text style={styles.label}>Kontekst (opsiyonel)</Text>
          <TextInput
            style={[styles.input, styles.contextInput]}
            placeholder="Önceki konuşma veya özel notlar..."
            placeholderTextColor="#9aa3b2"
            multiline
            value={context}
            onChangeText={setContext}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity style={styles.primaryButton} onPress={handleAnalyze} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? "Analiz ediliyor..." : "Analiz Et"}</Text>
          </TouchableOpacity>
        </View>

        {analysis && (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Vibe Check</Text>
              <Text style={styles.cardBody}>{analysis.vibe_check}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Taktik</Text>
              <Text style={styles.cardBody}>{analysis.strategy}</Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Skorlar</Text>
              <View style={styles.grid}>
                <View>
                  <Text style={styles.gridLabel}>İlgi</Text>
                  <Text style={styles.gridValue}>{formatScore(analysis.score.interest)}</Text>
                </View>
                <View>
                  <Text style={styles.gridLabel}>Risk</Text>
                  <Text style={[styles.gridValue, styles[`risk${analysis.score.risk}`]]}>
                    {analysis.score.risk}
                  </Text>
                </View>
                <View>
                  <Text style={styles.gridLabel}>Kalite</Text>
                  <Text style={styles.gridValue}>{formatScore(analysis.growth.quality)}</Text>
                </View>
                <View>
                  <Text style={styles.gridLabel}>Yatırım</Text>
                  <Text style={styles.gridValue}>{formatScore(analysis.growth.investment)}</Text>
                </View>
                <View>
                  <Text style={styles.gridLabel}>Tone</Text>
                  <Text style={styles.gridValue}>{formatScore(analysis.growth.tone)}</Text>
                </View>
                <View>
                  <Text style={styles.gridLabel}>Power</Text>
                  <Text style={styles.gridValue}>{formatScore(analysis.growth.power)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Persona A • Fırlama & Eğlenceli</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleCopy(analysis.responses.A)}>
                    <Text style={styles.actionText}>Kopyala</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Linking.openURL(buildWhatsAppShareUrl(analysis.responses.A))}>
                    <Text style={styles.actionText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardBody}>{analysis.responses.A}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Persona B • Soğuk & Gizemli</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleCopy(analysis.responses.B)}>
                    <Text style={styles.actionText}>Kopyala</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Linking.openURL(buildWhatsAppShareUrl(analysis.responses.B))}>
                    <Text style={styles.actionText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardBody}>{analysis.responses.B}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Persona C • Samimi & Zekice</Text>
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleCopy(analysis.responses.C)}>
                    <Text style={styles.actionText}>Kopyala</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => Linking.openURL(buildWhatsAppShareUrl(analysis.responses.C))}>
                    <Text style={styles.actionText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.cardBody}>{analysis.responses.C}</Text>
            </View>

            {analysis.responses.bonus ? (
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>Bonus • Soğuk Bitiriş</Text>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleCopy(analysis.responses.bonus)}>
                      <Text style={styles.actionText}>Kopyala</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => Linking.openURL(buildWhatsAppShareUrl(analysis.responses.bonus))}>
                      <Text style={styles.actionText}>WhatsApp</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.cardBody}>{analysis.responses.bonus}</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b0f1a"
  },
  content: {
    padding: 20,
    gap: 16
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#e6e9f2"
  },
  subtitle: {
    color: "#9aa3b2",
    marginTop: 4
  },
  shareButton: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  shareText: {
    color: "#e6e9f2",
    fontSize: 12
  },
  card: {
    backgroundColor: "#141a2a",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)"
  },
  label: {
    color: "#9aa3b2",
    marginBottom: 8
  },
  input: {
    backgroundColor: "#0f1526",
    borderRadius: 12,
    padding: 12,
    color: "#e6e9f2",
    minHeight: 120,
    marginBottom: 12
  },
  contextInput: {
    minHeight: 80
  },
  error: {
    color: "#ff5d6c",
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: "#7c5cff",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "600"
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e6e9f2",
    marginBottom: 8
  },
  cardBody: {
    color: "#e6e9f2",
    lineHeight: 20
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16
  },
  gridLabel: {
    color: "#9aa3b2",
    fontSize: 12,
    marginBottom: 4
  },
  gridValue: {
    color: "#e6e9f2",
    fontWeight: "600"
  },
  riskgreen: {
    color: "#4ade80"
  },
  riskyellow: {
    color: "#fbbf24"
  },
  riskred: {
    color: "#f87171"
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 8
  },
  actions: {
    flexDirection: "row",
    gap: 12
  },
  actionText: {
    color: "#7c5cff",
    fontSize: 12
  }
});
