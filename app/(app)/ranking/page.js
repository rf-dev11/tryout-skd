'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useMe } from '@/lib/useMe';
import { SKD } from '@/lib/config';
import { toast } from '@/lib/dialog';

export default function Ranking() {
  const me = useMe();
  const [instansi, setInstansi] = useState([]);
  const [tid, setTid] = useState('');
  const [inst, setInst] = useState('');
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ranking hanya untuk tryout berwaktu, bukan set latihan.
  const tryouts = me ? me.classes.flatMap((c) => c.tryouts).filter((t) => t.kind !== 'latihan') : [];

  useEffect(() => { api('/api/profil').then((r) => setInstansi(r.instansi)).catch(() => {}); }, []);
  useEffect(() => { setTid((cur) => cur || tryouts[0]?.id || ''); }, [me]);

  useEffect(() => {
    if (!tid) return;
    setLoading(true);
    api(`/api/ranking?tryout_id=${tid}&instansi_id=${inst}`)
      .then(setD)
      .catch((e) => toast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [tid, inst]);

  if (!me) return null;
  const nama = instansi.find((i) => i.id === inst)?.name;

  return (
    <>
      <h1 className="text-3xl font-medium tracking-tight">Ranking</h1>
      <p className="mt-1 text-sm text-ink/60">Memakai nilai terbaik tiap peserta. Nilai sama diurutkan dari yang selesai lebih dulu.</p>

      {tryouts.length === 0 ? (
        <p className="card mt-5 text-sm">Belum ada tryout yang bisa dilihat rankingnya.</p>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Tryout</label>
              <select className="input" value={tid} onChange={(e) => setTid(e.target.value)}>
                {tryouts.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Instansi tujuan</label>
              <select className="input" value={inst} onChange={(e) => setInst(e.target.value)}>
                <option value="">Semua instansi</option>
                {instansi.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          </div>

          {d && (
            <div className={`card mt-4 ${loading ? 'opacity-50' : ''}`}>
              <p className="rounded-2xl bg-sun px-4 py-3 font-medium">
                {d.mine
                  ? `Peringkatmu ${d.mine.rank} dari ${d.jumlah} peserta${nama ? ` yang memilih ${nama}` : ''}.`
                  : `${d.jumlah} peserta${nama ? ` memilih ${nama}` : ''}. Kamu tidak ada di daftar ini.`}
              </p>
              <ul className="mt-3 space-y-2 md:hidden">
                {d.list.map((r) => (
                  <li key={r.rank} className={`rounded-2xl border border-ink p-3 ${r.is_me ? 'bg-ink text-white' : 'bg-paper'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium"><span className={`mr-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-ink px-1.5 text-sm font-bold text-ink ${['bg-sun', 'bg-lilac', 'bg-sky'][r.rank - 1] || 'bg-white'}`}>{r.rank}</span>{r.name}{r.is_me && ' (kamu)'}</p>
                        <p className="truncate text-xs opacity-80">{r.instansi || '-'}{inst && `, umum ${r.rank_all}`}</p>
                      </div>
                      <p className="shrink-0 text-xl font-bold">{r.total}</p>
                    </div>
                    <p className="mt-1 font-mono text-xs opacity-80">TWK {r.twk} / TIU {r.tiu} / TKP {r.tkp}</p>
                  </li>
                ))}
                {d.list.length === 0 && <li className="text-sm text-ink/60">Belum ada peserta yang menyelesaikan tryout ini.</li>}
              </ul>
              <div className="mt-3 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink">
                      <th className="py-2 pl-3 pr-3 font-medium">Peringkat</th>
                      <th className="pr-3">Nama</th>
                      <th className="pr-3">Instansi tujuan</th>
                      <th className="pr-3 text-right">TWK</th>
                      <th className="pr-3 text-right">TIU</th>
                      <th className="pr-3 text-right">TKP</th>
                      <th className="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.list.map((r) => (
                      <tr key={r.rank} className={`border-b border-ink/10 ${r.is_me ? 'bg-sun font-medium' : ''}`}>
                        <td className="py-2.5 pl-3 pr-3 font-bold">
                          {r.rank}{inst && <span className="ml-1 text-xs font-normal">(umum {r.rank_all})</span>}
                        </td>
                        <td className="pr-3">{r.name}{r.is_me && ' (kamu)'}</td>
                        <td className="pr-3">{r.instansi || '-'}</td>
                        <td className={`pr-3 text-right ${r.twk < SKD.kategori.TWK.ambang ? 'opacity-60' : ''}`}>{r.twk}</td>
                        <td className={`pr-3 text-right ${r.tiu < SKD.kategori.TIU.ambang ? 'opacity-60' : ''}`}>{r.tiu}</td>
                        <td className={`pr-3 text-right ${r.tkp < SKD.kategori.TKP.ambang ? 'opacity-60' : ''}`}>{r.tkp}</td>
                        <td className="text-right font-bold">{r.total}</td>
                      </tr>
                    ))}
                    {d.list.length === 0 && (
                      <tr><td colSpan={7} className="py-4 text-ink/60">Belum ada peserta yang menyelesaikan tryout ini.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-ink/60">Nilai yang redup berada di bawah ambang batas kategori. Maksimal 100 peserta teratas ditampilkan.</p>
            </div>
          )}
        </>
      )}
    </>
  );
}
