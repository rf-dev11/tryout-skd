'use client';
import { useEffect, useState } from 'react';
import { WA_ADMIN, SKD, rupiah, paketLabel, PAKET } from '@/lib/config';
import Price from './Price';
import PaketBanner from './PaketBanner';
import { Sk } from './Skeleton';

const TONES = [
  { bg: 'bg-sun', chip: 'bg-ink text-white' },
  { bg: 'bg-lilac', chip: 'bg-sun text-ink' },
  { bg: 'bg-sky', chip: 'bg-lilac text-ink' },
];

// Isi paket dalam kalimat singkat, sesuai jenisnya.
function isi(p) {
  const out = [];
  if (p.jumlah_tryout) out.push(`${p.jumlah_tryout} tryout berwaktu`);
  if (p.jumlah_latihan) out.push(`${p.jumlah_latihan} set latihan tanpa waktu`);
  if (p.package_type === 'campuran' && p.jumlah_tryout) out.push('Latihan per subtes di tiap tryout');
  if (p.jumlah_bacaan) out.push(`${p.jumlah_bacaan} bacaan`);
  if (p.package_type === 'topik' && p.topic_subtes) out.push(`Khusus ${SKD.kategori[p.topic_subtes]?.nama || p.topic_subtes}`);
  if (!out.length) out.push(PAKET[p.package_type]?.ringkas || 'Segera hadir');
  return out;
}

export default function PaketSection() {
  const [list, setList] = useState(null);
  const [gagal, setGagal] = useState(false);
  const [pick, setPick] = useState(null);

  const load = () => {
    setGagal(false);
    fetch('/api/paket', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setList)
      .catch(() => { setGagal(true); setList([]); });
  };
  useEffect(() => {
    load();
    const onFocus = () => load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    if (pick) document.getElementById('cara-bayar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [pick]);

  const wa = pick
    ? `https://wa.me/${WA_ADMIN}?text=${encodeURIComponent(
        `Halo admin, saya sudah bayar paket "${pick.title}" (${rupiah(pick.price)}) lewat QRIS. Bukti pembayaran saya lampirkan.\n\nNama:\nEmail untuk login:`
      )}`
    : '';

  return (
    <div>
      {list === null && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => <Sk key={i} className="h-96 !rounded-3xl" />)}
        </div>
      )}
      {gagal && (
        <div className="card">
          <p className="font-medium">Daftar paket belum bisa dimuat.</p>
          <p className="mt-1 text-sm text-ink/70">Periksa koneksi internetmu, lalu coba lagi.</p>
          <button className="btn mt-4" onClick={load}>Coba lagi</button>
        </div>
      )}
      {list && !gagal && list.length === 0 && <p className="card text-sm text-ink/70">Belum ada paket yang dibuka. Hubungi admin lewat WhatsApp untuk info terbaru.</p>}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list?.map((p, n) => {
          const tone = TONES[n % TONES.length];
          return (
            <article
              key={p.id}
              className={`flex flex-col overflow-hidden rounded-3xl border border-ink shadow-[4px_4px_0_0_#1c1c1c] ${tone.bg} ${pick?.id === p.id ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`}
            >
              <PaketBanner p={p} tone={tone} />
              <div className="flex flex-1 flex-col p-5">
                <span className={`chip self-start border-ink ${tone.chip}`}>{paketLabel(p)}</span>
                <h3 className="mt-3 text-xl font-medium leading-snug">{p.title}</h3>
                {p.description && <p className="mt-1 text-sm text-ink/75">{p.description}</p>}
                <ul className="mt-3 flex-1 space-y-1 text-sm">
                  {isi(p).map((x) => (
                    <li key={x} className="flex gap-2">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                      {x}
                    </li>
                  ))}
                </ul>
                <div className="mt-5"><Price price={p.price} original={p.original_price} /></div>
                <button className="btn mt-4" onClick={() => setPick(p)}>Beli paket</button>
              </div>
            </article>
          );
        })}
      </div>

      {pick && (
        <div id="cara-bayar" className="mt-6 scroll-mt-6 rounded-3xl bg-frame p-5 text-white sm:p-6">
          <h3 className="text-xl font-medium">Cara membeli {pick.title}</h3>
          <div className="mt-4 grid gap-6 sm:grid-cols-[220px_1fr]">
            <img src="/qris.png" alt="QRIS pembayaran" className="w-full max-w-[220px] rounded-2xl bg-white p-2" />
            <ol className="list-decimal space-y-2 pl-5 text-sm text-white/85">
              <li>Scan QRIS dan bayar tepat {rupiah(pick.price)}.</li>
              <li>Kirim bukti pembayaran ke admin lewat WhatsApp.</li>
              <li>Admin membuat akun dan mengaktifkan paketmu. Setelah itu kamu bisa masuk dan mulai belajar.</li>
            </ol>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href={wa} target="_blank" rel="noreferrer" className="btn">Kirim bukti bayar ke WhatsApp</a>
            <button className="btn-o !border-white/50 !text-white hover:!bg-white/10" onClick={() => setPick(null)}>Tutup</button>
          </div>
        </div>
      )}
    </div>
  );
}
