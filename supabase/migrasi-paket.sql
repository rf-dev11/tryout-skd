-- Khusus jika schema.sql versi lama sudah dijalankan. Jalankan SEKALI di SQL Editor, SEBELUM deploy versi baru.
-- Aman dijalankan ulang. Nama tabel tetap "classes" (di tampilan sudah disebut "Paket").

-- 1. Paket: banner, harga coret, dan jenis paket.
--    Paket yang sudah ada otomatis berjenis 'campuran' (tryout + latihan per subtes), sama seperti perilakunya sekarang.
alter table classes
  add column if not exists banner_url text,
  add column if not exists original_price integer,
  add column if not exists package_type text not null default 'campuran'
    check (package_type in ('tryout','campuran','topik','bacaan')),
  add column if not exists topic_subtes text check (topic_subtes in ('TWK','TIU','TKP'));
alter table classes alter column package_type set default 'tryout'; -- paket baru default "Paket Tryout"

-- 2. Item di dalam paket: 'tryout' (berwaktu, masuk ranking) atau 'latihan' (tanpa waktu, ada pembahasan langsung)
alter table tryouts
  add column if not exists kind text not null default 'tryout' check (kind in ('tryout','latihan'));

-- 3. Bacaan (isi paket bacaan)
create table if not exists materials (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  title text not null,
  body text,
  image_url text,
  link_url text,
  is_published boolean not null default true,
  created_at timestamptz default now()
);
alter table materials enable row level security;

-- 4. Jumlah soal per kategori, dipakai untuk menampilkan isi paket dan riwayat
create or replace view tryout_counts as
  select tryout_id, category, count(*)::int as n from questions group by tryout_id, category;
revoke all on tryout_counts from anon, authenticated;
