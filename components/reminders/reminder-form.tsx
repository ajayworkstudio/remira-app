"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { BellRing, CalendarDays, Clock, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Select, TextArea, TextInput, controlClass } from "@/components/ui/field";
import { Segmented } from "@/components/ui/segmented";
import { Switch } from "@/components/ui/switch";
import { CategoryPicker } from "@/components/categories/category-picker";
import { reminderSchema } from "@/lib/validations/reminder";
import { fieldErrors, sanitizeText } from "@/lib/validations";
import { repeatSummary } from "@/lib/reminders/recurrence";
import { WEEKDAY_NARROW, WEEKDAY_SHORT, addDays, minutesLabel, parseISODate, toHHMM } from "@/lib/utils/date";
import { cn } from "@/lib/utils/cn";
import type { Priority, RepeatConfig, RepeatType, ReminderInput } from "@/types/reminder";

export interface ReminderFormValues {
  title: string;
  description: string;
  reminder_date: string;
  reminder_time: string;
  category_id: string | null;
  priority: Priority;
  repeat_type: RepeatType;
  repeat_config: RepeatConfig;
  notification_enabled: boolean;
  notification_minutes_before: number;
}

interface Props {
  initial: ReminderFormValues;
  today: string;
  submitLabel: string;
  onSubmit: (input: ReminderInput) => Promise<void>;
  footer?: ReactNode;
}

const NOTIFY_CHOICES = [0, 5, 15, 30, 60, 1440];

function Group({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex flex-col gap-4 rounded-[var(--radius-card)] bg-surface p-4 shadow-card", className)}>{children}</div>;
}

function RowLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex items-center gap-2.5 text-body font-medium text-ink">
      <span className="grid size-8 place-items-center rounded-xl bg-brand-softer text-brand">{icon}</span>
      {children}
    </span>
  );
}

export function ReminderForm({ initial, today, submitLabel, onSubmit, footer }: Props) {
  const [v, setV] = useState<ReminderFormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof ReminderFormValues>(k: K, val: ReminderFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const quickDates = [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next week", date: addDays(today, 7) },
  ];

  const weekdays = v.repeat_config.weekdays ?? [];
  const toggleWeekday = (d: number) => {
    // Weekly with no explicit days implicitly means "the start date's weekday"
    const base = weekdays.length || v.repeat_type !== "weekly" ? weekdays : [parseISODate(v.reminder_date).getDay()];
    set("repeat_config", {
      ...v.repeat_config,
      weekdays: base.includes(d) ? base.filter((x) => x !== d) : [...base, d].sort(),
    });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const cfg: RepeatConfig = {};
    if (v.repeat_type !== "none") {
      if ((v.repeat_config.interval ?? 1) > 1) cfg.interval = v.repeat_config.interval;
      if ((v.repeat_type === "custom" || v.repeat_type === "weekly") && weekdays.length) cfg.weekdays = weekdays;
      if (v.repeat_type === "custom" && !weekdays.length) cfg.interval = v.repeat_config.interval ?? 1;
    }
    const candidate = {
      ...v,
      title: sanitizeText(v.title),
      description: v.description.trim() ? sanitizeText(v.description) : null,
      reminder_time: toHHMM(v.reminder_time),
      repeat_config: cfg,
    };
    const parsed = reminderSchema.safeParse(candidate);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(parsed.data as ReminderInput);
    } catch {
      /* caller shows the toast */
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <Group>
        <Field label="Title" error={errors.title} hideLabel>
          {(p) => (
            <TextInput
              {...p}
              value={v.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="What do you need to remember?"
              maxLength={120}
              className="h-14 border-transparent bg-surface-2 text-headline font-semibold"
              autoFocus={!initial.title}
            />
          )}
        </Field>
        <Field label="Description" error={errors.description} hideLabel>
          {(p) => (
            <TextArea
              {...p}
              value={v.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Add details (optional)"
              maxLength={2000}
              className="min-h-20 border-transparent bg-surface-2"
            />
          )}
        </Field>
      </Group>

      <Group>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Quick date">
          {quickDates.map((q) => (
            <button
              key={q.label}
              type="button"
              aria-pressed={v.reminder_date === q.date}
              onClick={() => set("reminder_date", q.date)}
              className={cn(
                "min-h-10 rounded-full px-4 text-small font-semibold transition",
                v.reminder_date === q.date ? "bg-brand text-on-brand" : "bg-surface-2 text-muted hover:text-ink",
              )}
            >
              {q.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" error={errors.reminder_date}>
            {(p) => (
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input {...p} type="date" required value={v.reminder_date} onChange={(e) => set("reminder_date", e.target.value)} className={cn(controlClass, "h-12 pl-10 pr-2")} />
              </div>
            )}
          </Field>
          <Field label="Time" error={errors.reminder_time}>
            {(p) => (
              <div className="relative">
                <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
                <input {...p} type="time" required value={toHHMM(v.reminder_time)} onChange={(e) => set("reminder_time", e.target.value)} className={cn(controlClass, "h-12 pl-10 pr-2")} />
              </div>
            )}
          </Field>
        </div>
      </Group>

      <Group>
        <CategoryPicker value={v.category_id} onChange={(id) => set("category_id", id)} />
        <div>
          <p className="mb-2 text-small font-medium text-muted">Priority</p>
          <Segmented<Priority>
            label="Priority"
            value={v.priority}
            onChange={(p) => set("priority", p)}
            options={[
              { value: "low", label: "Low" },
              { value: "medium", label: "Medium" },
              { value: "high", label: "High" },
            ]}
          />
        </div>
      </Group>

      <Group>
        <div className="flex items-center justify-between gap-3">
          <RowLabel icon={<Repeat2 className="size-4" aria-hidden />}>Repeat</RowLabel>
          <div className="w-40">
            <Select
              aria-label="Repeat"
              value={v.repeat_type}
              onChange={(e) => set("repeat_type", e.target.value as RepeatType)}
              className="h-11"
            >
              <option value="none">None</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </Select>
          </div>
        </div>

        {v.repeat_type !== "none" ? (
          <div className="flex animate-fade flex-col gap-4 rounded-2xl bg-surface-2 p-3.5">
            {v.repeat_type === "custom" || v.repeat_type === "weekly" ? (
              <div>
                <p className="mb-2 text-small font-medium text-muted">On these days</p>
                <div className="flex justify-between gap-1">
                  {WEEKDAY_NARROW.map((d, i) => {
                    const on = weekdays.includes(i) || (v.repeat_type === "weekly" && !weekdays.length && parseISODate(v.reminder_date).getDay() === i);
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-pressed={on}
                        aria-label={WEEKDAY_SHORT[i]}
                        onClick={() => toggleWeekday(i)}
                        className={cn(
                          "grid size-10 place-items-center rounded-full text-small font-bold transition",
                          on ? "bg-brand text-on-brand" : "bg-surface text-muted",
                        )}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
            <label className="flex items-center justify-between gap-3 text-body text-ink">
              <span>
                Every
                <span className="ml-1 text-muted">
                  {v.repeat_type === "daily" || (v.repeat_type === "custom" && !weekdays.length) ? "N days" : v.repeat_type === "monthly" ? "N months" : "N weeks"}
                </span>
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                value={v.repeat_config.interval ?? 1}
                onChange={(e) => set("repeat_config", { ...v.repeat_config, interval: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })}
                className={cn(controlClass, "h-11 w-20 text-center")}
                aria-label="Repeat interval"
              />
            </label>
            <p className="text-small text-brand">{repeatSummary({ ...v, repeat_config: { ...v.repeat_config, weekdays } })}</p>
            {errors.repeat_config ? <p role="alert" className="text-small text-danger">{errors.repeat_config}</p> : null}
          </div>
        ) : null}

        <div className="h-px bg-line" />

        <div className="flex items-center justify-between gap-3">
          <RowLabel icon={<BellRing className="size-4" aria-hidden />}>Notification</RowLabel>
          <Switch label="Notification" checked={v.notification_enabled} onChange={(on) => set("notification_enabled", on)} />
        </div>
        {v.notification_enabled ? (
          <Select
            aria-label="When to notify"
            value={v.notification_minutes_before}
            onChange={(e) => set("notification_minutes_before", Number(e.target.value))}
          >
            {(NOTIFY_CHOICES.includes(v.notification_minutes_before) ? NOTIFY_CHOICES : [...NOTIFY_CHOICES, v.notification_minutes_before]).map((m) => (
              <option key={m} value={m}>
                {minutesLabel(m)}
              </option>
            ))}
          </Select>
        ) : null}
      </Group>

      <Button type="submit" size="lg" loading={saving} className="mt-1">
        {submitLabel}
      </Button>
      {footer}
    </form>
  );
}
