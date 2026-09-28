"use client";

import { useState, type FormEvent, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextArea, TextInput } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { CategoryPicker } from "@/components/categories/category-picker";
import { MarkdownPreview } from "@/components/notes/markdown-preview";
import { noteSchema } from "@/lib/validations/note";
import { fieldErrors, normalizeTags, sanitizeText } from "@/lib/validations";
import type { NoteInput } from "@/types/note";

interface Props {
  initial: { title: string; content: string; category_id: string | null; tags: string[] };
  submitLabel: string;
  onSubmit: (input: NoteInput) => Promise<void>;
}

export function NoteForm({ initial, submitLabel, onSubmit }: Props) {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [view, setView] = useState<"write" | "preview">("write");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  function commitTag() {
    const next = normalizeTags([...tags, ...tagDraft.split(/[,\s]+/)]);
    setTags(next.slice(0, 12));
    setTagDraft("");
  }
  function onTagKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitTag();
    } else if (e.key === "Backspace" && !tagDraft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const finalTags = normalizeTags([...tags, ...tagDraft.split(/[,\s]+/)]);
    const parsed = noteSchema.safeParse({
      title: sanitizeText(title),
      content: content.trim() ? sanitizeText(content) : null,
      category_id: categoryId,
      tags: finalTags,
    });
    if (!parsed.success) return setErrors(fieldErrors(parsed.error));
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(parsed.data as NoteInput);
    } catch {
      /* toast shown by caller */
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] bg-surface p-4 shadow-card">
        <Field label="Title" error={errors.title} hideLabel>
          {(p) => (
            <TextInput
              {...p}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title"
              maxLength={160}
              autoFocus={!initial.title}
              className="h-14 border-transparent bg-surface-2 text-headline font-semibold"
            />
          )}
        </Field>
        <Segmented
          label="Editor mode"
          value={view}
          onChange={setView}
          options={[
            { value: "write", label: "Write" },
            { value: "preview", label: "Preview" },
          ]}
        />
        {view === "write" ? (
          <Field label="Content" error={errors.content} hideLabel hint="Supports # headings, - lists, **bold**, *italic*, `code`.">
            {(p) => (
              <TextArea
                {...p}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Capture something worth remembering…"
                className="min-h-[45dvh] border-transparent bg-surface-2 md:min-h-80"
              />
            )}
          </Field>
        ) : (
          <div className="min-h-[45dvh] rounded-2xl bg-surface-2 p-4 md:min-h-80">
            {content.trim() ? <MarkdownPreview content={content} /> : <p className="text-muted">Nothing to preview yet.</p>}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] bg-surface p-4 shadow-card">
        <CategoryPicker value={categoryId} onChange={setCategoryId} />
        <Field label="Tags" error={errors.tags} hint="Press Enter or comma to add.">
          {(p) => (
            <div className="flex min-h-12 flex-wrap items-center gap-1.5 rounded-2xl border border-line bg-surface px-2 py-1.5 focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-0.5 rounded-lg bg-brand-softer py-1 pl-2 pr-0.5 text-small font-medium text-brand">
                  #{t}
                  <button type="button" onClick={() => setTags(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="grid size-7 place-items-center rounded-md">
                    <X className="size-3.5" aria-hidden />
                  </button>
                </span>
              ))}
              <input
                {...p}
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={onTagKey}
                onBlur={() => tagDraft.trim() && commitTag()}
                placeholder={tags.length ? "" : "cardio, pharm…"}
                className="h-9 min-w-24 flex-1 bg-transparent px-2 text-ink placeholder:text-subtle focus:outline-none"
                enterKeyHint="done"
              />
            </div>
          )}
        </Field>
      </div>

      <Button type="submit" size="lg" loading={saving}>
        {submitLabel}
      </Button>
    </form>
  );
}
