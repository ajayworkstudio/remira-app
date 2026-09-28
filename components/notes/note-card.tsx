"use client";

import Link from "next/link";
import { CategoryBadge } from "@/components/categories/category-icon";
import { useCategories } from "@/hooks/use-categories";
import { relativeUpdated } from "@/lib/utils/date";
import type { Note } from "@/types/note";

function preview(content: string | null): string {
  return (content ?? "")
    .replace(/^#+\s*/gm, "")
    .replace(/\*\*|__|`/g, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);
}

export function NoteCard({ note, now }: { note: Note; now: Date | null }) {
  const { byId } = useCategories();
  const category = note.category_id ? byId.get(note.category_id) : null;
  const text = preview(note.content);
  return (
    <Link
      href={`/notes/${note.id}`}
      className="flex animate-rise flex-col gap-2 rounded-[var(--radius-card)] bg-surface p-4 shadow-card transition hover:-translate-y-px active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-2">
        {category ? <CategoryBadge category={category} /> : <span className="text-caption font-semibold text-subtle">Uncategorized</span>}
        {now ? <span className="shrink-0 text-caption text-subtle">{relativeUpdated(note.updated_at, now)}</span> : null}
      </div>
      <h3 className="line-clamp-2 text-headline font-semibold text-ink">{note.title}</h3>
      {text ? <p className="line-clamp-3 text-small text-muted">{text}</p> : null}
      {note.tags.length ? (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {note.tags.slice(0, 5).map((t) => (
            <span key={t} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-caption font-medium text-muted">
              #{t}
            </span>
          ))}
        </div>
      ) : null}
    </Link>
  );
}
