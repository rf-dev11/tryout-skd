'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { SKD, rupiah } from '@/lib/config';
import { toast, confirmBox } from '@/lib/dialog';

const crud = (t, method, body, qs = '') => api(`/api/admin/crud/${t}${qs}`, { method, body });

export default function AdminKelas() {
  const [classes, setClasses] = useState([]);
  const [tryouts, setTryouts] = useState([]);
  const [f, setF] = useState({ title: '', description: '', price: '' });
  const [tt, setTt] = useState({});

  const load = async () => {
    setClasses(await crud('classes', 'GET'));
    setTryouts(await crud('tryouts', 'GET'));
  };
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);
  const act = async (fn) => {
    try { await fn(); await load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-medium">Kelas baru</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_160px_auto]">
          <input className="input" placeholder="Nama kelas" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <input className="input" placeholder="Deskripsi singkat" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          <input className="input" type="number" placeholder="Harga (Rp)" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
          <button
            className="btn"
            disabled={!f.title}
            onClick={() => act(async () => {
              await crud('classes', 'POST', { title: f.title, description: f.description, price: Number(f.price) || 0 });
              setF({ title: '', description: '', price: '' });
            })}
          >
            Tambah kelas
          </button>
        </div>
      </section>

      {classes.map((c) => (
        <section key={c.id} className="card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-medium">{c.title}</h3>
              <p className="text-sm text-ink/60">{c.description}</p>
              <p className="mt-1 text-sm font-semibold">{rupiah(c.price)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button className="btn-o" onClick={() => act(() => crud('classes', 'PATCH', { id: c.id, is_active: !c.is_active }))}>
                {c.is_active ? 'Sembunyikan dari beranda' : 'Tampilkan di beranda'}
              </button>
              <button
                className="btn-o"
                onClick={async () => (await confirmBox(`Hapus kelas "${c.title}" beserta semua tryout dan soalnya?`, { danger: true })) && act(() => crud('classes', 'DELETE', undefined, `?id=${c.id}`))}
              >
                Hapus
              </button>
            </div>
          </div>

          <div className="mt-4 divide-y divide-ink/10 border-t border-ink/15">
            {tryouts.filter((t) => t.class_id === c.id).map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold">{t.title}</p>
                  <p className="text-sm text-ink/60">{t.duration_minutes} menit, {t.is_published ? 'terbit' : 'draf'}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/soal/${t.id}`} className="btn">Kelola soal</Link>
                  <button className="btn-o" onClick={() => act(() => crud('tryouts', 'PATCH', { id: t.id, is_published: !t.is_published }))}>
                    {t.is_published ? 'Jadikan draf' : 'Terbitkan'}
                  </button>
                  <button
                    className="btn-o"
                    onClick={async () => (await confirmBox(`Hapus tryout "${t.title}" beserta soalnya?`, { danger: true })) && act(() => crud('tryouts', 'DELETE', undefined, `?id=${t.id}`))}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="input" placeholder="Judul tryout baru, contoh: Tryout SKD 1"
              value={tt[c.id] || ''} onChange={(e) => setTt({ ...tt, [c.id]: e.target.value })}
            />
            <button
              className="btn shrink-0"
              disabled={!tt[c.id]}
              onClick={() => act(async () => {
                await crud('tryouts', 'POST', { class_id: c.id, title: tt[c.id], duration_minutes: SKD.durasi });
                setTt({ ...tt, [c.id]: '' });
              })}
            >
              Tambah tryout
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
