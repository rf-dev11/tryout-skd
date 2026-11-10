import Link from 'next/link';
import AuthButton from '@/components/AuthButton';
import PaketSection from '@/components/PaketSection';
import { SKD, WA_ADMIN } from '@/lib/config';

const TONE = ['bg-sun', 'bg-lilac', 'bg-sky'];

// Ikon garis sederhana untuk daftar keunggulan.
const IKON = {
  timer: <><circle cx="12" cy="13" r="7.5" /><path d="M12 9v4l2.5 2M9.5 3h5" /></>,
  topik: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  bahas: <><path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" /><path d="M9 9h6M9 13h4" /></>,
  latihan: <><path d="M4 12h3l2-6 4 12 2-6h5" /></>,
  ranking: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /></>,
  hp: <><rect x="7" y="2.5" width="10" height="19" rx="2.5" /><path d="M11 18.5h2" /></>,
};

const FITUR = [
  { ikon: 'timer', judul: 'Timer yang jujur', isi: 'Waktu dihitung di server dan tetap berjalan walau halaman ditutup atau ponselmu mati, sama seperti ujian sungguhan.' },
  { ikon: 'topik', judul: 'Analisis per topik', isi: 'Setelah selesai, kamu melihat persentase tiap topik dan tiga topik yang paling perlu dikejar.' },
  { ikon: 'bahas', judul: 'Pembahasan di setiap soal', isi: 'Kunci jawaban, penjelasan, dan gambar pembahasan terbuka di halaman hasil. Semua nilaimu tersimpan di Riwayat dan bisa dibuka lagi kapan saja.' },
  { ikon: 'latihan', judul: 'Latihan tanpa waktu', isi: 'Kerjakan per subtes dengan kunci dan pembahasan yang langsung muncul setelah kamu memilih jawaban.' },
  { ikon: 'ranking', judul: 'Ranking per instansi', isi: 'Bandingkan nilaimu dengan peserta lain yang mengincar instansi yang sama.' },
  { ikon: 'hp', judul: 'Nyaman di ponsel', isi: 'Daftar nomor soal, tombol ragu-ragu, dan navigasi dibuat untuk layar kecil dan mudah disentuh.' },
];

const LANGKAH = [
  { judul: 'Pilih paket dan bayar', isi: 'Pilih paket yang sesuai, lalu scan QRIS dan bayar sesuai harga.' },
  { judul: 'Kirim bukti bayar', isi: 'Kirim bukti pembayaran ke admin lewat WhatsApp, sertakan nama dan email untuk login.' },
  { judul: 'Masuk dan mulai', isi: 'Admin membuatkan akunmu dan mengaktifkan paket. Setelah itu kamu bisa langsung mengerjakan.' },
];

const FAQ = [
  { t: 'Apa bedanya jenis paket?', j: 'Paket Tryout berisi beberapa tryout berwaktu. Latihan + Tryout menambahkan latihan tanpa waktu per subtes. Paket Topik hanya berisi satu subtes, misalnya TIU saja. Paket Bacaan berisi materi untuk dibaca. Harganya berbeda sesuai isinya.' },
  { t: 'Bagaimana cara membayar?', j: 'Bayar lewat QRIS, lalu kirim bukti pembayaran ke admin lewat WhatsApp. Tombol kirimnya ada di bawah paket yang kamu pilih.' },
  { t: 'Kapan akunku aktif?', j: 'Akun dibuat admin setelah bukti pembayaranmu dicek. Email dan password dikirim lewat WhatsApp, dan password bisa kamu ganti sendiri di menu Profil.' },
  { t: 'Apakah bisa dikerjakan di ponsel?', j: 'Bisa. Tampilan ujian dan semua menu dirancang untuk layar ponsel, termasuk daftar nomor soal dan tombol ragu-ragu.' },
  { t: 'Bagaimana kalau lupa password?', j: 'Gunakan tautan Lupa password di halaman masuk untuk menerima tautan reset lewat email. Jika email tidak masuk, minta admin mengganti passwordmu lewat WhatsApp.' },
  { t: 'Berapa nilai ambang batasnya?', j: `Di sini memakai TWK ${SKD.kategori.TWK.ambang}, TIU ${SKD.kategori.TIU.ambang}, dan TKP ${SKD.kategori.TKP.ambang}. Hasil tryout menandai tiap kategori yang sudah memenuhi ambang batas.` },
];

function Ikon({ nama }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" aria-hidden="true">
      {IKON[nama]}
    </svg>
  );
}

// Tampilan layar ujian (dekoratif): soal nyata yang bisa dihitung, timer, kisi nomor, dan contoh kartu hasil.
function LayarCAT() {
  const opsi = ['16 hari', '9 hari', '8 hari', '6 hari', '4 hari'];
  const nomor = Array.from({ length: 21 }, (_, i) => i + 1);
  const status = (n) => (n === 12 ? 'cur' : [3, 8].includes(n) ? 'ragu' : n < 12 ? 'jawab' : 'kosong');
  const warna = { jawab: 'bg-ink text-white', ragu: 'bg-sun', kosong: 'bg-white', cur: 'bg-white outline outline-2 outline-offset-1 outline-flame' };
  const bar = [['TWK', 80, 'bg-flame'], ['TIU', 80, 'bg-ink'], ['TKP', 84, 'bg-flame']];

  return (
    <div className="relative mx-auto w-full max-w-md sm:pb-24 lg:max-w-none" aria-hidden="true">
      <div className="relative">
      <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[1.75rem] bg-lilac" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-ink bg-white shadow-[6px_6px_0_0_#1c1c1c]">
        <div className="flex items-center justify-between gap-3 bg-frame px-4 py-3 text-white">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">Tryout SKD 1</p>
            <p className="text-xs text-white/65">11 dari 110 soal terjawab</p>
          </div>
          <div className="rounded-xl bg-sun px-3 py-1 font-mono text-lg font-bold text-ink">01:39:42</div>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-ink/60">Tes Intelegensia Umum, soal 12 dari 110</p>
          <p className="mt-2 font-medium leading-snug">
            Tiga pekerja menyelesaikan sebuah proyek dalam 12 hari. Berapa hari yang dibutuhkan empat pekerja dengan kecepatan yang sama?
          </p>
          <div className="mt-4 space-y-2">
            {opsi.map((o, n) => (
              <div key={o} className={`flex items-center gap-3 rounded-2xl border border-ink px-3 py-2 text-sm ${n === 1 ? 'bg-ink text-white' : 'bg-white'}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold ${n === 1 ? 'border-white' : 'border-ink'}`}>{'ABCDE'[n]}</span>
                {o}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-[repeat(7,1.75rem)] gap-1">
            {nomor.map((n) => (
              <span key={n} className={`flex h-6 items-center justify-center rounded-md border border-ink text-[10px] ${warna[status(n)]}`}>{n}</span>
            ))}
          </div>
        </div>
      </div>
      </div>

      <div className="pop-in relative ml-auto mt-5 w-52 rotate-2 rounded-3xl border border-ink bg-sun p-4 shadow-[5px_5px_0_0_#1c1c1c] sm:absolute sm:bottom-0 sm:right-0 sm:mt-0 lg:-right-4" style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}>
        <p className="text-xs">Contoh tampilan hasil</p>
        <p className="mt-1 text-4xl font-semibold leading-none tracking-tight">450</p>
        <div className="mt-3 space-y-1.5">
          {bar.map(([k, p, c]) => (
            <div key={k} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-medium">{k}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full border border-ink bg-white"><span className={`block h-full ${c}`} style={{ width: `${p}%` }} /></span>
            </div>
          ))}
        </div>
        <p className="mt-3 inline-block rounded-lg border border-ink bg-white px-2 py-0.5 text-xs font-medium">Memenuhi ambang batas</p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-7">
        <span className="text-2xl font-medium tracking-tight text-flame">Tryout SKD</span>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Menu beranda">
          <a href="#paket" className="hover:text-flame">Paket</a>
          <a href="#fitur" className="hover:text-flame">Fitur</a>
          <a href="#cara-beli" className="hover:text-flame">Cara beli</a>
          <a href="#tanya-jawab" className="hover:text-flame">Tanya jawab</a>
        </nav>
        <AuthButton />
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-6 sm:px-7 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:pb-24 lg:pt-12">
          <div>
            <h1 className="text-[2.6rem] font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              Latihan SKD yang rasanya seperti hari ujian.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/70">
              {SKD.total} soal dalam {SKD.durasi} menit, dengan penilaian yang sama seperti SKD CPNS. Setelah selesai, kamu tahu topik mana yang harus dikejar dan di mana posisimu dibanding peserta lain.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a href="#paket" className="btn !min-h-12 !px-7 !text-base shadow-[3px_3px_0_0_#1c1c1c]">Lihat paket</a>
              <Link href="/login" className="btn-o !min-h-12 !bg-white !px-7 !text-base">Sudah punya akun? Masuk</Link>
            </div>
            <ul className="mt-8 space-y-2 text-sm text-ink/80">
              {['Timer tetap berjalan walau halaman ditutup', 'Pembahasan di setiap soal, bisa dibuka lagi dari Riwayat', 'Ranking per instansi tujuan'].map((x) => (
                <li key={x} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink bg-sun">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <LayarCAT />
        </section>

        {/* Paket */}
        <section id="paket" className="scroll-mt-4 border-y border-ink bg-white py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-7">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Pilih paket sesuai kebutuhan belajarmu</h2>
            <p className="mt-3 max-w-2xl text-ink/70">
              Ada paket berisi beberapa tryout, paket latihan dan tryout, paket khusus satu subtes, dan paket bacaan. Harga mengikuti isi paketnya.
            </p>
            <div className="mt-8"><PaketSection /></div>
          </div>
        </section>

        {/* Fitur */}
        <section id="fitur" className="mx-auto max-w-6xl scroll-mt-4 px-5 py-14 sm:px-7 sm:py-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Bukan sekadar kumpulan soal</h2>
          <div className="mt-8 divide-y divide-ink/15 overflow-hidden rounded-3xl border border-ink bg-white">
            {FITUR.map((f, n) => (
              <div key={f.judul} className="grid items-start gap-3 p-5 sm:p-6 md:grid-cols-[18rem_1fr] md:gap-8">
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-ink ${TONE[n % 3]}`}><Ikon nama={f.ikon} /></span>
                  <h3 className="text-lg font-medium leading-snug">{f.judul}</h3>
                </div>
                <p className="text-ink/70">{f.isi}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pola ujian */}
        <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-7 sm:pb-20">
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Pola ujian yang kamu hadapi</h2>
          <div className="mt-6 flex h-14 gap-2 text-xs font-medium sm:text-sm">
            {Object.entries(SKD.kategori).map(([k, v], n) => (
              <div key={k} style={{ flex: `${v.jumlah} 1 0` }} className={`flex items-center justify-between rounded-2xl border border-ink px-3 sm:px-4 ${TONE[n]}`}>
                <span className="text-base font-semibold">{k}</span>
                <span>{v.jumlah} soal</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {Object.entries(SKD.kategori).map(([k, v]) => (
              <div key={k} className="rounded-2xl border border-ink bg-white p-4">
                <p className="font-medium">{v.nama}</p>
                <p className="mt-1 text-sm text-ink/70">
                  {k === 'TKP' ? 'Setiap pilihan bernilai 1 sampai 5.' : 'Jawaban benar bernilai 5, salah bernilai 0.'} Ambang batas {v.ambang} dari nilai maksimal {v.jumlah * 5}.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Cara beli: urutan langkah yang nyata */}
        <section id="cara-beli" className="scroll-mt-4 border-y border-ink bg-sun py-14 sm:py-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-7">
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Tiga langkah sampai bisa mengerjakan</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {LANGKAH.map((l, n) => (
                <li key={l.judul} className="flex gap-4 rounded-3xl border border-ink bg-white p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink bg-flame text-lg font-semibold text-white">{n + 1}</span>
                  <div>
                    <h3 className="text-lg font-medium leading-snug">{l.judul}</h3>
                    <p className="mt-1 text-sm text-ink/70">{l.isi}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Tanya jawab */}
        <section id="tanya-jawab" className="mx-auto max-w-3xl scroll-mt-4 px-5 py-14 sm:px-7 sm:py-20">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Pertanyaan yang sering muncul</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((x) => (
              <details key={x.t} className="group rounded-2xl border border-ink bg-white open:bg-paper">
                <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-medium [&::-webkit-details-marker]:hidden">
                  {x.t}
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink bg-sun transition group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                </summary>
                <p className="px-5 pb-4 text-ink/70">{x.j}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Penutup */}
        <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-7">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-frame p-7 text-white sm:flex-row sm:items-center sm:p-10">
            <div className="max-w-xl">
              <h2 className="text-3xl font-semibold leading-tight tracking-tight">Mulai dari satu tryout.</h2>
              <p className="mt-2 text-white/70">Lihat di mana kemampuanmu sekarang, lalu atur belajarmu dari hasilnya.</p>
            </div>
            <a href="#paket" className="btn !min-h-12 shrink-0 !px-7 !text-base">Lihat paket</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-ink/15">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm sm:px-7">
          <span className="font-medium text-flame">Tryout SKD</span>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-ink/70">
            <Link href="/login" className="hover:text-ink">Masuk</Link>
            <Link href="/lupa-password" className="hover:text-ink">Lupa password</Link>
            {WA_ADMIN && <a href={`https://wa.me/${WA_ADMIN}`} target="_blank" rel="noreferrer" className="hover:text-ink">Hubungi admin lewat WhatsApp</a>}
          </div>
        </div>
      </footer>
    </div>
  );
}
