'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/dialog';

const MAX = 4 * 1024 * 1024; // batas upload di Vercel

// Perkecil gambar di perangkat sebelum diunggah: lebih ringan dan tidak mentok batas 4 MB.
async function shrink(file, maxW = 1280) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, maxW / bmp.width);
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale);
    c.height = Math.round(bmp.height * scale);
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.86));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export default function BannerInput({ value, onChange }) {
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const picked = e.target.files[0];
    e.target.value = '';
    if (!picked) return;
    setBusy(true);
    try {
      const file = await shrink(picked);
      if (file.size > MAX) throw new Error('Gambar masih lebih dari 4 MB. Pilih gambar yang lebih kecil.');
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await api('/api/admin/upload', { method: 'POST', body: fd });
      onChange(url);
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusy(false);
  };

  return (
    <div>
      <div className="relative aspect-[16/9] w-full max-w-sm overflow-hidden rounded-2xl border border-ink bg-white">
        {value ? (
          <img src={value} alt="Banner paket" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center bg-[repeating-linear-gradient(45deg,rgba(28,28,28,.06)_0_10px,transparent_10px_20px)] px-4 text-center text-sm text-ink/60">
            Belum ada banner. Disarankan rasio 16:9, misalnya 1280 x 720.
          </div>
        )}
        {busy && <div className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm font-medium">Mengunggah…</div>}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
        <label className={`btn-o cursor-pointer !px-3 !py-1.5 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
          {value ? 'Ganti banner' : 'Unggah banner'}
          <input type="file" accept="image/*" hidden onChange={upload} />
        </label>
        {value && !busy && (
          <button type="button" className="font-medium text-flame underline-offset-4 hover:underline" onClick={() => onChange('')}>
            Hapus banner
          </button>
        )}
      </div>
    </div>
  );
}
