'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { SKD } from '@/lib/config';
import { Sk, LoadError } from '@/components/Skeleton';

const tgl = (s) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
const FILTER = [['semua', 'Semua'], ['tryout', 'Tryout'], ['latihan', 'Latihan']];

export default function Riwayat() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [f, setF] = useState('semua');

  const load = () => {
    setError('');
    api('/api/riwayat').then(setList).catch((e) => setError(e.message));
  };
  useEffect(load, []);

  if (error) return <LoadError message={error} onRetry={load} />;
  if (!list) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Sk className="h-9 w-48" />
        <div className="grid gap-3 sm:grid-cols-3">{[0, 1, 2].map((i) => <Sk key={i} className="h-24 !rounded-3xl" />)}</div>
        {[0, 1, 2].map((i) => <Sk key={i} className="h-28 !rounded-3xl" />)}
      </div>
    );
  }

  const uji = list.filter((a) => a.mode === 'tryout');
  const tampil = list.filter((a) => f === 'semua' || a.mode === f);
  const terbaik = uji.length ? Math.max(...uji.map((a) => a.score_total)) : null;

  return (
    <>
      <h1 className="text-3xl font-medium tracking-tight">Riwayat nilai</h1>
      <p className="mt-1 text-sm text-ink/60">Semua tryout dan latihan yang sudah kamu selesaikan. Buka kembali untuk melihat pembahasan.</p>

      {list.length === 0 ? (
        <div className="card mt-6">
          <p>Belum ada riwayat.</p>
          <p className="mt-1 text-sm text-ink/60">Nilai muncul di sini setelah kamu menyelesaikan tryout atau latihan.</p>
          <Link href="/dashboard" className="btn mt-4">Mulai dari dashboard</Link>
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
            {[
              ['bg-sun', 'Selesai dikerjakan', list.length],
              ['bg-lilac', 'Nilai tryout tertinggi', terbaik ?? '-'],
              ['bg-sky', 'Nilai tryout terakhir', uji[0]?.score_total ?? '-'],
            ].map(([bg, label, val]) => (
              <div key={label} className={`rounded-3xl border border-ink p-3 sm:p-4 ${bg}`}>
                <p className="text-xs sm:text-sm">{label}</p>
                <p className="mt-1 text-2xl font-medium sm:text-4xl">{val}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {FILTER.map(([k, label]) => (
              <button key={k} className={f === k ? 'btn' : 'btn-o'} onClick={() => setF(k)}>{label}</button>
            ))}
          </div>

          <ul className="mt-4 space-y-3">
            {tampil.length === 0 && <li className="text-sm text-ink/60">Belum ada riwayat untuk pilihan ini.</li>}
            {tampil.map((a) => {
              const skor = { TWK: a.score_twk, TIU: a.score_tiu, TKP: a.score_tkp };
              const kats = (a.kategori || Object.keys(SKD.kategori)).filter((k) => SKD.kategori[k]);
              const lolos = kats.length > 0 && kats.every((k) => skor[k] >= SKD.kategori[k].ambang);
              return (
                <li key={a.id} className="card !p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-ink/60">
                        {a.mode === 'latihan' ? `Latihan ${a.subtes}` : 'Tryout'}, {tgl(a.finished_at)}
                      </p>
                      <p className="mt-0.5 font-medium leading-snug">{a.title}</p>
                      {a.paket && <p className="truncate text-sm text-ink/60">{a.paket}</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-3xl font-medium leading-none">{a.score_total}</p>
                      <p className="mt-1 text-xs text-ink/60">{a.mode === 'latihan' ? 'skor' : 'total'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5 text-xs font-medium">
                      {a.mode === 'tryout' && kats.map((k) => (
                        <span key={k} className={`rounded-lg border border-ink px-2 py-1 ${skor[k] >= SKD.kategori[k].ambang ? 'bg-ink text-white' : 'bg-white'}`}>
                          {k} {skor[k]}
                        </span>
                      ))}
                      {a.mode === 'tryout' && lolos && <span className="rounded-lg border border-ink bg-sky px-2 py-1">Memenuhi ambang batas</span>}
                    </div>
                    <Link href={`/hasil/${a.id}`} className="btn-o w-full sm:w-auto">Lihat nilai dan pembahasan</Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
