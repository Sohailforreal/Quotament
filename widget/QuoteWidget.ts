// widgets/QuoteWidget.tsx
import { AppRegistry } from "react-native";
import {
  defineWidget,
  TextView,
  Row,
  Column,
  onReceive,
} from "react-native-android-widget";

// A single widget name/id
const WIDGET_NAME = "QuoteWidget";

// ---- Helpers ----
const clamp56 = (txt: string) => {
  const cleaned = (txt || "")
    .replace(/[“”"’']/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.?!,\-–—;:]+$/g, "");
  const parts = cleaned.split(" ").filter(Boolean);
  if (parts.length >= 6) return parts.slice(0, 6).join(" ");
  if (parts.length === 5) return cleaned;
  return "Begin now refine relentlessly repeat"; // fallback 5 words
};

// Tiny 5–6 words via your existing Gemini endpoint (or fallback)
async function fetchQuote(): Promise<string> {
  try {
    // Simple public fallback to avoid blocking while you wire Gemini key into widget:
    const r = await fetch("https://zenquotes.io/api/random");
    const j = await r.json();
    const out = clamp56(j?.[0]?.q || "");
    return out || "Small steps compound into momentum";
  } catch {
    return "Keep moving forward with courage";
  }
}

// ---- Widget layout (RemoteViews) ----
// We use text buttons (↻ generate, 📋/✓ copy) so no drawables required.
export const QuoteWidget = defineWidget(WIDGET_NAME, ({ state }) => {
  const quote = state.quote || "…";
  const copied = state.copied === true;

  return (
    <Column padding={10} background="#11161d">
      <TextView
        id="quote"
        text={quote}
        textColor="#e8eaed"
        textSize={14}
        maxLines={3}
      />
      <Row marginTop={6} gravity="center">
        <TextView
          id="btnGen"
          text="↻ Generate"
          textColor="#22c55e"
          onPress="ACTION_GENERATE"
          padding={6}
        />
        <TextView
          id="btnCopy"
          text={copied ? "✓ Copied" : "📋 Copy"}
          textColor={copied ? "#22c55e" : "#cbd5e1"}
          onPress="ACTION_COPY"
          padding={6}
          marginLeft={12}
        />
      </Row>
    </Column>
  );
});

// ---- Handle widget clicks (background) ----
onReceive(WIDGET_NAME, async (action, context) => {
  if (action === "ACTION_GENERATE") {
    const q = await fetchQuote();
    await context.updateWidgetState({ quote: q, copied: false });
  } else if (action === "ACTION_COPY") {
    const q = (context.getState() as any)?.quote || "";
    if (q) await context.copyToClipboard(q);
    await context.updateWidgetState({ copied: true });
    // auto-reset ✓ after 1.2s
    setTimeout(() => {
      context.updateWidgetState({ copied: false });
    }, 1200);
  }
});

// Register once
AppRegistry.registerComponent(WIDGET_NAME, () => QuoteWidget);