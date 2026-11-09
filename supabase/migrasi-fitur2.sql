-- Khusus jika schema.sql versi lama sudah dijalankan. Jalankan sekali di SQL Editor.
alter table questions add column topic text;
alter table attempts
  add column mode text not null default 'tryout' check (mode in ('tryout','latihan')),
  add column subtes text check (subtes in ('TWK','TIU','TKP'));
drop index one_active_attempt;
create unique index one_active_attempt on attempts(user_id, tryout_id, mode, (coalesce(subtes, ''))) where finished_at is null;

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);
alter table announcements enable row level security;
