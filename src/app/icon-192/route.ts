import { brandIconImage } from "@/lib/brand-icon-image";

export const runtime = "nodejs";

export function GET() {
  return brandIconImage(192);
}
