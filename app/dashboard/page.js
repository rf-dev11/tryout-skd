'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Shell from '@/components/Shell';
import { useMe } from '@/lib/useMe';
import { SKD } from '@/lib/config';

const tgl = (s) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

// Warna kartu bergantian: kuning, ungu muda, biru muda.
const TONES = [
  { bg: 'bg-sun', chip: 'bg-ink text-white border-ink', track: 'bg-ink/15' },
  { bg: 'bg-lilac', chip: 'bg-sun text-ink border-ink', track: 'bg-ink/15' },
  { bg: 'bg-sky', chip: 'bg-lilac text-ink border-ink', track: 'bg-ink/15' },
];

export default function Dashboard() {
  const me = useMe();
  const [open, setOpen] = useState(null); // kelas yang sedang dibuka
  useEffect(() => {
    if (open) document.getElementById(`kelas-${open}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [open]);
  if (!me) return <p className="p-8 text-sm">Memuat…</p>;
  const murid = me.profile.role !== 'admin';
  const adaInfo = me.announcements.length > 0;

  return (
    <Shell me={me} links={murid ? [] : [{ href: '/admin', label: 'Panel admin' }]}>
      <h1 className="text-3xl font-medium tracking-tight">Halo, {me.profile.full_name}</h1>
      <p className="mt-1 text-sm text-ink/60">Kelas dan tryout yang bisa kamu kerjakan.</p>

      {/* Pengumuman: paling atas */}
      {adaInfo && (
        <section className="mt-5 rounded-3xl bg-frame p-5 text-white sm:p-6">
          <div className="flex items-center gap-2 text-sm text-white/70">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /></svg>
            Pengumuman
          </div>
          <div className="mt-3 divide-y divide-white/15">
            {me.announcements.map((a) => (
              <div key={a.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-lg font-medium leading-snug">{a.title}</p>
                {a.body && <p className="mt-1 whitespace-pre-wrap text-sm text-white/75">{a.body}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {murid && !me.profile.instansi_id && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink bg-sun p-4">
          <p className="text-sm">Pilih instansi tujuanmu supaya kamu masuk ke ranking per instansi.</p>
          <Link href="/profil" className="btn">Lengkapi profil</Link>
        </div>
      )}

      {me.classes.length === 0 && (
        <div className="card mt-6">
          <p>Kamu belum punya kelas aktif.</p>
          <p className="mt-1 text-sm text-ink/60">Sudah bayar? Hubungi admin lewat WhatsApp supaya kelasmu diaktifkan.</p>
          <Link href="/" className="btn mt-4">Lihat kelas</Link>
        </div>
      )}

      {/* Ringkasan kelas */}
      {me.classes.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {me.classes.map((c, n) => {
            const tone = TONES[n % TONES.length];
            const total = c.tryouts.length;
            const selesai = c.tryouts.filter((t) => t.attempts.some((a) => a.mode === 'tryout' && a.finished_at)).length;
            return (
              <div
                key={c.id}
                onClick={() => setOpen(open === c.id ? null : c.id)}
                className={`flex cursor-pointer flex-col rounded-3xl border border-ink p-5 transition ${tone.bg} ${open === c.id ? 'outline outline-2 outline-offset-2 outline-ink' : 'hover:-translate-y-0.5'}`}
              >
                <span className={`chip self-start ${tone.chip}`}>Kelas</span>
                <h2 className="mt-3 flex-1 text-xl font-medium leading-snug">{c.title}</h2>
                <div className="mt-5 flex items-center justify-between text-sm">
                  <span>Progres</span>
                  <span>{selesai}/{total} tryout</span>
                </div>
                <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${tone.track}`}>
                  <div className="h-full rounded-full bg-ink" style={{ width: `${total ? (selesai / total) * 100 : 0}%` }} />
                </div>
                <button type="button" aria-expanded={open === c.id} className={`mt-5 self-end ${open === c.id ? 'btn-o !bg-white' : 'btn'}`}>{open === c.id ? 'Tutup' : 'Buka'}</button>
              </div>
            );
          })}
        </div>
      )}

      {me.classes.length > 0 && !open && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink/30 px-4 py-3 text-center text-sm text-ink/60">Pilih salah satu kelas di atas untuk melihat daftar tryout.</p>
      )}

      <div className="mt-6 space-y-4">
          {me.classes.filter((c) => c.id === open).map((c) => (
            <section key={c.id} id={`kelas-${c.id}`} className="card scroll-mt-6">
              <h2 className="text-xl font-medium">{c.title}</h2>
              {c.tryouts.length === 0 && <p className="mt-2 text-sm text-ink/60">Belum ada tryout yang dibuka di kelas ini.</p>}
              <div className="mt-3 divide-y divide-ink/15 border-t border-ink/15">
                {c.tryouts.map((t) => {
                  const uji = t.attempts.filter((a) => a.mode === 'tryout');
                  const lat = t.attempts.filter((a) => a.mode === 'latihan');
                  const berjalan = uji.some((a) => !a.finished_at);
                  const selesai = uji.filter((a) => a.finished_at);
                  const latSelesai = lat.filter((a) => a.finished_at);
                  return (
                    <div key={t.id} className="py-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">{t.title}</p>
                          <p className="text-sm text-ink/60">{SKD.total} soal, {t.duration_minutes} menit</p>
                        </div>
                        <Link href={`/tryout/${t.id}`} className="btn w-full sm:w-auto">
                          {berjalan ? 'Lanjutkan' : selesai.length ? 'Ulangi' : 'Mulai'}
                        </Link>
                      </div>

                      <div className="mt-3 text-sm">
                        <p className="text-ink/60">Latihan tanpa waktu</p>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {Object.keys(SKD.kategori).map((k, n) => (
                            <Link key={k} href={`/latihan/${t.id}/${k}`} className={`btn-o flex-col text-center leading-tight ${['!bg-sun', '!bg-lilac', '!bg-sky'][n]}`}>
                              <span>{k}</span>
                              {lat.some((a) => a.subtes === k && !a.finished_at) && <span className="text-xs font-normal">lanjutkan</span>}
                            </Link>
                          ))}
                        </div>
                      </div>

                      {selesai.length > 0 && (
                        <ul className="mt-3 space-y-2 text-sm">
                          {selesai.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-ink/20 bg-paper px-4 py-2.5">
                              <span>{tgl(a.finished_at)}</span>
                              <span className="font-mono text-xs sm:text-sm">TWK {a.score_twk} / TIU {a.score_tiu} / TKP {a.score_tkp}</span>
                              <span className="font-semibold">Total {a.score_total}</span>
                              <Link href={`/hasil/${a.id}`} className="font-medium text-flame underline-offset-4 hover:underline">Lihat pembahasan</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                      {latSelesai.length > 0 && (
                        <ul className="mt-2 space-y-2 text-sm">
                          {latSelesai.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-dashed border-ink/30 px-4 py-2.5">
                              <span>Latihan {a.subtes}, {tgl(a.finished_at)}</span>
                              <span className="font-semibold">Skor {a.score_total}</span>
                              <Link href={`/hasil/${a.id}`} className="font-medium text-flame underline-offset-4 hover:underline">Lihat pembahasan</Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
      </div>
    </Shell>
  );
}
