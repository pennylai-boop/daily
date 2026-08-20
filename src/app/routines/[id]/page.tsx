import type { Metadata } from "next";

import { RoutineDetailScreen } from "./routine-detail-screen";

// 事項的名稱存在瀏覽器的 localStorage，伺服器端拿不到，所以標題只能是固定字串。
export const metadata: Metadata = { title: "定期目標統計" };

export default async function RoutineDetailPage(props: PageProps<"/routines/[id]">) {
  const { id } = await props.params;
  return <RoutineDetailScreen id={id} />;
}
