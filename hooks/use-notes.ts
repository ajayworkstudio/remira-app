"use client";

import { useMemo } from "react";
import { useData } from "@/components/providers/data-provider";

export function useNotes() {
  const d = useData();
  return useMemo(
    () => ({
      notes: d.data?.notes ?? [],
      loading: d.status === "loading",
      create: d.createNote,
      update: d.updateNote,
      remove: d.deleteNote,
    }),
    [d],
  );
}

export function useNote(id: string) {
  const d = useData();
  return { note: d.data?.notes.find((n) => n.id === id) ?? null, loading: d.status === "loading" };
}
