'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast, confirmBox } from '@/lib/dialog';

const crud = (method, body, qs = '') => api(`/api/admin/crud/announcements${qs}`, { method, body });
const tgl = (s) => new Date(s).toLocaleDateString('id-ID', { dateStyle: 'medium' });

export default function AdminPengumuman() {
  const [list, setList] = useState([]);
  const [f, setF] = useState({ title: '', body: '' });

  const load = async () => setList((await crud('GET')).reverse());
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);
  const act = async (fn) => {
    try { await fn(); await load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      <section className="card space-y-3">
        <h2 className="text-xl font-medium">Pengumuman baru</h2>
        <p className="text-sm text-ink/60">Tampil di dashboard peserta (3 terbaru yang aktif).</p>
        <input className="input" placeholder="Judul, contoh: Tryout serentak Minggu 19.00" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <textarea className="input min-h-20" placeholder="Isi pengumuman (opsional)" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
        <button
          className="btn" disabled={!f.title}
          onClick={() => act(async () => { await crud('POST', { title: f.title, body: f.body || null }); setF({ title: '', body: '' }); })}
        >
          Terbitkan
        </button>
      </section>

      <section className="card">
        <h2 className="text-xl font-medium">Daftar pengumuman ({list.length})</h2>
        <div className="mt-2 divide-y divide-ink/10 border-t border-ink/15">
          {list.map((a) => (
            <div key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{a.title}</p>
                {a.body && <p className="whitespace-pre-wrap text-ink/75">{a.body}</p>}
                <p className="mt-1 text-xs text-ink/60">{tgl(a.created_at)}, {a.is_active ? 'tampil' : 'disembunyikan'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-o !py-1"
                  onClick={async () => (await confirmBox(a.is_active ? `Sembunyikan pengumuman "${a.title}" dari dashboard peserta?` : `Tampilkan pengumuman "${a.title}" di dashboard peserta?`, { title: a.is_active ? 'Sembunyikan pengumuman?' : 'Tampilkan pengumuman?', okText: 'Ya' })) && act(() => crud('PATCH', { id: a.id, is_active: !a.is_active }))}
                >
                  {a.is_active ? 'Sembunyikan' : 'Tampilkan'}
                </button>
                <button className="btn-o !py-1" onClick={async () => (await confirmBox('Hapus pengumuman ini?', { danger: true })) && act(() => crud('DELETE', undefined, `?id=${a.id}`))}>Hapus</button>
              </div>
            </div>
          ))}
          {list.length === 0 && <p className="py-3 text-sm text-ink/60">Belum ada pengumuman.</p>}
        </div>
      </section>
    </div>
  );
}
