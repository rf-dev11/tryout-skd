# Tryout SKD

Web tryout SKD CPNS: Next.js 14 + Supabase + Tailwind. UI bergaya dashboard pastel (kuning, ungu, biru) dengan sidebar gelap dan aksen oranye.
110 soal (30 TWK, 35 TIU, 45 TKP), 100 menit.

## Pasang

1. Buat project di supabase.com. Buka SQL Editor, jalankan isi `supabase/schema.sql`.
2. Authentication > Users > Add user: buat akun admin (email + password, centang auto confirm).
   Salin UUID-nya lalu jalankan di SQL Editor:
   `insert into profiles (id, full_name, email, role) values ('UUID', 'Admin', 'email-admin', 'admin');`
3. Authentication > Sign In / Providers > Email: matikan "Allow new users to sign up"
   (akun hanya dibuat admin).
4. Salin `.env.example` jadi `.env.local`, isi dari Project Settings > API
   (URL, anon key, service_role key) dan nomor WA admin.
5. Taruh gambar QRIS di `public/qris.png`.
6. `npm install` lalu `npm run dev`, buka http://localhost:3000.

## Profil dan ranking

- Admin isi daftar instansi di menu Instansi (satu per baris).
- Peserta memilih instansi tujuan di menu Profil, lalu melihat peringkat di menu Ranking
  (nilai terbaik per peserta, bisa difilter per instansi).
- Jika `schema.sql` versi lama sudah dijalankan, jalankan `supabase/migrasi-profil.sql` sekali.

## Fitur tambahan

- **Analisis per topik:** admin memilih topik tiap soal (Nasionalisme, Verbal, Pelayanan Publik, dst.).
  Halaman hasil menampilkan persentase tiap topik dan 3 topik prioritas belajar.
- **Ragu-ragu:** tombol di halaman ujian, tersimpan di perangkat peserta. Nomor ragu-ragu berwarna abu-abu.
- **Mode latihan:** per subtes (TWK/TIU/TKP), tanpa timer, kunci dan pembahasan langsung muncul,
  tidak masuk ranking.
- **Pengumuman:** admin menulis di menu Pengumuman, tampil di dashboard peserta.
- **Lupa password:** peserta meminta tautan reset lewat email. Atur di Supabase:
  Authentication > URL Configuration, isi Site URL dengan alamat webmu dan tambahkan
  `https://alamat-webmu/reset-password` di Redirect URLs. Email bawaan Supabase dibatasi
  beberapa email per jam, jadi untuk banyak peserta pasang SMTP sendiri (Authentication > SMTP).
- Jika `schema.sql` versi lama sudah dijalankan, jalankan `supabase/migrasi-fitur2.sql` sekali.

## Impor soal dari Excel

Di halaman Kelola soal, unduh template, isi (satu baris satu soal), lalu unggah. TWK/TIU memakai kolom
`kunci` (huruf), TKP memakai kolom `poin_a` sampai `poin_e` (1-5). Maksimal 300 soal per impor.

## Alur pakai

- Admin login, buat kelas dan tryout, isi soal (teks atau gambar), lalu "Terbitkan".
- Calon siswa scan QRIS di beranda dan kirim bukti ke WhatsApp admin.
- Admin buka menu Siswa, buat akun, centang kelasnya. Siswa login dan mulai tryout.

## Deploy

Push ke GitHub, import di vercel.com, isi 4 environment variable yang sama.
`SUPABASE_SERVICE_ROLE_KEY` rahasia: jangan diberi awalan NEXT_PUBLIC dan jangan di-commit.

## Catatan

- Nilai ambang batas (65/80/166) ada di `lib/config.js`. Sesuaikan dengan aturan terbaru.
- Kunci jawaban tidak pernah dikirim ke peserta saat ujian. Skor dihitung di server.
- Gambar soal sebaiknya di bawah 4 MB (batas upload di Vercel).
