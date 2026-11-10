'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { SKD, paketLabel } from '@/lib/config';
import { toast, confirmBox } from '@/lib/dialog';
import PaketForm from '@/components/PaketForm';
import Price from '@/components/Price';
import { Sk } from '@/components/Skeleton';

const crud = (t, method, body, qs = '') => api(`/api/admin/crud/${t}${qs}`, { method, body });

// Jenis item yang boleh ditambahkan di tiap jenis paket. Paket bacaan memakai halaman bacaan.
const ITEM = { tryout: ['tryout'], campuran: ['tryout', 'latihan'], topik: ['latihan', 'tryout'], bacaan: [] };
const NAMA_ITEM = { tryout: 'Tryout berwaktu', latihan: 'Latihan tanpa waktu' };

export default function AdminPaket() {
  const [classes, setClasses] = useState(null);
  const [tryouts, setTryouts] = useState([]);
  const [bacaan, setBacaan] = useState([]);
  const [baru, setBaru] = useState(false);
  const [edit, setEdit] = useState(null); // id paket yang sedang diubah
  const [tt, setTt] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [c, t, m] = await Promise.all([
      crud('classes', 'GET'),
      crud('tryouts', 'GET'),
      crud('materials', 'GET', undefined, '?cols=id,class_id'),
    ]);
    setClasses(c);
    setTryouts(t);
    setBacaan(m);
  };
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);

  // Jalankan aksi, tahan tombol selama berjalan (mencegah klik ganda di koneksi lambat), lalu muat ulang.
  const act = async (fn, sukses) => {
    if (busy) return false;
    setBusy(true);
    try {
      await fn();
      await load();
      if (sukses) toast(sukses, 'success');
      return true;
    } catch (e) {
      toast(e.message, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  };
  const ask = (message, title, okText = 'Ya, lanjutkan') => confirmBox(message, { title, okText });

  const formItem = (c) => {
    const kinds = ITEM[c.package_type] || [];
    const s = tt[c.id] || {};
    return { kinds, kind: s.kind || kinds[0], title: s.title || '', duration: s.duration ?? SKD.durasi };
  };
  const setItem = (id, patch) => setTt((x) => ({ ...x, [id]: { ...x[id], ...patch } }));

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium">Paket</h2>
          {!baru && <button className="btn" onClick={() => { setBaru(true); setEdit(null); }}>Tambah paket</button>}
        </div>
        {baru && (
          <div className="mt-4 border-t border-ink/15 pt-4">
            <PaketForm
              submitText="Buat paket"
              onCancel={() => setBaru(false)}
              onSave={async (v) => {
                const ok = await act(() => crud('classes', 'POST', v), 'Paket dibuat.');
                if (ok) setBaru(false);
              }}
            />
          </div>
        )}
      </section>

      {classes === null && [0, 1].map((i) => <Sk key={i} className="h-48 !rounded-3xl" />)}
      {classes?.length === 0 && <p className="text-sm text-ink/60">Belum ada paket. Klik Tambah paket untuk memulai.</p>}

      {classes?.map((c) => {
        const items = tryouts.filter((t) => t.class_id === c.id);
        const nBacaan = bacaan.filter((m) => m.class_id === c.id).length;
        const fi = formItem(c);
        return (
          <section key={c.id} className="card">
            {edit === c.id ? (
              <div>
                <h3 className="mb-4 text-xl font-medium">Ubah paket</h3>
                <PaketForm
                  initial={c}
                  submitText="Simpan perubahan"
                  onCancel={() => setEdit(null)}
                  onSave={async (v) => {
                    if (!(await ask(`Simpan perubahan pada paket "${c.title}"? Tampilan di beranda dan dashboard peserta ikut berubah.`, 'Simpan perubahan paket?', 'Ya, simpan'))) return;
                    const ok = await act(() => crud('classes', 'PATCH', { id: c.id, ...v }), 'Paket diperbarui.');
                    if (ok) setEdit(null);
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 flex-1 gap-4">
                  {c.banner_url && <img src={c.banner_url} alt="" className="hidden aspect-[16/9] w-40 shrink-0 rounded-2xl border border-ink object-cover sm:block" />}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-medium">{c.title}</h3>
                      <span className="chip">{paketLabel(c)}</span>
                      {!c.is_active && <span className="rounded-lg border border-ink bg-sun px-2.5 py-1 text-xs font-medium">Disembunyikan dari beranda</span>}
                    </div>
                    {c.description && <p className="mt-1 text-sm text-ink/60">{c.description}</p>}
                    <div className="mt-2"><Price price={c.price} original={c.original_price} size="sm" /></div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn-o" disabled={busy} onClick={() => { setEdit(c.id); setBaru(false); }}>Ubah</button>
                  <button
                    className="btn-o" disabled={busy}
                    onClick={async () => (await ask(
                      c.is_active ? `Sembunyikan "${c.title}" dari beranda? Peserta yang sudah punya akses tetap bisa memakainya.` : `Tampilkan "${c.title}" di beranda supaya bisa dibeli?`,
                      c.is_active ? 'Sembunyikan dari beranda?' : 'Tampilkan di beranda?', 'Ya')) && act(() => crud('classes', 'PATCH', { id: c.id, is_active: !c.is_active }))}
                  >
                    {c.is_active ? 'Sembunyikan' : 'Tampilkan'}
                  </button>
                  <button
                    className="btn-o" disabled={busy}
                    onClick={async () => (await confirmBox(`Hapus paket "${c.title}" beserta semua isi dan soalnya?`, { danger: true })) && act(() => crud('classes', 'DELETE', undefined, `?id=${c.id}`))}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            )}

            {c.package_type === 'bacaan' ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-4">
                <p className="text-sm text-ink/70">{nBacaan} bacaan di paket ini.</p>
                <Link href={`/admin/bacaan/${c.id}`} className="btn">Kelola bacaan</Link>
              </div>
            ) : (
              <>
                <div className="mt-4 divide-y divide-ink/10 border-t border-ink/15">
                  {items.length === 0 && <p className="py-3 text-sm text-ink/60">Belum ada isi.</p>}
                  {items.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div>
                        <p className="font-semibold">
                          {t.title}
                          <span className={`ml-2 rounded-md border border-ink px-1.5 py-0.5 align-middle text-xs font-medium ${t.kind === 'latihan' ? 'bg-sky' : 'bg-sun'}`}>{t.kind === 'latihan' ? 'Latihan' : 'Tryout'}</span>
                        </p>
                        <p className="text-sm text-ink/60">{t.kind === 'latihan' ? 'Tanpa batas waktu' : `${t.duration_minutes} menit`}, {t.is_published ? 'terbit' : 'draf'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/soal/${t.id}`} className="btn">Kelola soal</Link>
                        <button
                          className="btn-o" disabled={busy}
                          onClick={async () => (await ask(
                            t.is_published ? `Jadikan "${t.title}" draf? Peserta tidak bisa lagi membukanya.` : `Terbitkan "${t.title}"? Peserta yang punya akses paket ini langsung bisa mengerjakannya.`,
                            t.is_published ? 'Jadikan draf?' : 'Terbitkan sekarang?', 'Ya')) && act(() => crud('tryouts', 'PATCH', { id: t.id, is_published: !t.is_published }))}
                        >
                          {t.is_published ? 'Jadikan draf' : 'Terbitkan'}
                        </button>
                        <button
                          className="btn-o" disabled={busy}
                          onClick={async () => (await confirmBox(`Hapus "${t.title}" beserta soalnya?`, { danger: true })) && act(() => crud('tryouts', 'DELETE', undefined, `?id=${t.id}`))}
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap items-end gap-2">
                  {fi.kinds.length > 1 && (
                    <div className="w-full sm:w-52">
                      <label className="label">Jenis</label>
                      <select className="input" value={fi.kind} onChange={(e) => setItem(c.id, { kind: e.target.value })}>
                        {fi.kinds.map((k) => <option key={k} value={k}>{NAMA_ITEM[k]}</option>)}
                      </select>
                    </div>
                  )}
                  <div className="min-w-0 flex-1 basis-56">
                    <label className="label">Judul {fi.kind === 'latihan' ? 'latihan' : 'tryout'} baru</label>
                    <input
                      className="input" placeholder={fi.kind === 'latihan' ? 'Contoh: Latihan Figural 1' : 'Contoh: Tryout SKD 1'}
                      value={fi.title} onChange={(e) => setItem(c.id, { title: e.target.value })}
                    />
                  </div>
                  {fi.kind === 'tryout' && (
                    <div className="w-28">
                      <label className="label">Menit</label>
                      <input className="input" type="number" min="1" value={fi.duration} onChange={(e) => setItem(c.id, { duration: e.target.value })} />
                    </div>
                  )}
                  <button
                    className="btn shrink-0" disabled={busy || !fi.title.trim()}
                    onClick={() => act(async () => {
                      await crud('tryouts', 'POST', {
                        class_id: c.id, title: fi.title.trim(), kind: fi.kind,
                        duration_minutes: fi.kind === 'tryout' ? Number(fi.duration) || SKD.durasi : SKD.durasi,
                      });
                      setItem(c.id, { title: '' });
                    })}
                  >
                    Tambah
                  </button>
                </div>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
