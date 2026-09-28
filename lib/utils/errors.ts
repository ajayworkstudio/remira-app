/**
 * Converts any thrown value into a short, human-readable message.
 * Never surfaces SQL, stack traces or raw backend errors to users.
 */
export class UserFacingError extends Error {}

export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof UserFacingError) return err.message;
  if (isOffline()) return "You are offline. Please check your internet connection.";
  const msg = err instanceof Error ? err.message : "";
  if (/fetch|network|Failed to fetch|NetworkError|Load failed/i.test(msg)) {
    return "Please check your internet connection.";
  }
  if (process.env.NODE_ENV !== "production") console.error(err);
  return fallback;
}

/** Maps Supabase auth errors to friendly copy. */
export function friendlyAuthError(err: unknown): string {
  const msg = err instanceof Error ? err.message : typeof err === "object" && err && "message" in err ? String((err as { message: unknown }).message) : "";
  if (/invalid login credentials/i.test(msg)) return "Email or password is incorrect.";
  if (/email not confirmed/i.test(msg)) return "Please confirm your email first — check your inbox.";
  if (/already registered|already exists/i.test(msg)) return "An account with this email already exists.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts. Please wait a moment and try again.";
  if (/password/i.test(msg) && /weak|short|least/i.test(msg)) return "Please choose a stronger password.";
  return friendlyError(err, "Something went wrong. Please try again.");
}
