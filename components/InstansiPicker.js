'use client';
import { useEffect, useMemo, useRef, useState } from 'react';

// Pilihan instansi dengan kolom cari: ketik sebagian nama untuk menyaring daftar yang panjang.
export default function InstansiPicker({ value, options, onChange, emptyLabel = 'Belum dipilih', id }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const box = useRef(null);
  const selected = options.find((o) => o.id === value);
  const list = useMemo(() => {
    const k = q.trim().toLowerCase();
    return k ? options.filter((o) => o.name.toLowerCase().includes(k)) : options;
  }, [q, options]);

  useEffect(() => {
    const tutup = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', tutup);
    document.addEventListener('touchstart', tutup);
    return () => {
      document.removeEventListener('mousedown', tutup);
      document.removeEventListener('touchstart', tutup);
    };
  }, []);

  const pilih = (v) => { onChange(v); setOpen(false); setQ(''); };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className={`truncate ${selected ? '' : 'text-ink/50'}`}>{selected ? selected.name : emptyLabel}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 shrink-0 transition ${open ? 'rotate-180' : ''}`} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-2xl border border-ink bg-white p-2 shadow-lg">
          <input
            autoFocus
            className="input"
            placeholder="Cari instansi…"
            aria-label="Cari instansi"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setOpen(false);
              if (e.key === 'Enter') { e.preventDefault(); if (list[0]) pilih(list[0].id); }
            }}
          />
          <ul role="listbox" className="mt-2 max-h-60 overflow-y-auto">
            {!q && (
              <li>
                <button type="button" onClick={() => pilih('')} className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-ink/60 hover:bg-ink/5">{emptyLabel}</button>
              </li>
            )}
            {list.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.id === value}
                  onClick={() => pilih(o.id)}
                  className={`w-full rounded-xl px-3 py-2.5 text-left text-sm ${o.id === value ? 'bg-sun font-medium' : 'hover:bg-ink/5'}`}
                >
                  {o.name}
                </button>
              </li>
            ))}
            {list.length === 0 && <li className="px-3 py-2.5 text-sm text-ink/60">Instansi tidak ditemukan. Minta admin menambahkannya.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
