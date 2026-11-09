'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useMe } from '@/lib/useMe';
import { SKD } from '@/lib/config';
import { toast, confirmBox } from '@/lib/dialog';

const fmt = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};
const maxPts = (f) => Math.max(0, ...Object.values(f.pts));

export default function Exam({ id, mode = 'tryout', subtes = null }) {
  const router = useRouter();
  const me = useMe();
  const latihan = mode === 'latihan';
  const [d, setD] = useState(null);
  const [ans, setAns] = useState({});
  const [fb, setFb] = useState({});
  const [ragu, setRagu] = useState({});
  const [i, setI] = useState(0);
  const [left, setLeft] = useState(0);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const offset = useRef(0); // selisih jam server dan jam perangkat
  const endsAt = useRef(0);

  const start = async () => {
    setBusy(true);
    try {
      const r = await api(`/api/tryout/${id}/start`, { method: 'POST', body: { mode, subtes } });
      if (r.finished) return router.replace(`/hasil/${r.attempt_id}`);
      if (r.ends_at) {
        offset.current = new Date(r.now).getTime() - Date.now();
        endsAt.current = new Date(r.ends_at).getTime();
        setLeft(Math.max(0, Math.floor((endsAt.current - new Date(r.now).getTime()) / 1000)));
      }
      setAns(r.answers);
      setFb(r.feedback || {});
      try { setRagu(JSON.parse(localStorage.getItem(`ragu:${r.attempt_id}`) || '{}')); } catch {}
      setD(r);
    } catch (e) {
      toast(e.message, 'error');
    }
    setBusy(false);
  };

  const finish = useCallback(async () => {
    if (!d) return;
    setBusy(true);
    try {
      await api(`/api/attempt/${d.attempt_id}/finish`, { method: 'POST' });
      router.replace(`/hasil/${d.attempt_id}`);
    } catch (e) {
      toast(e.message, 'error');
      setBusy(false);
    }
  }, [d]);

  useEffect(() => {
    if (!d || latihan) return;
    const t = setInterval(() => {
      const s = Math.max(0, Math.floor((endsAt.current - (Date.now() + offset.current)) / 1000));
      setLeft(s);
      if (s === 0) {
        clearInterval(t);
        finish();
      }
    }, 500);
    return () => clearInterval(t);
  }, [d, finish, latihan]);

  const toggleRagu = (qid) =>
    setRagu((r) => {
      const n = { ...r };
      if (n[qid]) delete n[qid];
      else n[qid] = 1;
      try { localStorage.setItem(`ragu:${d.attempt_id}`, JSON.stringify(n)); } catch {}
      return n;
    });

  const pick = async (q, o) => {
    if (latihan) {
      if (ans[q.id]) return; // jawaban latihan terkunci
      setAns((a) => ({ ...a, [q.id]: o.id }));
      try {
        const r = await api(`/api/attempt/${d.attempt_id}/answer`, { method: 'POST', body: { question_id: q.id, option_id: o.id } });
        setAns((a) => ({ ...a, [q.id]: r.option_id }));
        setFb((f) => ({ ...f, [q.id]: r.feedback }));
      } catch (e) {
        toast(e.message, 'error');
        setAns((a) => { const n = { ...a }; delete n[q.id]; return n; });
      }
      return;
    }
    const next = ans[q.id] === o.id ? null : o.id; // klik lagi untuk membatalkan
    setAns((a) => {
      const n = { ...a };
      if (next) n[q.id] = next;
      else delete n[q.id];
      return n;
    });
    api(`/api/attempt/${d.attempt_id}/answer`, {
      method: 'POST',
      body: { question_id: q.id, option_id: next },
    }).catch((e) => toast('Jawaban belum tersimpan: ' + e.message, 'error'));
  };

  useEffect(() => { window.scrollTo({ top: 0 }); }, [i]);

  if (!me) return <p className="p-8 text-sm">Memuat…</p>;
  const info = me.classes.flatMap((c) => c.tryouts).find((t) => t.id === id);

  if (!d) {
    return (
      <div className="auth-wrap">
       <div className="w-full max-w-xl">
        <div className="card !p-6 sm:!p-8">
        <p className="text-lg font-medium tracking-tight text-flame">Tryout SKD</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">{info?.title || 'Tryout SKD'}{latihan && `, latihan ${subtes}`}</h1>
        <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-ink/75">
          {latihan ? (
            <>
              <li>{SKD.kategori[subtes].nama}, tanpa batas waktu.</li>
              <li>Kunci dan pembahasan langsung muncul setelah kamu memilih. Jawaban tidak bisa diubah.</li>
              <li>Latihan tidak masuk ranking.</li>
            </>
          ) : (
            <>
              <li>{SKD.total} soal: {SKD.kategori.TWK.jumlah} TWK, {SKD.kategori.TIU.jumlah} TIU, {SKD.kategori.TKP.jumlah} TKP.</li>
              <li>Waktu {info?.duration_minutes || SKD.durasi} menit. Timer tetap berjalan walau halaman ditutup.</li>
              <li>Jawaban tersimpan otomatis. Klik pilihan yang sama lagi untuk membatalkan. Tandai soal yang masih ragu dengan tombol Ragu-ragu.</li>
            </>
          )}
        </ul>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button className="btn" disabled={busy} onClick={start}>{busy ? 'Menyiapkan…' : 'Mulai atau lanjutkan'}</button>
          <button className="btn-o" onClick={() => router.push('/dashboard')}>Kembali</button>
        </div>
        </div>
       </div>
      </div>
    );
  }

  const qs = d.questions;
  const q = qs[i];
  if (!q) return <p className="p-8 text-sm">Belum ada soal{latihan ? ` ${subtes}` : ''} di tryout ini.</p>;
  const done = Object.keys(ans).length;
  const nRagu = qs.filter((x) => ragu[x.id]).length;
  const f = fb[q.id];
  const locked = latihan && !!ans[q.id];

  const benar = (x) => fb[x.id] && ans[x.id] && fb[x.id].pts[ans[x.id]] === maxPts(fb[x.id]);
  const cell = (x) => {
    if (ragu[x.id]) return 'bg-sun text-ink';
    if (latihan && fb[x.id]) return benar(x) ? 'bg-ink text-white' : 'bg-flame/25 line-through';
    return ans[x.id] ? 'bg-ink text-white' : 'bg-white';
  };

  const daftarSoal = (pilih) => (
    <>
          {Object.keys(SKD.kategori).map((k) => {
            const items = qs.map((x, n) => [x, n]).filter(([x]) => x.category === k);
            if (!items.length) return null;
            return (
              <div key={k} className="mb-4">
                <p className="mb-2 text-sm font-medium">{k}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map(([x, n]) => (
                    <button
                      key={x.id}
                      onClick={() => pilih(n)}
                      className={`h-11 w-11 rounded-xl border border-ink text-sm lg:h-9 lg:w-9 ${cell(x)} ${n === i ? 'outline outline-2 outline-offset-2 outline-flame' : ''}`}
                    >
                      {n + 1}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-ink/15 pt-3 text-xs">
            {latihan ? (
              <>
                <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded border border-ink bg-ink" />Tepat</span>
                <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded border border-ink bg-flame/25" />Kurang tepat</span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded border border-ink bg-ink" />Terjawab</span>
                <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded border border-ink bg-sun" />Ragu-ragu</span>
              </>
            )}
            <span className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded border border-ink bg-white" />Belum dijawab</span>
          </div>
    </>
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 bg-frame text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{d.tryout.title}{latihan && `, latihan ${subtes}`}</p>
            <p className="text-xs text-white/65">
              {done} dari {qs.length} soal terjawab{nRagu > 0 && `, ${nRagu} ragu-ragu`}
            </p>
          </div>
          {!latihan && (
            <div className={`rounded-xl px-2.5 py-1 font-mono text-lg font-bold sm:px-3.5 sm:text-xl ${left < 300 ? 'bg-flame text-white' : 'bg-sun text-ink'}`}>
              {fmt(left)}
            </div>
          )}
          <button
            className="btn !px-3 sm:!px-4"
            disabled={busy}
            onClick={async () => {
              const info = [];
              if (qs.length - done) info.push(`${qs.length - done} soal belum dijawab`);
              if (nRagu) info.push(`${nRagu} soal masih ragu-ragu`);
              const label = latihan ? 'latihan' : 'tryout';
              if (await confirmBox(info.length ? `${info.join(', ')}. Akhiri ${label} sekarang?` : `Akhiri ${label} sekarang?`, { title: `Akhiri ${label}?`, okText: 'Ya, akhiri', cancelText: 'Lanjut mengerjakan' })) finish();
            }}
          >
            Selesai
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-4 px-3 py-3 pb-28 sm:px-4 sm:py-4 lg:grid-cols-[1fr_300px] lg:pb-4">
        <section className="card">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-ink/60">{SKD.kategori[q.category].nama}, soal {i + 1} dari {qs.length}</p>
            {!latihan && (
              <button className={`${ragu[q.id] ? 'btn' : 'btn-o'} shrink-0 !px-3`} onClick={() => toggleRagu(q.id)}>
                {ragu[q.id] ? 'Batal ragu' : 'Ragu-ragu'}
              </button>
            )}
          </div>
          {q.body && <p className="mt-3 whitespace-pre-wrap leading-relaxed">{q.body}</p>}
          {q.image_url && <img src={q.image_url} alt="Gambar soal" className="mt-3 max-h-96 max-w-full rounded-2xl border border-ink/20" />}

          <div className="mt-5 space-y-2">
            {q.options.map((o) => {
              const on = ans[q.id] === o.id;
              const max = f ? maxPts(f) : 0;
              const kunci = !!f && max > 0 && f.pts[o.id] === max;
              const warna = latihan && f
                ? kunci ? 'bg-ink text-white' : on ? 'bg-lilac' : ''
                : on ? 'bg-ink text-white' : 'hover:bg-sun/30';
              const putih = warna.includes('text-white');
              return (
                <button
                  key={o.id}
                  disabled={locked}
                  onClick={() => pick(q, o)}
                  className={`flex min-h-12 w-full items-start gap-3 rounded-2xl border border-ink p-3 text-left transition ${warna}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-sm font-bold ${putih ? 'border-white' : 'border-ink'}`}>{o.label}</span>
                  <span className="flex-1 space-y-2">
                    {o.body && <span className="block whitespace-pre-wrap">{o.body}</span>}
                    {o.image_url && <img src={o.image_url} alt={`Pilihan ${o.label}`} className="max-h-48 max-w-full rounded-lg bg-white" />}
                  </span>
                  {latihan && f && (
                    <span className="shrink-0 text-xs">
                      {on && 'Jawabanmu'}{on && kunci && ', '}{kunci && (q.category === 'TKP' ? 'Poin tertinggi' : 'Kunci')}
                      {q.category === 'TKP' && ` (${f.pts[o.id]} poin)`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {latihan && f && (f.explanation || f.explanation_image_url) && (
            <div className="mt-4 rounded-2xl border border-ink bg-sky p-4 text-sm">
              <p className="font-medium">Pembahasan</p>
              {f.explanation && <p className="mt-1 whitespace-pre-wrap">{f.explanation}</p>}
              {f.explanation_image_url && <img src={f.explanation_image_url} alt="Gambar pembahasan" className="mt-2 max-h-80 max-w-full rounded-xl border border-ink/20" />}
            </div>
          )}

          <div className="mt-5 hidden items-center justify-between gap-2 lg:flex">
            <button className="btn-o" disabled={i === 0} onClick={() => setI(i - 1)}>Sebelumnya</button>
            <button className="btn" disabled={i === qs.length - 1} onClick={() => setI(i + 1)}>Berikutnya</button>
          </div>
        </section>

        <aside className="card hidden h-fit lg:block">
          {daftarSoal((n) => setI(n))}
        </aside>
      </main>

      {/* Ponsel: bar navigasi tetap di bawah layar */}
      <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-3xl border-t border-ink bg-paper pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 p-2">
          <button className="btn-o" disabled={i === 0} onClick={() => setI(i - 1)}>Sebelumnya</button>
          <button className="btn-o font-mono" aria-label="Buka daftar soal" onClick={() => setSheet(true)}>Soal {i + 1}/{qs.length}</button>
          <button className="btn" disabled={i === qs.length - 1} onClick={() => setI(i + 1)}>Berikutnya</button>
        </div>
      </div>

      {sheet && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50 lg:hidden" onClick={() => setSheet(false)}>
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl border-t border-ink bg-paper p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-medium">Daftar soal</p>
              <button className="btn-o !px-3" onClick={() => setSheet(false)}>Tutup</button>
            </div>
            {daftarSoal((n) => { setI(n); setSheet(false); })}
          </div>
        </div>
      )}
    </div>
  );
}
