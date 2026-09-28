import type { Metadata } from "next";
import { ReminderDetailView } from "@/components/reminders/reminder-detail-view";

export const metadata: Metadata = { title: "Reminder" };

export default async function ReminderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReminderDetailView id={id} />;
}
