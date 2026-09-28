import "server-only";

export const serverEnv = {
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "",
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "",
  cronSecret: process.env.CRON_SECRET ?? "",
};

export const isPushConfigured = Boolean(
  serverEnv.vapidPublicKey && serverEnv.vapidPrivateKey && serverEnv.vapidSubject,
);
