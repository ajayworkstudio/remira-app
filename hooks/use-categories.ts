"use client";

import { useMemo } from "react";
import { useData } from "@/components/providers/data-provider";
import type { Category } from "@/types/category";

export function useCategories() {
  const d = useData();
  return useMemo(() => {
    const categories = d.data?.categories ?? [];
    const byId = new Map<string, Category>(categories.map((c) => [c.id, c]));
    return {
      categories,
      byId,
      loading: d.status === "loading",
      create: d.createCategory,
      update: d.updateCategory,
      remove: d.deleteCategory,
    };
  }, [d]);
}
