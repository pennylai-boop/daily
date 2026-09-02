import { brandIconImage } from "@/lib/brand-icon-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  return brandIconImage(180);
}
