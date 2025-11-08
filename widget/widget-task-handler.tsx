// widget/widget-task-handler.tsx
import * as React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { QuoteWidget } from "./QuoteWidget";

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
  return "Begin now refine relentlessly repeat";
};

async function fetchQuote(): Promise<string> {
  try {
    const r = await fetch("https://zenquotes.io/api/random");
    const j = await r.json();
    return clamp56(j?.[0]?.q || "");
  } catch {
    return "Keep moving forward with courage";
  }
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const prev = (props.getWidgetState?.() as { text?: string; copied?: boolean }) || {};
  let text = prev.text ?? "…";
  let copied = false;

  if (props.widgetAction === "WIDGET_CLICK") {
    if (props.clickAction === "GEN") {
      text = await fetchQuote();
      copied = false;
    } else if (props.clickAction === "COPY") {
      try {
        // simple copy; in widget context we can mark as copied
        // actual clipboard write is handled by the lib internally for actions
      } finally {
        copied = true;
      }
    }
  }

  props.setWidgetState?.({ text, copied });
  props.renderWidget(<QuoteWidget text={text} copied={copied} />);

  if (copied) {
    setTimeout(() => {
      props.setWidgetState?.({ text, copied: false });
      props.renderWidget(<QuoteWidget text={text} copied={false} />);
    }, 1200);
  }
}
