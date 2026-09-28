"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/field";
import { CategoryGlyph } from "@/components/categories/category-icon";
import { useCategories } from "@/hooks/use-categories";
import { CATEGORY_COLORS, CATEGORY_ICONS, categoryStyle } from "@/lib/categories";
import { categorySchema } from "@/lib/validations/category";
import { fieldErrors, sanitizeText } from "@/lib/validations";
import { friendlyError } from "@/lib/utils/errors";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types/category";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Edit this category; omit to create */
  category?: Category | null;
  onSaved?: (c: Category) => void;
}

export function CategoryEditorSheet({ open, onClose, category, onSaved }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title={category ? "Edit category" : "New category"}>
      {open ? <CategoryEditorForm key={category?.id ?? "new"} category={category} onDone={(c) => { onSaved?.(c); onClose(); }} /> : null}
    </Sheet>
  );
}

function CategoryEditorForm({ category, onDone }: { category?: Category | null; onDone: (c: Category) => void }) {
  const { create, update } = useCategories();
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState<string>(category?.color ?? "teal");
  const [icon, setIcon] = useState<string>(category?.icon ?? "book-open");
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  async function save() {
    const parsed = categorySchema.safeParse({ name: sanitizeText(name), color, icon });
    if (!parsed.success) return setError(fieldErrors(parsed.error).name ?? "Please check the details.");
    setSaving(true);
    try {
      const c = category ? await update(category.id, parsed.data) : await create(parsed.data);
      toast.success(category ? "Category updated" : "Category created");
      onDone(c);
    } catch (err) {
      setError(friendlyError(err, category ? "Unable to update category." : "Unable to create category."));
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 pb-2 pt-2">
      <div className="flex items-end gap-3">
        <span style={categoryStyle(color)} className="cat-tint grid size-12 shrink-0 place-items-center rounded-2xl">
          <CategoryGlyph name={icon} className="size-6" />
        </span>
        <Field label="Name" error={error} className="flex-1">
          {(p) => <TextInput {...p} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Microbiology" maxLength={40} autoFocus />}
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-small font-medium text-muted">Color</legend>
        <div className="grid grid-cols-6 gap-2.5">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              aria-pressed={color === c}
              onClick={() => setColor(c)}
              style={categoryStyle(c)}
              className="cat-dot grid size-11 place-items-center rounded-full text-white ring-offset-2 ring-offset-surface transition aria-pressed:ring-2 aria-pressed:ring-[var(--cat)]"
            >
              {color === c ? <Check className="size-5 text-white mix-blend-normal dark:text-black" strokeWidth={3} aria-hidden /> : null}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-small font-medium text-muted">Icon</legend>
        <div className="grid grid-cols-6 gap-2">
          {CATEGORY_ICONS.map((i) => (
            <button
              key={i}
              type="button"
              aria-label={i.replace(/-/g, " ")}
              aria-pressed={icon === i}
              onClick={() => setIcon(i)}
              style={categoryStyle(color)}
              className={cn(
                "grid h-11 place-items-center rounded-xl transition",
                icon === i ? "cat-tint ring-2 ring-[var(--cat)]" : "bg-surface-2 text-muted hover:text-ink",
              )}
            >
              <CategoryGlyph name={i} className="size-5" />
            </button>
          ))}
        </div>
      </fieldset>

      <Button size="lg" onClick={save} loading={saving}>
        {category ? "Save changes" : "Create category"}
      </Button>
    </div>
  );
}
