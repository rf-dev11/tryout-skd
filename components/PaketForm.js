'use client';
import { useId, useState } from 'react';
import { PAKET, SKD, adaDiskon } from '@/lib/config';
import { toast } from '@/lib/dialog';
import BannerInput from './BannerInput';
import Price from './Price';

// Formulir paket: dipakai untuk paket baru dan untuk mengubah paket. onSave boleh mengembalikan false untuk menahan formulir tetap terbuka.
export default function PaketForm({ initial, onSave, onCancel, submitText = 'Simpan paket' }) {
  const [f, setF] = useState(() => ({
    title: initial?.title || '',
    description: initial?.description || '',
    price: initial?.price ?? '',
    original_price: initial?.original_price || '',
    package_type: initial?.package_type || 'tryout',
    topic_subtes: initial?.topic_subtes || 'TIU',
    banner_url: initial?.banner_url || '',
  }));
  const [busy, setBusy] = useState(false);
  const uid = useId();
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  const price = Number(f.price) || 0;
  const original = Number(f.original_price) || 0;
  const salah = original && original <= price ? 'Harga normal harus lebih besar dari harga jual, atau kosongkan.' : '';

  const submit = async (e) => {
    e.preventDefault();
    if (salah) return toast(salah, 'warn');
    setBusy(true);
    try {
      await onSave({
        title: f.title.trim(),
        description: f.description.trim() || null,
        price,
        original_price: original > price ? original : null,
        package_type: f.package_type,
        topic_subtes: f.package_type === 'topik' ? f.topic_subtes : null,
        banner_url: f.banner_url || null,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor={`${uid}-judul`}>Nama paket</label>
            <input id={`${uid}-judul`} className="input" required value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Contoh: Paket Hemat 5 Tryout SKD" />
          </div>
          <div>
            <label className="label" htmlFor={`${uid}-desk`}>Deskripsi singkat</label>
            <input id={`${uid}-desk`} className="input" value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Satu kalimat tentang isi paket" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`${uid}-jenis`}>Jenis paket</label>
              <select id={`${uid}-jenis`} className="input" value={f.package_type} onChange={(e) => set('package_type', e.target.value)}>
                {Object.entries(PAKET).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <p className="mt-1 text-xs text-ink/60">{PAKET[f.package_type].ringkas}.</p>
            </div>
            {f.package_type === 'topik' && (
              <div>
                <label className="label" htmlFor={`${uid}-sub`}>Subtes</label>
                <select id={`${uid}-sub`} className="input" value={f.topic_subtes} onChange={(e) => set('topic_subtes', e.target.value)}>
                  {Object.entries(SKD.kategori).map(([k, v]) => <option key={k} value={k}>{k}, {v.nama}</option>)}
                </select>
                <p className="mt-1 text-xs text-ink/60">Soal di paket ini hanya boleh dari subtes ini.</p>
              </div>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor={`${uid}-harga`}>Harga jual (Rp)</label>
              <input id={`${uid}-harga`} className="input" type="number" min="0" required value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="15000" />
            </div>
            <div>
              <label className="label" htmlFor={`${uid}-normal`}>Harga normal, dicoret (opsional)</label>
              <input id={`${uid}-normal`} className="input" type="number" min="0" value={f.original_price} onChange={(e) => set('original_price', e.target.value)} placeholder="23000" />
            </div>
          </div>
          {salah ? (
            <p className="rounded-xl border border-ink bg-sun p-3 text-sm">{salah}</p>
          ) : (
            (price > 0 || original > 0) && (
              <div className="rounded-2xl border border-dashed border-ink/30 px-4 py-3">
                <p className="mb-1 text-xs text-ink/60">Tampilan harga di beranda</p>
                <Price price={price} original={adaDiskon(price, original) ? original : null} />
              </div>
            )
          )}
        </div>
        <div>
          <label className="label">Banner</label>
          <BannerInput value={f.banner_url} onChange={(v) => set('banner_url', v)} />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button className="btn" disabled={busy || !f.title.trim()}>{busy ? 'Menyimpan…' : submitText}</button>
        {onCancel && <button type="button" className="btn-o" onClick={onCancel}>Batal</button>}
      </div>
    </form>
  );
}
