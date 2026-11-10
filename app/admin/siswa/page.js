'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { paketLabel } from '@/lib/config';
import { toast, confirmBox, promptBox } from '@/lib/dialog';
import { Sk } from '@/components/Skeleton';

const blank = { full_name: '', email: '', password: '', class_ids: [] };

export default function AdminSiswa() {
  const [students, setStudents] = useState(null);
  const [classes, setClasses] = useState([]);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState({}); // "idSiswa:idPaket" yang sedang disimpan

  const load = async () => {
    const [s, c] = await Promise.all([api('/api/admin/siswa'), api('/api/admin/crud/classes')]);
    setStudents(s);
    setClasses(c);
  };
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);
  const act = async (fn) => {
    try { await fn(); await load(); } catch (e) { toast(e.message, 'error'); }
  };

  const toggleNew = (id) =>
    setF((s) => ({ ...s, class_ids: s.class_ids.includes(id) ? s.class_ids.filter((x) => x !== id) : [...s.class_ids, id] }));

  const create = async (e) => {
    e.preventDefault();
    const n = f.class_ids.length;
    const ok = await confirmBox(
      `Buat akun untuk ${f.full_name} (${f.email}) dengan ${n ? `akses ${n} paket` : 'belum ada akses paket'}? Email dan password ini perlu kamu kirim ke siswa.`,
      { title: 'Buat akun siswa?', okText: 'Ya, buat akun' }
    );
    if (!ok) return;
    setBusy(true);
    await act(async () => {
      await api('/api/admin/siswa', { method: 'POST', body: f });
      setF(blank);
      toast('Akun siswa dibuat.', 'success');
    });
    setBusy(false);
  };

  // Ceklis akses paket: tanya dulu, simpan, lalu tampilan mengikuti daftar akses terbaru dari server.
  // Kotak dikunci selama menyimpan supaya klik berulang di koneksi lambat tidak saling menimpa.
  const toggleAkses = async (s, c, on) => {
    const key = `${s.id}:${c.id}`;
    if (pending[key]) return;
    const ok = await confirmBox(
      on
        ? `Beri akses paket "${c.title}" kepada ${s.full_name}?`
        : `Cabut akses paket "${c.title}" dari ${s.full_name}? Riwayat nilainya tetap tersimpan.`,
      { title: on ? 'Beri akses paket?' : 'Cabut akses paket?', okText: on ? 'Ya, beri akses' : 'Ya, cabut akses', danger: !on }
    );
    if (!ok) return;
    setPending((p) => ({ ...p, [key]: true }));
    try {
      const r = await api('/api/admin/siswa', { method: 'PATCH', body: { user_id: s.id, class_id: c.id, on } });
      setStudents((list) => list.map((x) => (x.id === s.id ? { ...x, enrollments: r.class_ids.map((class_id) => ({ class_id })) } : x)));
      toast(on ? `Akses "${c.title}" diberikan.` : `Akses "${c.title}" dicabut.`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setPending((p) => { const n = { ...p }; delete n[key]; return n; });
    }
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
          <p className="label">Akses paket</p>
          <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm">
            {classes.length === 0 && <span className="text-ink/60">Belum ada paket.</span>}
            {classes.map((c) => (
              <label key={c.id} className="flex min-h-8 items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-flame" checked={f.class_ids.includes(c.id)} onChange={() => toggleNew(c.id)} />
                {c.title}
                <span className="text-xs text-ink/50">{paketLabel(c)}</span>
              </label>
            ))}
          </div>
        </div>
        <button className="btn" disabled={busy}>{busy ? 'Membuat…' : 'Buat akun'}</button>
      </form>

      <section className="card">
        <h2 className="text-xl font-medium">Daftar siswa ({students?.length ?? 0})</h2>
        {students === null && <Sk className="mt-3 h-20" />}
        {students?.length === 0 && <p className="mt-2 text-sm text-ink/60">Belum ada siswa.</p>}
        <div className="mt-3 divide-y divide-ink/10 border-t border-ink/15">
          {students?.map((s) => {
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
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  {classes.map((c) => {
                    const key = `${s.id}:${c.id}`;
                    const saving = !!pending[key];
                    const checked = saving ? !has.includes(c.id) : has.includes(c.id);
                    return (
                      <label key={c.id} className={`flex min-h-8 items-center gap-2 ${saving ? 'opacity-60' : ''}`}>
                        <input
                          type="checkbox" className="h-4 w-4 accent-flame" checked={checked} disabled={saving}
                          onChange={(e) => toggleAkses(s, c, e.target.checked)}
                        />
                        {c.title}
                        {saving && <span className="text-xs">menyimpan…</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
