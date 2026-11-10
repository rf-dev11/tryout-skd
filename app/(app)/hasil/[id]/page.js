'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { SKD } from '@/lib/config';
import { Sk, LoadError } from '@/components/Skeleton';

export default function Hasil() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [f, setF] = useState('SEMUA');

  const load = () => {
    setError('');
    api(`/api/attempt/${id}`).then(setD).catch((e) => setError(e.message));
  };
  useEffect(load, [id]);

  if (error) return <LoadError message={error} onRetry={load} />;
  if (!d) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Sk className="h-9 w-72 max-w-full" />
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]"><Sk className="h-40 !rounded-3xl" /><Sk className="h-40 !rounded-3xl" /></div>
        <Sk className="h-64 !rounded-3xl" />
      </div>
    );
  }

  const { attempt: a, questions, answers } = d;
  const latihan = a.mode === 'latihan';
  const skor = { TWK: a.score_twk, TIU: a.score_tiu, TKP: a.score_tkp };
  // Hanya kategori yang benar-benar ada soalnya yang dinilai (paket topik hanya berisi satu subtes).
  const ada = Object.keys(SKD.kategori).filter((k) => questions.some((q) => q.category === k));
  const penuh = ada.length === Object.keys(SKD.kategori).length;
  const lolos = ada.every((k) => skor[k] >= SKD.kategori[k].ambang);

  // Analisis per topik: TWK/TIU = jawaban tepat, TKP = poin yang diperoleh dibanding poin tertinggi.
  const per = {};
  let tepat = 0;
  questions.forEach((q) => {
    const max = Math.max(...q.options.map((o) => o.points));
    const ch = q.options.find((o) => o.id === answers[q.id]);
    if (ch && ch.points === max) tepat++;
    if (!q.topic) return;
    const t = (per[`${q.category}|${q.topic}`] ||= { category: q.category, topic: q.topic, n: 0, tepat: 0, got: 0, max: 0 });
    t.n++;
    t.max += max;
    t.got += ch ? ch.points : 0;
    if (ch && ch.points === max) t.tepat++;
  });
  const topik = Object.values(per)
    .map((t) => ({ ...t, pct: t.max ? Math.round((t.got / t.max) * 100) : 0 }))
    .sort((x, y) => x.pct - y.pct);
  const lemah = topik.filter((t) => t.pct < 70).slice(0, 3);

  return (
    <>
      <Link href="/riwayat" className="text-sm font-medium text-flame underline-offset-4 hover:underline">Kembali ke riwayat</Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">{d.tryout.title}{latihan && `, latihan ${a.subtes}`}</h1>

      {latihan ? (
        <div className="mt-5 max-w-sm rounded-3xl border border-ink bg-sun p-5">
          <p className="text-sm">Skor latihan {a.subtes}</p>
          <p className="text-6xl font-medium">{a.score_total}</p>
          <p className="mt-2 text-sm">{tepat} dari {questions.length} soal tepat. Latihan tidak masuk ranking.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_2fr]">
          <div className={`rounded-3xl border border-ink p-5 ${lolos ? 'bg-frame text-white' : 'bg-sun'}`}>
            <p className="text-sm">Skor total</p>
            <p className="text-6xl font-medium">{a.score_total}</p>
            <p className="mt-2 text-sm">{lolos ? (penuh ? 'Memenuhi nilai ambang batas semua kategori.' : 'Memenuhi nilai ambang batas kategori yang diuji.') : 'Belum memenuhi nilai ambang batas.'}</p>
          </div>
          <div className="grid gap-2 sm:gap-4" style={{ gridTemplateColumns: `repeat(${ada.length || 1}, minmax(0, 1fr))` }}>
            {Object.entries(SKD.kategori).filter(([k]) => ada.includes(k)).map(([k, v], n) => {
              const ok = skor[k] >= v.ambang;
              return (
                <div key={k} className={`rounded-3xl border border-ink p-3 sm:p-4 ${['bg-sun', 'bg-lilac', 'bg-sky'][n]}`}>
                  <p className="text-sm font-medium">{k}</p>
                  <p className="text-2xl font-medium sm:text-4xl">{skor[k]}</p>
                  <p className="text-xs text-ink/65">Ambang batas {v.ambang} dari maks. {v.jumlah * 5}</p>
                  <p className={`mt-2 inline-block rounded-lg border border-ink px-2 py-0.5 text-xs font-medium ${ok ? 'bg-ink text-white' : 'bg-white'}`}>
                    {ok ? 'Memenuhi' : 'Belum memenuhi'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {topik.length > 0 && (
        <section className="card mt-6">
          <h2 className="text-xl font-medium">Analisis per topik</h2>
          {lemah.length > 0 && (
            <p className="mt-2 text-sm">
              Prioritas belajar: {lemah.map((t) => `${t.topic} (${t.category}, ${t.pct}%)`).join('; ')}.
            </p>
          )}
          <div className="mt-4 space-y-3">
            {topik.map((t) => (
              <div key={`${t.category}${t.topic}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium">{t.topic} <span className="font-normal text-ink/60">({t.category})</span></span>
                  <span>
                    {t.category === 'TKP' ? `${t.got} dari ${t.max} poin` : `${t.tepat} dari ${t.n} tepat`}, <b>{t.pct}%</b>
                  </span>
                </div>
                <div className="mt-1.5 h-3 overflow-hidden rounded-full border border-ink bg-white">
                  <div className={`h-full rounded-full ${t.pct < 70 ? 'bg-flame' : 'bg-ink'}`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink/60">Hanya soal yang diberi topik oleh admin yang masuk analisis.</p>
        </section>
      )}

      <h2 className="mt-10 text-2xl font-medium tracking-tight">Pembahasan</h2>
      {!latihan && ada.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {['SEMUA', ...ada].map((k) => (
            <button key={k} className={f === k ? 'btn' : 'btn-o'} onClick={() => setF(k)}>{k === 'SEMUA' ? 'Semua' : k}</button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-4">
        {questions.map((q, n) => {
          if (f !== 'SEMUA' && q.category !== f) return null;
          const max = Math.max(...q.options.map((o) => o.points));
          const mine = answers[q.id];
          return (
            <article key={q.id} className="card">
              <p className="text-sm text-ink/60">{q.category}{q.topic && `, ${q.topic}`}, soal {n + 1}{!mine && ', tidak dijawab'}</p>
              {q.body && <p className="mt-2 whitespace-pre-wrap">{q.body}</p>}
              {q.image_url && <img src={q.image_url} alt="Gambar soal" className="mt-2 max-h-80 max-w-full rounded-2xl border border-ink/20" />}
              <div className="mt-3 space-y-2">
                {q.options.map((o) => {
                  const kunci = o.points === max && max > 0;
                  const jawab = mine === o.id;
                  return (
                    <div key={o.id} className={`flex flex-wrap items-start gap-x-3 gap-y-1 rounded-2xl border border-ink px-3 py-2.5 text-sm ${kunci ? 'bg-ink text-white' : jawab ? 'bg-lilac' : ''}`}>
                      <span className="font-bold">{o.label}</span>
                      <span className="min-w-0 flex-1 space-y-2">
                        {o.body && <span className="block whitespace-pre-wrap">{o.body}</span>}
                        {o.image_url && <img src={o.image_url} alt="" className="max-h-40 max-w-full rounded-lg bg-white" />}
                      </span>
                      <span className="basis-full pl-6 text-xs sm:shrink-0 sm:basis-auto sm:pl-0">
                        {jawab && 'Jawabanmu'}{jawab && kunci && ', '}{kunci && (q.category === 'TKP' ? 'Poin tertinggi' : 'Kunci')}
                        {q.category === 'TKP' && ` (${o.points} poin)`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {(q.explanation || q.explanation_image_url) && (
                <div className="mt-3 rounded-2xl bg-sky p-4 text-sm">
                  <p className="font-medium">Pembahasan</p>
                  {q.explanation && <p className="mt-1 whitespace-pre-wrap">{q.explanation}</p>}
                  {q.explanation_image_url && <img src={q.explanation_image_url} alt="Gambar pembahasan" className="mt-2 max-h-80 max-w-full rounded-xl border border-ink/20" />}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/riwayat" className="btn">Lihat semua riwayat</Link>
        <Link href="/dashboard" className="btn-o">Kembali ke dashboard</Link>
      </div>
    </>
  );
}
