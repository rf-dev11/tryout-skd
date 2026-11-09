'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { toast, confirmBox } from '@/lib/dialog';

const crud = (method, body, qs = '') => api(`/api/admin/crud/instansi${qs}`, { method, body });

export default function AdminInstansi() {
  const [list, setList] = useState([]);
  const [text, setText] = useState('');

  const load = async () => setList(await crud('GET'));
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);
  const act = async (fn) => {
    try { await fn(); await load(); } catch (e) { toast(e.message, 'error'); }
  };

  const tambah = () =>
    act(async () => {
      const names = [...new Set(text.split('\n').map((x) => x.trim()).filter(Boolean))];
      const ada = new Set(list.map((i) => i.name.toLowerCase()));
      const baru = names.filter((n) => !ada.has(n.toLowerCase()));
      if (baru.length) await crud('POST', baru.map((name) => ({ name })));
      setText('');
    });

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-xl font-medium">Tambah instansi</h2>
        <p className="mt-1 text-sm text-ink/60">Satu instansi per baris. Daftar ini yang muncul di profil peserta dan filter ranking.</p>
        <textarea className="input mt-3 min-h-28" placeholder={'Kementerian Keuangan\nKementerian Hukum\nPemerintah Kabupaten Pidie Jaya'} value={text} onChange={(e) => setText(e.target.value)} />
        <button className="btn mt-3" disabled={!text.trim()} onClick={tambah}>Tambah</button>
      </section>

      <section className="card">
        <h2 className="text-xl font-medium">Daftar instansi ({list.length})</h2>
        {list.length === 0 && <p className="mt-2 text-sm text-ink/60">Belum ada instansi.</p>}
        <div className="mt-2 divide-y divide-ink/10 border-t border-ink/15">
          {list.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>{i.name}</span>
              <button
                className="btn-o !py-1"
                onClick={async () => (await confirmBox(`Hapus ${i.name}? Pilihan peserta untuk instansi ini jadi kosong.`, { danger: true })) && act(() => crud('DELETE', undefined, `?id=${i.id}`))}
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
