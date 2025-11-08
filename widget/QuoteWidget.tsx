// widget/QuoteWidget.tsx
import * as React from "react";
import { FlexWidget, TextWidget } from "react-native-android-widget";

type Props = { text?: string; copied?: boolean };

export function QuoteWidget(props: Props) {
  const text = props.text ?? "…";
  const copied = !!props.copied;

  return (
    <FlexWidget style={{ padding: 10, backgroundColor: "#11161d" }}>
      <TextWidget
        text={text}
        numberOfLines={3}
        style={{ color: "#e8eaed", fontSize: 14 }}
      />

      <FlexWidget
        style={{ marginTop: 6, flexDirection: "row", justifyContent: "center" }}
      >
        {/* Generate */}
        <TextWidget
          text="↻ Generate"
          clickAction="GEN"
          style={{ color: "#22c55e", padding: 6 }}
        />
        {/* Copy → ✓ */}
        <TextWidget
          text={copied ? "✓ Copied" : "📋 Copy"}
          clickAction="COPY"
          style={{
            color: copied ? "#22c55e" : "#cbd5e1",
            padding: 6,
            marginLeft: 12,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}