import React, { useEffect, useMemo, useState } from "react";
// index.js
import "./widget/QuoteWidget";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";

type ModelInfo = { name: string };

export default function IndexScreen() {
  const [quote, setQuote] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [apiBase, setApiBase] = useState<"/v1" | "/v1beta" | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(true);

  // toast state
  const [toast] = useState(new Animated.Value(0));
  const [toastMsg, setToastMsg] = useState("");

  // read key from app.json → expo.extra.GEMINI_API_KEY
  const apiKey = (Constants.expoConfig as any)?.extra?.GEMINI_API_KEY as
    | string
    | undefined;

  const normalize = (text: string) => {
  // clean & collapse spaces
  const cleaned = (text || "")
    .replace(/[“”"’']/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "";

  // sentence-case the first word, no trailing punctuation
  const noTrail = cleaned.replace(/[.?!,\-–—;:]+$/g, "");
  const words = noTrail.split(" ").filter(Boolean);

  // hard rule: exactly 6 or (fallback) 5 words; reject others
  if (words.length === 6) {
    words[0] = words[0][0]?.toUpperCase() + words[0].slice(1);
    return words.join(" ");
  }
  if (words.length === 5) {
    words[0] = words[0][0]?.toUpperCase() + words[0].slice(1);
    return words.join(" ");
  }
  return ""; // signal invalid so we can retry
};

  const showToast = (message: string) => {
    setToastMsg(message);
    Animated.sequence([
      Animated.timing(toast, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toast, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  // discover valid base + model for THIS key
  useEffect(() => {
    (async () => {
      try {
        if (!apiKey) {
          setErr("Missing GEMINI_API_KEY in app.json → expo.extra");
          setDiscovering(false);
          return;
        }
        setErr(null);
        setDiscovering(true);

        const bases: Array<"/v1" | "/v1beta"> = ["/v1", "/v1beta"];
        let foundBase: "/v1" | "/v1beta" | null = null;
        let foundModel: string | null = null;

        for (const base of bases) {
          try {
            const listRes = await fetch(
              `https://generativelanguage.googleapis.com${base}/models?key=${apiKey}`
            );
            if (!listRes.ok) throw new Error(`ListModels ${base} HTTP ${listRes.status}`);
            const listJson = await listRes.json();
            const models: ModelInfo[] = listJson?.models || [];

            const preferred = [
              "gemini-2.5-flash-lite",
              "gemini-2.5-flash",
              "gemini-2.0-flash-lite",
              "gemini-1.5-flash-latest",
              "gemini-1.5-flash-8b",
              "gemini-1.5-flash",
            ];

            const byPreference =
              preferred.find(p =>
                models.some(m => m.name?.endsWith(`/${p}`) || m.name === p)
              ) || null;

            if (byPreference) {
              const match =
                models.find(m => m.name?.endsWith(`/${byPreference}`) || m.name === byPreference)!;
              foundBase = base;
              foundModel = match.name.includes("/")
                ? match.name.split("/").pop()!
                : match.name;
              break;
            }

            const anyFlash = models.find(m => /flash/i.test(m.name || ""));
            if (anyFlash) {
              foundBase = base;
              foundModel = anyFlash.name.includes("/")
                ? anyFlash.name.split("/").pop()!
                : anyFlash.name;
              break;
            }
          } catch {
            // try next base
          }
        }

        if (!foundBase || !foundModel) {
          throw new Error(
            "No compatible Gemini model found for this API key. Enable Generative Language API for your project, then restart."
          );
        }

        setApiBase(foundBase);
        setModel(foundModel);
      } catch (e: any) {
        setErr(e?.message || String(e));
      } finally {
        setDiscovering(false);
      }
    })();
  }, [apiKey]);

  const canGenerate = useMemo(() => !!apiKey && !!apiBase && !!model, [apiKey, apiBase, model]);

  const fetchQuote = async () => {
  setErr(null);
  if (!canGenerate) {
    setErr("Model not ready yet. If this persists, check API key & project enablement.");
    return;
  }
  try {
    setLoading(true);
    setQuote("");

    // Strong prompt: complete aphorism, exactly 6 (or 5) words
    const makeBody = (temp: number) => ({
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                "Write one complete quote in exactly strictly six words.\n" +
                
                "No author names, hashtags, emojis, or quotation marks. no more than six words\n \n" +
                "Words only. If six is impossible, use exactly five words.\n\n" +
                "Examples (do not reuse):\n" +
                
                "- Endless dreams beneath open skies\n" +
                "- The journey matters more than destination\n" +
                "- Strong Roots, Limitless Growth\n"
                
                
            }
          ]
        }
      ],
      generationConfig: { maxOutputTokens: 24, temperature: temp, topP: 0.9 }
    });

    const endpoint = `https://generativelanguage.googleapis.com${apiBase}/models/${model}:generateContent?key=${apiKey}`;

    const callOnce = async (temp: number) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(makeBody(temp))
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
      }
      const data = await res.json();
      const raw =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join(" ").trim() ||
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        data?.candidates?.[0]?.output_text ||
        "";
      return normalize(raw);
    };

    // try once with lower temp (more coherent), then a second attempt if invalid
    let out = await callOnce(0.7);
    if (!out) out = await callOnce(0.5);

    if (!out) throw new Error("Model returned incomplete/invalid line twice");
    setQuote(out);
  } catch (e: any) {
    const msg = e?.message || String(e);
    setErr(msg);
    setQuote("Create boldly iterate daily");
  } finally {
    setLoading(false);
  }
};
  
  
  const copyQuote = async () => {
    if (!quote) return;
    try {
      await Clipboard.setStringAsync(quote);
      showToast("Copied ✓");
    } catch {
      showToast("Copy failed");
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <Text style={styles.title}>Tiny Quotes</Text>
        <Text style={styles.subtitle}>
          {discovering ? "Discovering models…" : canGenerate ? `powered by: ${model}` : "Model not ready"}
        </Text>

        <View style={styles.card}>
          {loading || discovering ? (
            <ActivityIndicator />
          ) : (
            <>
              <Text style={styles.quote}>{quote || "Press Generate"}</Text>
              {err ? <Text style={styles.error}>{err}</Text> : null}
            </>
          )}

          <TouchableOpacity
            style={styles.btn}
            onPress={fetchQuote}
            disabled={!canGenerate || loading || discovering}
          >
            <Text style={styles.btnText}>
              {!canGenerate || discovering ? "Waiting…" : loading ? "Loading…" : "Generate"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnOutline]}
            onPress={copyQuote}
            disabled={!quote || loading || discovering}
          >
            <Text style={[styles.btnText, styles.btnTextOutline]}>Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Toast */}
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toast,
              transform: [
                {
                  translateY: toast.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0f14" },
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, gap: 16 },
  title: { fontSize: 26, fontWeight: "800", color: "#e8eaed" },
  subtitle: { fontSize: 12, color: "#9aa0a6" },
  card: {
    width: "100%",
    backgroundColor: "#11161d",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#1f2937",
    gap: 16,
  },
  quote: { color: "#e8eaed", fontSize: 24, fontWeight: "700", lineHeight: 30, minHeight: 60, textAlign: "center" },
  error: { color: "#ef4444", fontSize: 12, textAlign: "center" },
  btn: { backgroundColor: "#22c55e", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnText: { color: "#0b0f14", fontWeight: "800", fontSize: 16 },
  btnOutline: { backgroundColor: "transparent", borderWidth: 1, borderColor: "#334155" },
  btnTextOutline: { color: "#cbd5e1" },
  toast: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    backgroundColor: "rgba(34,197,94,0.9)",
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  toastText: { color: "#0b0f14", fontWeight: "700", fontSize: 14 },
});