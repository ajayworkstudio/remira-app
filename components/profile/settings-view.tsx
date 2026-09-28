"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { BellOff, BellRing, CalendarPlus, Download, Info, LogOut, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { SettingsGroup, SettingsRow } from "@/components/profile/settings-list";
import { Segmented } from "@/components/ui/segmented";
import { Select } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ConfirmSheet } from "@/components/ui/sheet";
import { CategoryAvatar } from "@/components/categories/category-icon";
import { CategoryEditorSheet } from "@/components/categories/category-editor";
import { useData } from "@/components/providers/data-provider";
import { useCategories } from "@/hooks/use-categories";
import { useProfile } from "@/hooks/use-profile";
import { useNotifications } from "@/hooks/use-notifications";
import { useMounted } from "@/hooks/use-mounted";
import { useSignOut } from "@/hooks/use-sign-out";
import { CalendarService } from "@/lib/calendar/calendar-service";
import { NotificationService } from "@/lib/notifications/notification-service";
import { NOTIFICATION_OPTIONS } from "@/lib/utils/date";
import { friendlyError } from "@/lib/utils/errors";
import type { Category } from "@/types/category";
import type { ProfilePreferences } from "@/types/profile";

type ThemeChoice = "system" | "light" | "dark";

export function SettingsView() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const { mode, data } = useData();
  const { preferences, update } = useProfile();
  const { categories, remove } = useCategories();
  const n = useNotifications();
  const { signOut, busy: signingOut } = useSignOut();
  const [editing, setEditing] = useState<Category | null | "new">(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  async function setPref(patch: ProfilePreferences) {
    try {
      await update({ preferences: { ...preferences, ...patch } });
    } catch (err) {
      toast.error(friendlyError(err, "Unable to save preference."));
    }
  }

  async function togglePush(on: boolean) {
    try {
      if (on) {
        await n.enable();
        toast.success("Notifications enabled");
      } else {
        await n.disable();
        toast("Notifications turned off on this device");
      }
    } catch (err) {
      toast.error(friendlyError(err, "Couldn't change notification settings."));
    }
  }

  const pushDetail = !n.ready
    ? "Checking…"
    : n.needsInstall
      ? "On iPhone, first add Remira to your Home Screen (Share → Add to Home Screen)."
      : n.permission === "denied"
        ? "Blocked — allow notifications for Remira in your browser or iOS Settings."
        : !n.pushSupported
          ? "This browser doesn't support push notifications."
          : mode === "demo"
            ? "Requires Supabase — not available in demo mode."
            : n.subscribed
              ? "On for this device"
              : "Remira can remind you about important tasks and deadlines.";

  return (
    <>
      <PageHeader title="Settings" backHref="/profile" backLabel="Profile" />
      <div className="flex flex-col gap-7">
        <SettingsGroup title="Appearance" id="appearance">
          <div className="p-4">
            {mounted ? (
              <Segmented<ThemeChoice>
                label="Theme"
                value={(theme as ThemeChoice) ?? "system"}
                onChange={setTheme}
                options={[
                  { value: "system", label: "System" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
              />
            ) : (
              <div className="h-12 rounded-2xl bg-surface-2" />
            )}
          </div>
        </SettingsGroup>

        <SettingsGroup title="Notifications" id="notifications">
          <SettingsRow
            icon={n.subscribed ? <BellRing className="size-4.5" aria-hidden /> : <BellOff className="size-4.5" aria-hidden />}
            label="Enable Notifications"
            detail={pushDetail}
            trailing={
              <Switch
                label="Enable Notifications"
                checked={n.subscribed}
                disabled={!n.ready || n.busy || n.needsInstall || !n.pushSupported || n.permission === "denied" || mode === "demo"}
                onChange={togglePush}
              />
            }
          />
          {n.subscribed ? (
            <SettingsRow
              icon={<Send className="size-4.5" aria-hidden />}
              label="Send test notification"
              onClick={async () => {
                try {
                  await NotificationService.sendTestPush();
                  toast.success("Test notification sent");
                } catch (err) {
                  toast.error(friendlyError(err, "Couldn't send a test notification."));
                }
              }}
            />
          ) : null}
          <div id="preferences" className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
            <span className="text-body font-medium text-ink">Default notification time</span>
            <div className="w-44 shrink-0">
              <Select
                aria-label="Default notification time"
                value={preferences.default_notification_minutes ?? 15}
                onChange={(e) => setPref({ default_notification_minutes: Number(e.target.value) })}
                className="h-11"
              >
                {NOTIFICATION_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m === 0 ? "At time" : m === 60 ? "1 hour before" : `${m} min before`}</option>
                ))}
              </Select>
            </div>
          </div>
        </SettingsGroup>

        <SettingsGroup title="Calendar" id="calendar">
          <SettingsRow
            icon={<CalendarPlus className="size-4.5" aria-hidden />}
            label="Add to Apple Calendar"
            detail="Export all upcoming reminders as an .ics file"
            trailing={<Download className="size-5 text-subtle" aria-hidden />}
            onClick={() => {
              try {
                CalendarService.exportAllToICS(data?.reminders ?? [], {
                  serverBacked: mode === "supabase",
                  durationMinutes: preferences.ics_event_duration ?? 30,
                  includeAlarm: preferences.ics_include_alarm ?? true,
                });
              } catch (err) {
                toast.error(friendlyError(err, "Calendar file could not be generated."));
              }
            }}
          />
          <div className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
            <span className="text-body font-medium text-ink">Event length in .ics</span>
            <div className="w-36">
              <Select aria-label="Event length" value={preferences.ics_event_duration ?? 30} onChange={(e) => setPref({ ics_event_duration: Number(e.target.value) })} className="h-11">
                {[15, 30, 45, 60, 90, 120].map((m) => <option key={m} value={m}>{m} min</option>)}
              </Select>
            </div>
          </div>
          <SettingsRow
            label="Include alert in calendar event"
            detail="Uses each reminder's notification time"
            trailing={<Switch label="Include alert in calendar event" checked={preferences.ics_include_alarm ?? true} onChange={(v) => setPref({ ics_include_alarm: v })} />}
          />
        </SettingsGroup>

        <section id="categories" className="scroll-mt-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-small font-semibold uppercase tracking-[0.06em] text-muted">Categories</h2>
            <Button variant="ghost" size="sm" onClick={() => setEditing("new")} className="text-brand">
              <Plus className="size-4" aria-hidden /> New
            </Button>
          </div>
          <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] bg-surface shadow-card">
            {categories.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2 pl-4 pr-2">
                <CategoryAvatar category={c} className="size-9 rounded-xl" />
                <span className="min-w-0 flex-1 truncate text-body font-medium text-ink">{c.name}</span>
                <button type="button" aria-label={`Edit ${c.name}`} onClick={() => setEditing(c)} className="grid size-11 place-items-center rounded-full text-muted hover:text-ink">
                  <Pencil className="size-4" aria-hidden />
                </button>
                <button type="button" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)} className="grid size-11 place-items-center rounded-full text-muted hover:text-danger">
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            ))}
            {categories.length === 0 ? <li className="px-4 py-6 text-center text-small text-muted">No categories yet.</li> : null}
          </ul>
        </section>

        <SettingsGroup title="About" id="about">
          <SettingsRow
            icon={<Info className="size-4.5" aria-hidden />}
            label="Remira 1.0"
            detail="Remember What Matters. A study & productivity companion — not a medical or diagnostic tool."
          />
        </SettingsGroup>

        <SettingsGroup title="Account">
          <SettingsRow icon={<LogOut className="size-4.5" aria-hidden />} label={signingOut ? "Signing out…" : "Log out"} onClick={signOut} danger trailing={null} />
        </SettingsGroup>
      </div>

      <CategoryEditorSheet open={editing !== null} onClose={() => setEditing(null)} category={editing === "new" ? null : editing} />
      <ConfirmSheet
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete category?"
        description={`Reminders and notes in "${deleting?.name ?? ""}" will be kept but become uncategorized.`}
        confirmLabel="Delete"
        loading={deleteBusy}
        onConfirm={async () => {
          if (!deleting) return;
          setDeleteBusy(true);
          try {
            await remove(deleting.id);
            toast.success("Category deleted");
            setDeleting(null);
          } catch (err) {
            toast.error(friendlyError(err, "Unable to delete category."));
          } finally {
            setDeleteBusy(false);
          }
        }}
      />
    </>
  );
}
