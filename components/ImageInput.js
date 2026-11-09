'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/lib/dialog';

export default function ImageInput({ value, onChange }) {
  const [busy, setBusy] = useState(false);
  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { url } = await api('/api/admin/upload', { method: 'POST', body: fd });
      onChange(url);
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusy(false);
    e.target.value = '';
  };
  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
      {value && <img src={value} alt="" className="h-16 rounded-lg border border-ink/30 bg-white object-contain" />}
      <label className="btn-o cursor-pointer !px-2 !py-1">
        {busy ? 'Mengunggah…' : value ? 'Ganti gambar' : 'Tambah gambar'}
        <input type="file" accept="image/*" hidden onChange={upload} />
      </label>
      {value && <button type="button" className="font-medium text-flame underline-offset-4 hover:underline" onClick={() => onChange('')}>Hapus gambar</button>}
    </div>
  );
}
