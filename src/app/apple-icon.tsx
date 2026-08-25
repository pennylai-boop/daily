import { ImageResponse } from "next/og";

// iOS 的主畫面圖示只吃點陣圖，所以用同一個太陽造型產生 PNG。
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

const BRAND = "#e86e2c";
const PAPER = "#ffffff";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND,
          position: "relative",
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 68,
            background: PAPER,
          }}
        />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <div
            key={angle}
            style={{
              position: "absolute",
              width: 14,
              height: 24,
              borderRadius: 14,
              background: PAPER,
              transform: `rotate(${angle}deg) translateY(-56px)`,
            }}
          />
        ))}
      </div>
    ),
    size,
  );
}
