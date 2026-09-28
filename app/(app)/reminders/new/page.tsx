import type { Metadata } from "next";
import { NewReminderView } from "@/components/reminders/new-reminder-view";

export const metadata: Metadata = { title: "New reminder" };

export default async function NewReminderPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  const safeDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  return <NewReminderView date={safeDate} />;
}
