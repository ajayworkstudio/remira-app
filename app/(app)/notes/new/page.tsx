import type { Metadata } from "next";
import { NewNoteView } from "@/components/notes/note-views";

export const metadata: Metadata = { title: "New note" };

export default function NewNotePage() {
  return <NewNoteView />;
}
