"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import { NotebookPen, Plus, SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Fab } from "@/components/layout/fab";
import { NoteCard } from "@/components/notes/note-card";
import { CategoryGlyph } from "@/components/categories/category-icon";
import { Chip, ChipRow } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotes } from "@/hooks/use-notes";
import { useCategories } from "@/hooks/use-categories";
import { useNow } from "@/hooks/use-now";
import { categoryStyle } from "@/lib/categories";

export function NotesView() {
  const now = useNow();
  const { notes, loading } = useNotes();
  const { categories } = useCategories();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const q = useDeferredValue(query.trim().toLowerCase().replace(/^#/, ""));

  // Only show categories that have notes, so the filter row stays short
  const usedCategories = useMemo(() => {
    const used = new Set(notes.map((n) => n.category_id));
    return categories.filter((c) => used.has(c.id));
  }, [notes, categories]);

  const filtered = useMemo(
    () =>
      notes.filter((n) => {
        if (category && n.category_id !== category) return false;
        if (!q) return true;
        return n.title.toLowerCase().includes(q) || (n.content ?? "").toLowerCase().includes(q) || n.tags.some((t) => t.includes(q));
      }),
    [notes, category, q],
  );

  return (
    <>
      <PageHeader title="Notes" subtitle={loading ? " " : `${notes.length} note${notes.length === 1 ? "" : "s"}`} />
      <div className="sticky top-0 z-20 -mx-4 mb-5 flex flex-col gap-3 bg-bg/85 px-4 pb-3 pt-2 backdrop-blur-xl md:static md:mx-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <SearchInput value={query} onChange={setQuery} placeholder="Search titles, content, #tags" label="Search notes" />
        {usedCategories.length ? (
          <ChipRow label="Category filter">
            <Chip active={category === null} onClick={() => setCategory(null)}>All</Chip>
            {usedCategories.map((c) => (
              <Chip
                key={c.id}
                active={category === c.id}
                onClick={() => setCategory(category === c.id ? null : c.id)}
                tintStyle={categoryStyle(c.color)}
                icon={<CategoryGlyph name={c.icon} className="size-3.5 text-[var(--cat)]" />}
              >
                {c.name}
              </Chip>
            ))}
          </ChipRow>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36 rounded-[var(--radius-card)]" />)}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState
          icon={<NotebookPen className="size-7" aria-hidden />}
          title="No notes yet"
          description="Capture something worth remembering."
          action={
            <Link href="/notes/new" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-5 font-semibold text-on-brand">
              <Plus className="size-4" aria-hidden /> Create Note
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={<SearchX className="size-7" aria-hidden />} title="No matching notes" description="Try another word or tag." />
      ) : (
        <section aria-label="Recently updated" aria-live="polite">
          <h2 className="mb-3 text-headline font-bold text-ink">Recently updated</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((n) => <NoteCard key={n.id} note={n} now={now} />)}
          </div>
        </section>
      )}
      <Fab href="/notes/new" label="New note" />
    </>
  );
}
