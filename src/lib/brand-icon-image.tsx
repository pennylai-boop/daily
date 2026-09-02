import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

/** 把 src/app/icon.svg 畫成指定尺寸的 PNG，給 iOS／Android 主畫面用。 */
export async function brandIconImage(size: number): Promise<ImageResponse> {
  const svg = await readFile(join(process.cwd(), "src/app/icon.svg"));
  const src = `data:image/svg+xml;base64,${svg.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" width={size} height={size} />
      </div>
    ),
    { width: size, height: size },
  );
}
