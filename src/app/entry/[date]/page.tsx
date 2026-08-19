import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EntryScreen } from "@/components/entry/entry-editor";
import { formatFullDate, isValidIsoDate } from "@/lib/date";

export async function generateMetadata(
  props: PageProps<"/entry/[date]">,
): Promise<Metadata> {
  const { date } = await props.params;
  if (!isValidIsoDate(date)) return { title: "找不到這一天" };
  return { title: formatFullDate(date) };
}

export default async function EntryPage(props: PageProps<"/entry/[date]">) {
  const { date } = await props.params;
  if (!isValidIsoDate(date)) notFound();
  return <EntryScreen date={date} />;
}
