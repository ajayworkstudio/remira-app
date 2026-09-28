-- RLS + trigger behaviour test (run after local-stub.sql + migration on plain Postgres)
\set ON_ERROR_STOP 1
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.dev', '{"full_name":"Alice"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test.dev', '{"full_name":"Bob"}');

select 'profiles created' as check, count(*) = 2 as pass from public.profiles;
select 'default categories per user = 13' as check,
       bool_and(n = 13) as pass from (select count(*) n from public.categories group by user_id) s;

-- ---- act as Alice
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);

insert into public.reminders (title, reminder_date, reminder_time, timezone, priority, notification_minutes_before,
                              category_id)
values ('Review Pharmacology', '2026-09-29', '20:00', 'Asia/Jakarta', 'high', 15,
        (select id from public.categories where name = 'Pharmacology'));
select 'user_id defaulted from session' as check,
       (select user_id from public.reminders) = 'aaaaaaaa-0000-0000-0000-000000000001' as pass;
select 'notify_at = 19:45 WIB = 12:45 UTC' as check,
       (select notify_at from public.reminders) = timestamptz '2026-09-29 12:45:00+00' as pass;
insert into public.notes (title, tags) values ('Beta Blockers', '{pharm,cardio}');
select 'Alice sees own profile only' as check, (select count(*) from public.profiles) = 1 as pass;
select 'Alice sees 13 categories' as check, (select count(*) from public.categories) = 13 as pass;

-- ---- act as Bob
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
select 'Bob cannot see Alice reminders' as check, (select count(*) from public.reminders) = 0 as pass;
select 'Bob cannot see Alice notes' as check, (select count(*) from public.notes) = 0 as pass;
update public.reminders set title = 'hacked';
delete from public.notes;

do $$ begin
  insert into public.reminders (user_id, title, reminder_date, reminder_time)
  values ('aaaaaaaa-0000-0000-0000-000000000001', 'spoof', '2026-09-29', '10:00');
  raise exception 'FAIL: Bob inserted as Alice';
exception when insufficient_privilege then raise notice 'PASS: spoofed user_id rejected';
end $$;

do $$ begin
  -- Bob can't read Alice's category id, so grab it as superuser-equivalent via a literal lookup
  insert into public.notes (title, category_id)
  values ('cross-user category', (select id from public.categories limit 0));
  raise notice 'PASS: null category ok';
end $$;
reset role;
do $$
declare alice_cat uuid := (select id from public.categories where user_id = 'aaaaaaaa-0000-0000-0000-000000000001' limit 1);
begin
  perform set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-0000-0000-000000000002', false);
  set local role authenticated;
  insert into public.notes (title, category_id) values ('steal', alice_cat);
  raise exception 'FAIL: Bob attached Alice''s category';
exception when foreign_key_violation then raise notice 'PASS: cross-user category rejected';
end $$;

-- ---- as Alice again: data untouched by Bob
set role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-0000-0000-000000000001', false);
select 'Bob update had no effect' as check, (select title from public.reminders) = 'Review Pharmacology' as pass;
select 'Bob delete had no effect' as check, (select count(*) from public.notes) = 1 as pass;

-- completion sets completed_at
update public.reminders set is_completed = true;
select 'completed_at set' as check, (select completed_at is not null from public.reminders) as pass;
update public.reminders set is_completed = false;
select 'completed_at cleared' as check, (select completed_at is null from public.reminders) as pass;

-- authenticated users cannot call the dispatcher claim function
do $$ begin
  perform public.claim_due_reminder_notifications(10);
  raise exception 'FAIL: authenticated called dispatcher';
exception when insufficient_privilege then raise notice 'PASS: dispatcher locked to service role';
end $$;

-- deleting a category nulls category_id but keeps the reminder
delete from public.categories where name = 'Pharmacology';
select 'category delete keeps reminder' as check,
       (select category_id is null and user_id is not null from public.reminders) as pass;
reset role;

-- ---- dispatcher as service_role
update public.reminders set reminder_date = (now() at time zone 'Asia/Jakarta')::date,
                            reminder_time = ((now() at time zone 'Asia/Jakarta') - interval '1 minute')::time,
                            notification_minutes_before = 0;
set role service_role;
select 'dispatcher claims due reminder' as check, (select count(*) from public.claim_due_reminder_notifications(10)) = 1 as pass;
select 'second claim returns nothing (no double send)' as check, (select count(*) from public.claim_due_reminder_notifications(10)) = 0 as pass;
reset role;
update public.reminders set reminder_time = reminder_time + interval '1 minute';
select 'reschedule re-arms notification' as check, (select notification_sent_at is null from public.reminders) as pass;
update public.reminders set timezone = 'Not/AZone';
select 'invalid timezone falls back to UTC' as check, (select timezone = 'UTC' from public.reminders) as pass;
