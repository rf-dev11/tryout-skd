-- Khusus jika schema.sql versi lama sudah dijalankan. Jalankan sekali di SQL Editor.
create table instansi (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);
alter table instansi enable row level security;
alter table profiles
  add column instansi_id uuid references instansi(id) on delete set null,
  add column jabatan_tujuan text;
