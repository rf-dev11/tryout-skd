'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { SKD } from '@/lib/config';
import { Sk, LoadError } from '@/components/Skeleton';

export default function Hasil() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [qi, setQi] = useState(0); // nomor soal yang sedang dibahas
  const [jump, setJump] = useState(false);
  const qRef = useRef(null);
  useEffect(() => { if (jump) qRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, [qi]);

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

  // Pembahasan satu soal per halaman. Status tiap soal menentukan warna nomor dan pilihan jawaban.
  const maxOf = (q) => Math.max(...q.options.map((o) => o.points));
  const pilihan = (q) => q.options.find((o) => o.id === answers[q.id]);
  const status = (q) => {
    const ch = pilihan(q);
    if (!ch) return 'kosong';
    if (ch.points === maxOf(q)) return 'benar';
    return q.category === 'TKP' ? 'sebagian' : 'salah';
  };
  const CELL = {
    benar: 'border-green-600 bg-green-200',
    salah: 'border-red-600 bg-red-200',
    sebagian: 'border-ink bg-sun',
    kosong: 'border-ink/30 bg-white text-ink/60',
  };
  const LABEL = { benar: 'Benar', salah: 'Salah', sebagian: 'Poin sebagian', kosong: 'Tidak dijawab' };
  const jumlah = { benar: 0, salah: 0, sebagian: 0, kosong: 0 };
  questions.forEach((q) => { jumlah[status(q)]++; });
  const curN = Math.min(qi, questions.length - 1);
  const cur = questions[curN];
  const ke = (n) => { setQi(n); setJump(true); };

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
      <p className="mt-1 text-sm text-ink/60">Pilih nomor soal untuk melihat jawabanmu, kunci, dan penjelasannya satu per satu.</p>

      {cur && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px] lg:items-start">
          {/* Daftar nomor: di ponsel tampil di atas soal dan bisa digulir */}
          <aside className="card order-1 lg:sticky lg:top-6 lg:order-2">
            <div className="max-h-48 space-y-3 overflow-y-auto pr-1 lg:max-h-[65vh]">
              {ada.map((k) => (
                <div key={k}>
                  <p className="mb-1.5 text-sm font-medium">{k}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {questions.map((q, n) => q.category === k && (
                      <button
                        key={q.id}
                        type="button"
                        aria-label={`Soal ${n + 1}, ${LABEL[status(q)]}`}
                        aria-current={n === curN ? 'true' : undefined}
                        onClick={() => ke(n)}
                        className={`h-10 w-10 rounded-xl border text-sm font-medium transition ${CELL[status(q)]} ${n === curN ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`}
                      >
                        {n + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-ink/15 pt-3 text-xs">
              {Object.keys(LABEL).map((k) => (k === 'sebagian' && jumlah[k] === 0 ? null : (
                <li key={k} className="flex items-center gap-2">
                  <span className={`h-3.5 w-3.5 shrink-0 rounded-md border ${CELL[k]}`} />
                  {LABEL[k]} ({jumlah[k]})
                </li>
              )))}
            </ul>
          </aside>

          <article ref={qRef} className="card order-2 scroll-mt-6 lg:order-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-ink/60">{cur.category}{cur.topic && `, ${cur.topic}`}, soal {curN + 1} dari {questions.length}</p>
              <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${CELL[status(cur)]}`}>{LABEL[status(cur)]}</span>
            </div>
            {cur.body && <p className="mt-3 whitespace-pre-wrap">{cur.body}</p>}
            {cur.image_url && <img src={cur.image_url} alt="Gambar soal" className="mt-3 max-h-80 max-w-full rounded-2xl border border-ink/20" />}

            <div className="mt-4 space-y-2">
              {cur.options.map((o) => {
                const tkp = cur.category === 'TKP';
                const kunci = o.points === maxOf(cur) && maxOf(cur) > 0;
                const jawab = answers[cur.id] === o.id;
                const tone = kunci ? 'border-green-600 bg-green-200' : jawab ? (tkp ? 'border-ink bg-sun' : 'border-red-600 bg-red-200') : 'border-ink/30 bg-white';
                const tag = [];
                if (jawab) tag.push(kunci ? 'Jawabanmu, benar' : tkp ? 'Jawabanmu' : 'Jawabanmu, salah');
                else if (kunci) tag.push(tkp ? 'Poin tertinggi' : 'Kunci jawaban');
                if (tkp) tag.push(`${o.points} poin`);
                return (
                  <div key={o.id} className={`flex flex-wrap items-start gap-x-3 gap-y-1 rounded-2xl border px-3 py-2.5 text-sm ${tone}`}>
                    <span className="font-bold">{o.label}</span>
                    <span className="min-w-0 flex-1 space-y-2">
                      {o.body && <span className="block whitespace-pre-wrap">{o.body}</span>}
                      {o.image_url && <img src={o.image_url} alt="" className="max-h-40 max-w-full rounded-lg bg-white" />}
                    </span>
                    {tag.length > 0 && <span className="basis-full pl-6 text-xs font-medium sm:shrink-0 sm:basis-auto sm:pl-0">{tag.join(', ')}</span>}
                  </div>
                );
              })}
            </div>

            {(cur.explanation || cur.explanation_image_url) && (
              <div className="mt-4 rounded-2xl bg-sky p-4 text-sm">
                <p className="font-medium">Pembahasan</p>
                {cur.explanation && <p className="mt-1 whitespace-pre-wrap">{cur.explanation}</p>}
                {cur.explanation_image_url && <img src={cur.explanation_image_url} alt="Gambar pembahasan" className="mt-2 max-h-80 max-w-full rounded-xl border border-ink/20" />}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-3">
              <button className="btn-o" disabled={curN === 0} onClick={() => ke(curN - 1)}>Sebelumnya</button>
              <button className="btn" disabled={curN === questions.length - 1} onClick={() => ke(curN + 1)}>Berikutnya</button>
            </div>
          </article>
        </div>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/riwayat" className="btn">Lihat semua riwayat</Link>
        <Link href="/dashboard" className="btn-o">Kembali ke dashboard</Link>
      </div>
    </>
  );
}
