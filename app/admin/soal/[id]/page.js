'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { SKD, TOPIK } from '@/lib/config';
import ImageInput from '@/components/ImageInput';
import ImportExcel from '@/components/ImportExcel';
import { toast, confirmBox } from '@/lib/dialog';

const LABELS = ['A', 'B', 'C', 'D', 'E'];
const blank = (category = 'TWK') => ({
  id: null, category, topic: '', position: null, body: '', image_url: '', explanation: '', explanation_image_url: '',
  options: LABELS.map((label) => ({ label, body: '', image_url: '', points: 0 })),
});

export default function Soal() {
  const { id } = useParams();
  const [qs, setQs] = useState([]);
  const [tryout, setTryout] = useState(null);
  const [f, setF] = useState(blank());
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setQs(await api(`/api/admin/soal?tryout_id=${id}`));
    setTryout((await api('/api/admin/crud/tryouts')).find((t) => t.id === id));
  };
  useEffect(() => { load().catch((e) => toast(e.message, 'error')); }, []);

  const tkp = f.category === 'TKP';
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const setOpt = (n, k, v) => setF((s) => ({ ...s, options: s.options.map((o, j) => (j === n ? { ...o, [k]: v } : o)) }));
  const setKey = (n) => setF((s) => ({ ...s, options: s.options.map((o, j) => ({ ...o, points: j === n ? 5 : 0 })) }));
  const setCategory = (category) =>
    setF((s) => ({ ...s, category, topic: '', options: s.options.map((o) => ({ ...o, points: 0 })) }));

  const edit = (q) => {
    setF({
      id: q.id, category: q.category, topic: q.topic || '', position: q.position,
      body: q.body || '', image_url: q.image_url || '',
      explanation: q.explanation || '', explanation_image_url: q.explanation_image_url || '',
      options: LABELS.map((label) => {
        const o = q.options.find((x) => x.label === label);
        return o ? { label, body: o.body || '', image_url: o.image_url || '', points: o.points } : { label, body: '', image_url: '', points: 0 };
      }),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const save = async () => {
    const filled = f.options.filter((o) => o.body || o.image_url);
    if (!f.body && !f.image_url) return toast('Isi teks atau gambar soal.', 'warn');
    if (filled.length < 2) return toast('Minimal 2 pilihan jawaban.', 'warn');
    if (tkp && filled.some((o) => o.points < 1 || o.points > 5)) return toast('Poin TKP tiap pilihan harus 1 sampai 5.', 'warn');
    if (!tkp && filled.filter((o) => o.points === 5).length !== 1) return toast('Pilih satu kunci jawaban.', 'warn');
    setSaving(true);
    try {
      const inCat = qs.filter((q) => q.category === f.category);
      const position = f.position ?? Math.max(0, ...inCat.map((q) => q.position)) + 1;
      await api('/api/admin/soal', { method: 'POST', body: { ...f, tryout_id: id, position } });
      setF(blank(f.category));
      await load();
    } catch (e) {
      toast(e.message, 'error');
    }
    setSaving(false);
  };

  const hapus = async (q) => {
    if (!(await confirmBox('Hapus soal ini?', { danger: true }))) return;
    try { await api(`/api/admin/soal?id=${q.id}`, { method: 'DELETE' }); await load(); } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm font-medium text-flame underline-offset-4 hover:underline">Kembali ke kelas</Link>
        <h1 className="mt-1 text-3xl font-medium tracking-tight">{tryout?.title || 'Soal'}</h1>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {Object.entries(SKD.kategori).map(([k, v]) => {
            const n = qs.filter((q) => q.category === k).length;
            return (
              <span key={k} className={`rounded-full border border-ink px-3.5 py-1 ${n >= v.jumlah ? 'bg-ink text-white' : 'bg-white'}`}>
                {k} {n} dari {v.jumlah}
              </span>
            );
          })}
        </div>
      </div>

      <ImportExcel tryoutId={id} onDone={load} />

      <section className="card space-y-4">
        <h2 className="text-xl font-medium">{f.id ? 'Ubah soal' : 'Soal baru'}</h2>
        <div className="sm:w-64">
          <label className="label">Kategori</label>
          <select className="input" value={f.category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(SKD.kategori).map(([k, v]) => <option key={k} value={k}>{k}, {v.nama}</option>)}
          </select>
        </div>

        <div className="sm:w-64">
          <label className="label">Topik (untuk analisis hasil)</label>
          <select className="input" value={f.topic} onChange={(e) => set('topic', e.target.value)}>
            <option value="">Tanpa topik</option>
            {TOPIK[f.category].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Teks soal</label>
          <textarea className="input min-h-24" value={f.body} onChange={(e) => set('body', e.target.value)} />
          <ImageInput value={f.image_url} onChange={(v) => set('image_url', v)} />
        </div>

        <div className="space-y-3">
          <p className="label">{tkp ? 'Pilihan jawaban dan poin (1 sampai 5)' : 'Pilihan jawaban dan kunci'}</p>
          {f.options.map((o, n) => (
            <div key={o.label} className="rounded-2xl border border-ink/25 bg-paper p-3">
              <div className="flex flex-wrap items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink bg-sun font-bold">{o.label}</span>
                <div className="min-w-0 flex-1 basis-[12rem]">
                  <input className="input" placeholder={`Teks pilihan ${o.label} (boleh kosong jika pakai gambar)`} value={o.body} onChange={(e) => setOpt(n, 'body', e.target.value)} />
                  <ImageInput value={o.image_url} onChange={(v) => setOpt(n, 'image_url', v)} />
                </div>
                <div className="w-full pl-11 sm:w-auto sm:pl-0">
                {tkp ? (
                  <select className="input !w-24" value={o.points} onChange={(e) => setOpt(n, 'points', Number(e.target.value))}>
                    <option value={0}>Poin</option>
                    {[1, 2, 3, 4, 5].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <label className="flex items-center gap-2 pt-2 text-sm">
                    <input type="radio" name="kunci" className="h-4 w-4 accent-flame" checked={o.points === 5} onChange={() => setKey(n)} />
                    Kunci
                  </label>
                )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <label className="label">Pembahasan (opsional)</label>
          <textarea className="input min-h-20" value={f.explanation} onChange={(e) => set('explanation', e.target.value)} />
          <ImageInput value={f.explanation_image_url} onChange={(v) => set('explanation_image_url', v)} />
        </div>

        <div className="flex gap-3">
          <button className="btn" disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : f.id ? 'Simpan perubahan' : 'Simpan soal'}</button>
          {f.id && <button className="btn-o" onClick={() => setF(blank(f.category))}>Batal ubah</button>}
        </div>
      </section>

      {Object.keys(SKD.kategori).map((k) => {
        const list = qs.filter((q) => q.category === k);
        if (!list.length) return null;
        return (
          <section key={k} className="card">
            <h2 className="text-xl font-medium">{k} ({list.length})</h2>
            <div className="mt-2 divide-y divide-ink/10 border-t border-ink/15">
              {list.map((q, n) => (
                <div key={q.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <p className="min-w-0 flex-1 truncate">
                    <span className="mr-2 font-semibold">{n + 1}</span>
                    {(q.body || '').slice(0, 100)}{q.image_url && ' (ada gambar)'}
                    {q.topic && <span className="ml-2 rounded-md bg-lilac px-1.5 py-0.5 text-xs">{q.topic}</span>}
                  </p>
                  <button className="btn-o !py-1" onClick={() => edit(q)}>Ubah</button>
                  <button className="btn-o !py-1" onClick={() => hapus(q)}>Hapus</button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
