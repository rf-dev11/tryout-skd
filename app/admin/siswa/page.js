'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast, confirmBox, promptBox } from '@/lib/dialog';

const blank = { full_name: '', email: '', password: '', class_ids: [] };

export default function AdminSiswa() {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setStudents(await api('/api/admin/siswa'));
    setClasses(await api('/api/admin/crud/classes'));
  };
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);
  const act = async (fn) => {
    try { await fn(); await load(); } catch (e) { toast(e.message, 'error'); }
  };

  const toggleNew = (id) =>
    setF((s) => ({ ...s, class_ids: s.class_ids.includes(id) ? s.class_ids.filter((x) => x !== id) : [...s.class_ids, id] }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    await act(async () => {
      await api('/api/admin/siswa', { method: 'POST', body: f });
      setF(blank);
    });
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="card space-y-4">
        <h2 className="text-xl font-medium">Buat akun siswa</h2>
        <p className="text-sm text-ink/60">Buat setelah bukti pembayaran QRIS dari WhatsApp kamu cek. Kirim email dan password ini ke siswa.</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label">Nama lengkap</label><input className="input" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
          <div><label className="label">Email</label><input className="input" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><label className="label">Password</label><input className="input" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        </div>
        <div>
          <p className="label">Akses kelas</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {classes.map((c) => (
              <label key={c.id} className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-flame" checked={f.class_ids.includes(c.id)} onChange={() => toggleNew(c.id)} />
                {c.title}
              </label>
            ))}
          </div>
        </div>
        <button className="btn" disabled={busy}>{busy ? 'Membuat…' : 'Buat akun'}</button>
      </form>

      <section className="card">
        <h2 className="text-xl font-medium">Daftar siswa ({students.length})</h2>
        {students.length === 0 && <p className="mt-2 text-sm text-ink/60">Belum ada siswa.</p>}
        <div className="mt-3 divide-y divide-ink/10 border-t border-ink/15">
          {students.map((s) => {
            const has = s.enrollments.map((e) => e.class_id);
            return (
              <div key={s.id} className="py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{s.full_name}</p>
                    <p className="text-sm text-ink/60">{s.email}{s.instansi ? `, tujuan ${s.instansi.name}` : ', instansi belum dipilih'}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="btn-o"
                      onClick={async () => {
                        const p = await promptBox(`Password baru untuk ${s.full_name} (minimal 6 karakter):`, { title: 'Ganti password', okText: 'Ganti' });
                        if (p) act(() => api('/api/admin/siswa', { method: 'PATCH', body: { user_id: s.id, password: p } }).then(() => toast('Password diganti.', 'success')));
                      }}
                    >
                      Ganti password
                    </button>
                    <button
                      className="btn-o"
                      onClick={async () => (await confirmBox(`Hapus akun ${s.full_name}? Riwayat tryoutnya ikut terhapus.`, { danger: true })) && act(() => api(`/api/admin/siswa?id=${s.id}`, { method: 'DELETE' }))}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-4 text-sm">
                  {classes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2">
                      <input
                        type="checkbox" className="h-4 w-4 accent-flame" checked={has.includes(c.id)}
                        onChange={(e) => act(() => api('/api/admin/siswa', { method: 'PATCH', body: { user_id: s.id, class_id: c.id, on: e.target.checked } }))}
                      />
                      {c.title}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
