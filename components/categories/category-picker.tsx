"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useCategories } from "@/hooks/use-categories";
import { CategoryGlyph } from "@/components/categories/category-icon";
import { CategoryEditorSheet } from "@/components/categories/category-editor";
import { categoryStyle } from "@/lib/categories";
import { cn } from "@/lib/utils/cn";

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  label?: string;
}

/** Wrapping chip grid for choosing a category, with inline "New" creation. */
export function CategoryPicker({ value, onChange, label = "Category" }: Props) {
  const { categories } = useCategories();
  const [creating, setCreating] = useState(false);

  return (
    <fieldset>
      <legend className="mb-2 text-small font-medium text-muted">{label}</legend>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => onChange(null)}
          className={cn(
            "min-h-10 rounded-full border px-3.5 text-small font-medium transition",
            value === null ? "border-transparent bg-ink text-bg" : "border-line bg-surface text-muted",
          )}
        >
          None
        </button>
        {categories.map((c) => {
          const active = value === c.id;
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(c.id)}
              style={categoryStyle(c.color)}
              className={cn(
                "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-small font-medium transition",
                active ? "cat-tint border-[var(--cat)]" : "border-line bg-surface text-muted hover:text-ink",
              )}
            >
              <CategoryGlyph name={c.icon} className="size-4" />
              {c.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex min-h-10 items-center gap-1 rounded-full border border-dashed border-brand/50 px-3.5 text-small font-semibold text-brand"
        >
          <Plus className="size-4" aria-hidden /> New
        </button>
      </div>
      <CategoryEditorSheet open={creating} onClose={() => setCreating(false)} onSaved={(c) => onChange(c.id)} />
    </fieldset>
  );
}
