'use client';
import { useEffect, useState } from 'react';
import Shell from '@/components/Shell';
import { api } from '@/lib/api';
import { useMe } from '@/lib/useMe';
import { toast } from '@/lib/dialog';

export default function Profil() {
  const me = useMe();
  const [instansi, setInstansi] = useState([]);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (!me) return;
    api('/api/profil').then((r) => {
      setInstansi(r.instansi);
      setF({ full_name: r.profile.full_name, instansi_id: r.profile.instansi_id || '', jabatan_tujuan: r.profile.jabatan_tujuan || '' });
    });
  }, [me]);

  if (!me || !f) return <p className="p-8 text-sm">Memuat…</p>;

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setOk(false);
    try {
      await api('/api/profil', { method: 'PATCH', body: f });
      setOk(true);
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusy(false);
  };

  return (
    <Shell me={me}>
      <h1 className="text-3xl font-medium tracking-tight">Profil</h1>
      <form onSubmit={save} className="card mt-5 max-w-lg space-y-4">
        <div>
          <label className="label">Email login</label>
          <input className="input !bg-ink/5" disabled value={me.profile.email || ''} />
        </div>
        <div>
          <label className="label">Nama lengkap</label>
          <input className="input" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
        </div>
        <div>
          <label className="label">Instansi tujuan</label>
          <select className="input" value={f.instansi_id} onChange={(e) => setF({ ...f, instansi_id: e.target.value })}>
            <option value="">Belum dipilih</option>
            {instansi.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
          <p className="mt-1 text-xs text-ink/60">Dipakai untuk ranking per instansi. Instansi yang belum ada bisa diminta ke admin.</p>
        </div>
        <div>
          <label className="label">Jabatan atau formasi tujuan (opsional)</label>
          <input className="input" value={f.jabatan_tujuan} onChange={(e) => setF({ ...f, jabatan_tujuan: e.target.value })} />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan profil'}</button>
          {ok && <span className="rounded-full bg-sky px-3 py-1 text-sm">Tersimpan.</span>}
        </div>
      </form>
    </Shell>
  );
}
