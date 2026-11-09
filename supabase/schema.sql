-- Jalankan di Supabase: SQL Editor > New query > Run

create table instansi (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  instansi_id uuid references instansi(id) on delete set null,
  jabatan_tujuan text,
  role text not null default 'student' check (role in ('admin','student')),
  created_at timestamptz default now()
);

create table classes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  price integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table enrollments (
  user_id uuid references profiles(id) on delete cascade,
  class_id uuid references classes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, class_id)
);

create table tryouts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  duration_minutes integer not null default 100,
  is_published boolean not null default false,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  tryout_id uuid not null references tryouts(id) on delete cascade,
  category text not null check (category in ('TWK','TIU','TKP')),
  position integer not null default 0,
  topic text,
  body text,
  image_url text,
  explanation text,
  explanation_image_url text,
  created_at timestamptz default now()
);

-- TWK/TIU: kunci = points 5, lainnya 0. TKP: tiap pilihan points 1-5.
create table options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  label text not null check (label in ('A','B','C','D','E')),
  body text,
  image_url text,
  points integer not null default 0,
  unique (question_id, label)
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  tryout_id uuid not null references tryouts(id) on delete cascade,
  mode text not null default 'tryout' check (mode in ('tryout','latihan')),
  subtes text check (subtes in ('TWK','TIU','TKP')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score_twk integer,
  score_tiu integer,
  score_tkp integer,
  score_total integer
);
create unique index one_active_attempt on attempts(user_id, tryout_id, mode, (coalesce(subtes, ''))) where finished_at is null;

create table announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  is_active boolean not null default true,
  created_at timestamptz default now()
);

create table answers (
  attempt_id uuid references attempts(id) on delete cascade,
  question_id uuid references questions(id) on delete cascade,
  option_id uuid references options(id) on delete cascade,
  primary key (attempt_id, question_id)
);

-- Semua data diakses lewat server (service role). Publik hanya boleh membaca kelas aktif.
alter table profiles enable row level security;
alter table instansi enable row level security;
alter table announcements enable row level security;
alter table classes enable row level security;
alter table enrollments enable row level security;
alter table tryouts enable row level security;
alter table questions enable row level security;
alter table options enable row level security;
alter table attempts enable row level security;
alter table answers enable row level security;

create policy "kelas aktif boleh dibaca" on classes for select using (is_active);

-- Bucket gambar soal
insert into storage.buckets (id, name, public) values ('soal', 'soal', true) on conflict do nothing;

-- Admin pertama: buat user di Authentication > Users > Add user, salin UUID-nya, lalu:
-- insert into profiles (id, full_name, email, role) values ('UUID-ADMIN', 'Admin', 'email@admin.com', 'admin');
