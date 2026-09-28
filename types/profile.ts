export interface ProfilePreferences {
  /** Default minutes-before for new reminders */
  default_notification_minutes?: number;
  /** Default event length (minutes) used for .ics exports */
  ics_event_duration?: number;
  /** Include a VALARM in .ics exports */
  ics_include_alarm?: boolean;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  preferences: ProfilePreferences;
  created_at: string;
  updated_at: string;
}
