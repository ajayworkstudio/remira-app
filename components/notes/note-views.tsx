"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SearchX, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { NoteForm } from "@/components/notes/note-form";
import { ConfirmSheet } from "@/components/ui/sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useNote, useNotes } from "@/hooks/use-notes";
import { useNow } from "@/hooks/use-now";
import { relativeUpdated } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-80" />
      <Skeleton className="h-40" />
    </div>
  );
}

export function NewNoteView() {
  const router = useRouter();
  const { create, loading } = useNotes();
  return (
    <>
      <PageHeader title="New Note" backHref="/notes" backLabel="Notes" />
      {loading ? (
        <FormSkeleton />
      ) : (
        <NoteForm
          initial={{ title: "", content: "", category_id: null, tags: [] }}
          submitLabel="Save Note"
          onSubmit={async (input) => {
            try {
              await create(input);
              toast.success("Note created");
              router.push("/notes");
            } catch (err) {
              toast.error(friendlyError(err, "Unable to save note."));
              throw err;
            }
          }}
        />
      )}
    </>
  );
}

export function EditNoteView({ id }: { id: string }) {
  const router = useRouter();
  const now = useNow();
  const { note, loading } = useNote(id);
  const { update, remove } = useNotes();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (loading) {
    return (
      <>
        <PageHeader title="Note" backHref="/notes" backLabel="Notes" />
        <FormSkeleton />
      </>
    );
  }
  if (!note) {
    return (
      <>
        <PageHeader title="Note" backHref="/notes" backLabel="Notes" />
        <EmptyState
          icon={<SearchX className="size-7" aria-hidden />}
          title="Note not found"
          description="It may have been deleted on another device."
          action={<Link href="/notes" className="inline-flex h-11 items-center rounded-2xl bg-brand px-5 font-semibold text-on-brand">Back to notes</Link>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Edit Note"
        backHref="/notes"
        backLabel="Notes"
        subtitle={now ? relativeUpdated(note.updated_at, now) : undefined}
        actions={
          <Button variant="danger" size="icon" aria-label="Delete note" onClick={() => setConfirm(true)}>
            <Trash2 className="size-5" aria-hidden />
          </Button>
        }
      />
      <NoteForm
        key={note.id}
        initial={{ title: note.title, content: note.content ?? "", category_id: note.category_id, tags: note.tags }}
        submitLabel="Save Changes"
        onSubmit={async (input) => {
          try {
            await update(note.id, input);
            toast.success("Note updated");
            router.push("/notes");
          } catch (err) {
            toast.error(friendlyError(err, "Unable to update note."));
            throw err;
          }
        }}
      />
      <ConfirmSheet
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Delete note?"
        description={`"${note.title}" will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            await remove(note.id);
            toast.success("Note deleted");
            router.replace("/notes");
          } catch (err) {
            toast.error(friendlyError(err, "Unable to delete note."));
            setDeleting(false);
          }
        }}
      />
    </>
  );
}
