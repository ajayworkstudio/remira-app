-- ============================================================
-- REMIRA — development seed data (DEV/TEST ONLY)
--
-- Adds sample reminders and notes for ONE existing account.
-- 1. Register an account in the app first.
-- 2. Replace the email below with that account's email.
-- 3. Run this in the Supabase SQL editor (or `supabase db reset`).
--
-- Data is scoped to that user_id, so RLS keeps it invisible
-- to every other user. Never run this against production.
-- ============================================================
do $$
declare
  v_email text := 'you@example.com';  -- <-- change me
  v_uid   uuid;
  v_tz    text := 'Asia/Jakarta';
  v_today date := (now() at time zone v_tz)::date;
begin
  select id into v_uid from auth.users where email = v_email;
  if v_uid is null then
    raise notice 'Seed skipped: no user with email %', v_email;
    return;
  end if;

  insert into public.reminders
    (user_id, title, description, reminder_date, reminder_time, timezone, category_id, priority,
     repeat_type, notification_minutes_before)
  values
    (v_uid, 'Anatomy Lecture', 'Upper limb — brachial plexus', v_today, '09:00', v_tz,
      (select id from public.categories where user_id = v_uid and name = 'Anatomy'), 'medium', 'none', 15),
    (v_uid, 'Clinical Practice', 'Ward round, bring stethoscope', v_today, '13:00', v_tz,
      (select id from public.categories where user_id = v_uid and name = 'Clinical'), 'medium', 'none', 30),
    (v_uid, 'Review Pharmacology', 'Review chapter 4 and 5', v_today, '20:00', v_tz,
      (select id from public.categories where user_id = v_uid and name = 'Pharmacology'), 'high', 'none', 15),
    (v_uid, 'Anatomy Review', 'Lower limb flashcards', v_today + 1, '09:00', v_tz,
      (select id from public.categories where user_id = v_uid and name = 'Anatomy'), 'medium', 'none', 15),
    (v_uid, 'Cardiology Block Exam', 'ECG interpretation + heart failure', v_today + 5, '08:00', v_tz,
      (select id from public.categories where user_id = v_uid and name = 'Exam'), 'high', 'none', 60),
    (v_uid, 'Journal Club', null, v_today + 3, '16:00', v_tz,
      (select id from public.categories where user_id = v_uid and name = 'Research'), 'low', 'weekly', 30);

  insert into public.notes (user_id, title, content, category_id, tags)
  values
    (v_uid, 'Cardiology Basics',
      E'# Cardiac cycle\n- Systole / diastole\n- Heart sounds S1, S2\n\n# To review\n- Preload vs afterload',
      (select id from public.categories where user_id = v_uid and name = 'Cardiology'), '{cardio,basics}'),
    (v_uid, 'Beta Blockers',
      E'# Classes\n- Cardioselective (β1): metoprolol, atenolol, bisoprolol\n- Non-selective: propranolol\n\n# Study tip\nLink each drug to its mechanism before memorising side effects.',
      (select id from public.categories where user_id = v_uid and name = 'Pharmacology'), '{pharm,cardio}'),
    (v_uid, 'Heart Failure Overview', E'Summary notes from lecture 7.',
      (select id from public.categories where user_id = v_uid and name = 'Cardiology'), '{cardio}');

  raise notice 'Seeded sample data for %', v_email;
end;
$$;
