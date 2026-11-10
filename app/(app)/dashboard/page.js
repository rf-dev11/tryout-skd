'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useMe } from '@/lib/useMe';
import { SKD, paketLabel, totalSoal, subtesAda } from '@/lib/config';
import PaketBanner from '@/components/PaketBanner';

const tgl = (s) => new Date(s).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

// Warna kartu bergantian: kuning, ungu muda, biru muda.
const TONES = [
  { bg: 'bg-sun', chip: 'bg-ink text-white border-ink', track: 'bg-ink/15' },
  { bg: 'bg-lilac', chip: 'bg-sun text-ink border-ink', track: 'bg-ink/15' },
  { bg: 'bg-sky', chip: 'bg-lilac text-ink border-ink', track: 'bg-ink/15' },
];
const WARNA_SUBTES = { TWK: '!bg-sun', TIU: '!bg-lilac', TKP: '!bg-sky' };

const selesaiApa = (t) => t.attempts.some((a) => a.finished_at);

function Item({ t, paket }) {
  const uji = t.attempts.filter((a) => a.mode === 'tryout');
  const lat = t.attempts.filter((a) => a.mode === 'latihan');
  const berjalan = uji.some((a) => !a.finished_at);
  const riwayat = t.attempts
    .filter((a) => a.finished_at)
    .sort((x, y) => y.finished_at.localeCompare(x.finished_at));
  const n = totalSoal(t.counts);
  const subs = subtesAda(t.counts);
  const khususLatihan = t.kind === 'latihan';
  const bolehLatihan = khususLatihan || paket.package_type === 'campuran';
  const rincian = t.counts ? subs.map((k) => `${t.counts[k]} ${k}`).join(', ') : '';
  const meta = [];
  if (n === 0) meta.push('Belum ada soal');
  else if (n !== null) meta.push(`${n} soal${subs.length > 1 && n !== SKD.total ? ` (${rincian})` : ''}`);
  if (!khususLatihan && n !== 0) meta.push(`${t.duration_minutes} menit`);
  if (khususLatihan && n) meta.push('tanpa batas waktu');

  return (
    <div className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {t.title}
            <span className={`ml-2 rounded-md border border-ink px-1.5 py-0.5 align-middle text-xs font-medium ${khususLatihan ? 'bg-sky' : 'bg-sun'}`}>
              {khususLatihan ? 'Latihan' : 'Tryout'}
            </span>
          </p>
          <p className="text-sm text-ink/60">{meta.join(', ')}</p>
        </div>
        {!khususLatihan && (
          <Link
            href={`/tryout/${t.id}`}
            aria-disabled={n === 0}
            className={`btn w-full sm:w-auto ${n === 0 ? 'pointer-events-none opacity-40' : ''}`}
          >
            {berjalan ? 'Lanjutkan' : uji.some((a) => a.finished_at) ? 'Ulangi' : 'Mulai'}
          </Link>
        )}
      </div>

      {bolehLatihan && subs.length > 0 && (
        <div className="mt-3 text-sm">
          <p className="text-ink/60">{khususLatihan ? 'Pilih subtes untuk dikerjakan' : 'Latihan tanpa waktu'}</p>
          <div className="mt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${subs.length}, minmax(0, 1fr))` }}>
            {subs.map((k) => (
              <Link key={k} href={`/latihan/${t.id}/${k}`} className={`btn-o flex-col text-center leading-tight ${WARNA_SUBTES[k]}`}>
                <span>{khususLatihan && subs.length === 1 ? `Mulai ${k}` : k}</span>
                {lat.some((a) => a.subtes === k && !a.finished_at) && <span className="text-xs font-normal">lanjutkan</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      {riwayat.length > 0 && (
        <ul className="mt-3 space-y-2 text-sm">
          {riwayat.slice(0, 2).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-2xl border border-ink/20 bg-paper px-4 py-2.5">
              <span>
                {a.mode === 'latihan' ? `Latihan ${a.subtes}` : 'Tryout'}, {tgl(a.finished_at)}
              </span>
              <span className="font-semibold">
                {a.mode === 'latihan' ? `Skor ${a.score_total}` : `Total ${a.score_total}`}
              </span>
              <Link href={`/hasil/${a.id}`} className="font-medium text-flame underline-offset-4 hover:underline">Nilai dan pembahasan</Link>
            </li>
          ))}
          {riwayat.length > 2 && (
            <li><Link href="/riwayat" className="font-medium text-flame underline-offset-4 hover:underline">Lihat {riwayat.length - 2} riwayat lainnya</Link></li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const me = useMe();
  const [open, setOpen] = useState(null); // paket yang sedang dibuka
  useEffect(() => {
    if (open) document.getElementById(`paket-${open}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [open]);
  if (!me) return null; // layout sudah menampilkan kerangka
  const murid = me.profile.role !== 'admin';

  return (
    <>
      <h1 className="text-3xl font-medium tracking-tight">Halo, {me.profile.full_name}</h1>
      <p className="mt-1 text-sm text-ink/60">Paket dan tryout yang bisa kamu kerjakan.</p>

      {/* Pengumuman: paling atas */}
      {me.announcements.length > 0 && (
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
          <p>Kamu belum punya paket aktif.</p>
          <p className="mt-1 text-sm text-ink/60">Sudah bayar? Hubungi admin lewat WhatsApp supaya paketmu diaktifkan.</p>
          <Link href="/" className="btn mt-4">Lihat paket</Link>
        </div>
      )}

      {/* Ringkasan paket */}
      {me.classes.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {me.classes.map((c, n) => {
            const tone = TONES[n % TONES.length];
            const total = c.tryouts.length;
            const selesai = c.tryouts.filter(selesaiApa).length;
            const bacaan = c.package_type === 'bacaan';
            return (
              <div
                key={c.id}
                onClick={() => setOpen(open === c.id ? null : c.id)}
                className={`flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-ink transition ${tone.bg} ${open === c.id ? 'outline outline-2 outline-offset-2 outline-ink' : ''}`}
              >
                <PaketBanner p={c} tone={tone} />
                <div className="flex flex-1 flex-col p-5">
                  <span className={`chip self-start ${tone.chip}`}>{paketLabel(c)}</span>
                  <h2 className="mt-3 flex-1 text-xl font-medium leading-snug">{c.title}</h2>
                  {bacaan ? (
                    <p className="mt-5 text-sm">{c.materials.length} bacaan</p>
                  ) : (
                    <>
                      <div className="mt-5 flex items-center justify-between text-sm">
                        <span>Progres</span>
                        <span>{selesai}/{total} selesai</span>
                      </div>
                      <div className={`mt-2 h-2.5 overflow-hidden rounded-full ${tone.track}`}>
                        <div className="h-full rounded-full bg-ink" style={{ width: `${total ? (selesai / total) * 100 : 0}%` }} />
                      </div>
                    </>
                  )}
                  <button type="button" aria-expanded={open === c.id} className={`mt-5 self-end ${open === c.id ? 'btn-o !bg-white' : 'btn'}`}>{open === c.id ? 'Tutup' : 'Buka'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {me.classes.length > 0 && !open && (
        <p className="mt-6 rounded-2xl border border-dashed border-ink/30 px-4 py-3 text-center text-sm text-ink/60">Pilih salah satu paket di atas untuk melihat isinya.</p>
      )}

      <div className="mt-6 space-y-4">
        {me.classes.filter((c) => c.id === open).map((c) => (
          <section key={c.id} id={`paket-${c.id}`} className="card scroll-mt-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-medium">{c.title}</h2>
              <Link href="/riwayat" className="text-sm font-medium text-flame underline-offset-4 hover:underline">Semua riwayat nilai</Link>
            </div>
            {c.tryouts.length === 0 && c.materials.length === 0 && (
              <p className="mt-2 text-sm text-ink/60">Belum ada isi yang dibuka di paket ini.</p>
            )}
            {c.tryouts.length > 0 && (
              <div className="mt-3 divide-y divide-ink/15 border-t border-ink/15">
                {c.tryouts.map((t) => <Item key={t.id} t={t} paket={c} />)}
              </div>
            )}
            {c.materials.length > 0 && (
              <div className="mt-3 border-t border-ink/15 pt-3">
                <p className="text-sm text-ink/60">Bacaan</p>
                <ul className="mt-2 space-y-2">
                  {c.materials.map((m) => (
                    <li key={m.id}>
                      <Link href={`/bacaan/${m.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-ink bg-paper px-4 py-3 text-sm font-medium transition hover:bg-sun/40">
                        <span className="min-w-0 truncate">{m.title}</span>
                        <span className="shrink-0 text-flame">Baca</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </>
  );
}
