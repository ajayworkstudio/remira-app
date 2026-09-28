import type { Metadata } from "next";
import { EditNoteView } from "@/components/notes/note-views";

export const metadata: Metadata = { title: "Note" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditNoteView id={id} />;
}
