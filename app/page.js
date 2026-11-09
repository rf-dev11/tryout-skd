'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SKD, WA_ADMIN, rupiah } from '@/lib/config';

const TONE = ['bg-sun', 'bg-lilac', 'bg-sky'];
const KELAS = [
  { bg: 'bg-sun', chip: 'bg-ink text-white' },
  { bg: 'bg-lilac', chip: 'bg-sun text-ink' },
  { bg: 'bg-sky', chip: 'bg-lilac text-ink' },
];

export default function Home() {
  const [classes, setClasses] = useState(null);
  const [pick, setPick] = useState(null);

  useEffect(() => {
    supabase.from('classes').select('*').eq('is_active', true).order('created_at')
      .then(({ data }) => setClasses(data || []));
  }, []);

  useEffect(() => {
    if (pick) document.getElementById('cara-beli')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pick]);

  const wa = pick
    ? `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(
        `Halo admin, saya sudah bayar kelas "${pick.title}" (${rupiah(pick.price)}) lewat QRIS. Bukti pembayaran saya lampirkan.\n\nNama:\nEmail untuk login:`
      )}`
    : '';

  return (
    <div className="min-h-screen bg-paper">
          <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-7">
            <span className="text-2xl font-medium tracking-tight text-flame">Tryout SKD</span>
            <Link href="/login" className="btn-o !bg-white">Masuk</Link>
          </header>

          <main className="mx-auto max-w-5xl px-5 sm:px-7">
            <section className="pb-2 pt-6 sm:pt-10">
              <h1 className="max-w-2xl text-4xl font-medium leading-tight tracking-tight sm:text-5xl">
                Latihan SKD CPNS dengan pola ujian yang sebenarnya.
              </h1>
              <p className="mt-4 max-w-xl text-ink/65">
                Total {SKD.total} soal dalam {SKD.durasi} menit. TWK dan TIU bernilai 5 untuk jawaban benar, TKP bernilai 1 sampai 5 sesuai pilihan.
              </p>
            </section>

            {/* Kelas: terlihat oleh siapa saja, tetapi terkunci sampai akun dibuat admin */}
            <section className="py-8">
              <h2 className="text-3xl font-medium tracking-tight">Pilih kelas</h2>
              {classes === null && <p className="mt-4 text-sm text-ink/60">Memuat…</p>}
              {classes?.length === 0 && <p className="mt-4 text-sm text-ink/60">Belum ada kelas yang dibuka.</p>}
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {classes?.map((c, n) => {
                  const tone = KELAS[n % KELAS.length];
                  return (
                    <div key={c.id} className={`flex flex-col rounded-3xl border border-ink p-5 ${tone.bg} ${pick?.id === c.id ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`chip border-ink ${tone.chip}`}>Kelas</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink bg-white/70 px-2.5 py-1 text-xs font-medium">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
                          Terkunci
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-medium leading-snug">{c.title}</h3>
                      <p className="mt-1 flex-1 text-sm text-ink/70">{c.description}</p>
                      <p className="mt-4 text-2xl font-medium">{rupiah(c.price)}</p>
                      <p className="mt-1 text-xs text-ink/60">Akses terbuka setelah pembayaran dikonfirmasi admin.</p>
                      <button className="btn mt-4" onClick={() => setPick(c)}>Beli kelas</button>
                    </div>
                  );
                })}
              </div>

              {pick && (
                <div id="cara-beli" className="mt-6 scroll-mt-6 rounded-3xl bg-frame p-5 text-white sm:p-6">
                  <h3 className="text-xl font-medium">Cara membeli {pick.title}</h3>
                  <div className="mt-4 grid gap-6 sm:grid-cols-[220px_1fr]">
                    <img src="/qris.png" alt="QRIS pembayaran" className="w-full max-w-[220px] rounded-2xl bg-white p-2" />
                    <ol className="list-decimal space-y-2 pl-5 text-sm text-white/85">
                      <li>Scan QRIS dan bayar tepat {rupiah(pick.price)}.</li>
                      <li>Kirim bukti pembayaran ke admin lewat WhatsApp.</li>
                      <li>Admin membuat akun dan mengaktifkan kelasmu. Setelah itu kamu bisa masuk dan mulai tryout.</li>
                    </ol>
                  </div>
                  <a href={wa} target="_blank" rel="noreferrer" className="btn mt-5">Kirim bukti bayar ke WhatsApp</a>
                </div>
              )}
            </section>

            <section className="pb-14">
              <h2 className="text-3xl font-medium tracking-tight">Pola ujian</h2>
              <div className="mt-5 flex h-16 gap-2 text-xs font-medium sm:text-sm">
                {Object.entries(SKD.kategori).map(([k, v], n) => (
                  <div
                    key={k}
                    style={{ flex: `${v.jumlah} 1 0` }}
                    className={`flex items-center justify-between rounded-2xl border border-ink px-3 sm:px-4 ${TONE[n]}`}
                  >
                    <span className="text-base font-semibold">{k}</span>
                    <span>{v.jumlah} soal</span>
                  </div>
                ))}
              </div>
            </section>
          </main>
    </div>
  );
}
