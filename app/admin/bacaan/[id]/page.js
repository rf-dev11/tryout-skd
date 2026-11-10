'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { toast, confirmBox } from '@/lib/dialog';
import ImageInput from '@/components/ImageInput';
import { Sk } from '@/components/Skeleton';

const crud = (method, body, qs = '') => api(`/api/admin/crud/materials${qs}`, { method, body });
const blank = { id: null, title: '', body: '', image_url: '', link_url: '' };

// Kelola bacaan untuk satu paket (id di alamat = id paket).
export default function AdminBacaan() {
  const { id } = useParams();
  const [paket, setPaket] = useState(null);
  const [list, setList] = useState(null);
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [cs, ms] = await Promise.all([api('/api/admin/crud/classes'), crud('GET', undefined, `?class_id=${id}`)]);
    setPaket(cs.find((c) => c.id === id) || null);
    setList(ms);
  };
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);

  const act = async (fn, sukses) => {
    if (busy) return false;
    setBusy(true);
    try { await fn(); await load(); if (sukses) toast(sukses, 'success'); return true; }
    catch (e) { toast(e.message, 'error'); return false; }
    finally { setBusy(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!f.title.trim()) return toast('Isi judul bacaan.', 'warn');
    if (f.link_url && !/^https?:\/\//i.test(f.link_url.trim())) return toast('Tautan harus diawali http:// atau https://', 'warn');
    if (f.id && !(await confirmBox('Perubahan bacaan ini akan langsung terlihat oleh peserta.', { title: 'Simpan perubahan bacaan?', okText: 'Ya, simpan' }))) return;
    const row = { title: f.title.trim(), body: f.body || null, image_url: f.image_url || null, link_url: f.link_url.trim() || null };
    const ok = await act(() => (f.id ? crud('PATCH', { id: f.id, ...row }) : crud('POST', { class_id: id, ...row })), f.id ? 'Bacaan diperbarui.' : 'Bacaan ditambahkan.');
    if (ok) setF(blank);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-flame underline-offset-4 hover:underline">Kembali ke paket</Link>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">{paket?.title || 'Bacaan'}</h1>
        <p className="mt-1 text-sm text-ink/60">Isi bacaan berupa teks, gambar, dan tautan ke berkas (misalnya PDF di Google Drive).</p>
      </div>

      <form onSubmit={save} className="card space-y-4">
        <h2 className="text-xl font-medium">{f.id ? 'Ubah bacaan' : 'Bacaan baru'}</h2>
        <div>
          <label className="label">Judul</label>
          <input className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Contoh: Rangkuman Pilar Negara" />
        </div>
        <div>
          <label className="label">Isi bacaan</label>
          <textarea className="input min-h-40" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} placeholder="Tulis teks bacaan. Baris kosong dipakai sebagai pemisah paragraf." />
          <ImageInput value={f.image_url} onChange={(v) => setF({ ...f, image_url: v })} />
        </div>
        <div>
          <label className="label">Tautan berkas (opsional)</label>
          <input className="input" value={f.link_url} onChange={(e) => setF({ ...f, link_url: e.target.value })} placeholder="https://drive.google.com/..." />
        </div>
        <div className="flex gap-3">
          <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : f.id ? 'Simpan perubahan' : 'Tambah bacaan'}</button>
          {f.id && <button type="button" className="btn-o" onClick={() => setF(blank)}>Batal ubah</button>}
        </div>
      </form>

      <section className="card">
        <h2 className="text-xl font-medium">Daftar bacaan ({list?.length ?? 0})</h2>
        {list === null && <Sk className="mt-3 h-16" />}
        {list?.length === 0 && <p className="mt-2 text-sm text-ink/60">Belum ada bacaan.</p>}
        <div className="mt-2 divide-y divide-ink/10 border-t border-ink/15">
          {list?.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{m.title}</p>
                <p className="text-ink/60">{m.is_published ? 'Terbit' : 'Draf'}{m.link_url ? ', ada tautan berkas' : ''}{m.image_url ? ', ada gambar' : ''}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-o !py-1" disabled={busy}
                  onClick={() => { setF({ id: m.id, title: m.title, body: m.body || '', image_url: m.image_url || '', link_url: m.link_url || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  Ubah
                </button>
                <button
                  className="btn-o !py-1" disabled={busy}
                  onClick={async () => (await confirmBox(m.is_published ? `Jadikan "${m.title}" draf? Peserta tidak bisa lagi membacanya.` : `Terbitkan "${m.title}" untuk peserta?`, { title: m.is_published ? 'Jadikan draf?' : 'Terbitkan bacaan?', okText: 'Ya' })) && act(() => crud('PATCH', { id: m.id, is_published: !m.is_published }))}
                >
                  {m.is_published ? 'Jadikan draf' : 'Terbitkan'}
                </button>
                <button
                  className="btn-o !py-1" disabled={busy}
                  onClick={async () => (await confirmBox(`Hapus bacaan "${m.title}"?`, { danger: true })) && act(() => crud('DELETE', undefined, `?id=${m.id}`))}
                >
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
