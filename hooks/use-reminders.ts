"use client";

import { useMemo } from "react";
import { useData } from "@/components/providers/data-provider";

export function useReminders() {
  const d = useData();
  return useMemo(
    () => ({
      reminders: d.data?.reminders ?? [],
      loading: d.status === "loading",
      create: d.createReminder,
      update: d.updateReminder,
      remove: d.deleteReminder,
      toggle: d.toggleReminder,
      duplicate: d.duplicateReminder,
    }),
    [d],
  );
}

export function useReminder(id: string) {
  const d = useData();
  return { reminder: d.data?.reminders.find((r) => r.id === id) ?? null, loading: d.status === "loading" };
}
