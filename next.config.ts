import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloud Run 映像只帶必要檔案；見 Dockerfile 的 runner 階段。
  output: "standalone",
};

export default nextConfig;
