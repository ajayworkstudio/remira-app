export type CalendarSource = "remira" | "apple" | "ics_import" | "other";

export interface CalendarEvent {
  id: string;
  user_id: string;
  external_event_id: string | null;
  title: string | null;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location: string | null;
  calendar_name: string | null;
  source: CalendarSource | string | null;
  created_at: string;
  updated_at: string;
}
