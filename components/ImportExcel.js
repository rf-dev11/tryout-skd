'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { TOPIK } from '@/lib/config';
import { toast } from '@/lib/dialog';

const L = ['A', 'B', 'C', 'D', 'E'];
const str = (v) => (v === null || v === undefined ? '' : String(v).trim());

// Baca baris Excel (baris pertama = judul kolom) dan validasi tiap soal.
function parse(rows, only) {
  const head = (rows[0] || []).map((h) => str(h).toLowerCase());
  const need = ['kategori', 'soal', 'opsi_a', 'opsi_b'];
  const miss = need.find((k) => head.indexOf(k) < 0);
  if (miss) throw new Error(`Kolom "${miss}" tidak ditemukan di baris pertama. Pakai template yang disediakan.`);

  return rows.slice(1)
    .map((r, n) => {
      const g = (k) => (head.indexOf(k) < 0 ? '' : str(r[head.indexOf(k)]));
      return { r, row: n + 2, g };
    })
    .filter(({ r }) => r.some((c) => str(c)))
    .map(({ row, g }) => {
      const errors = [];
      const warnings = [];
      const category = g('kategori').toUpperCase();
      if (!TOPIK[category]) errors.push('kategori harus TWK, TIU, atau TKP');
      else if (only && category !== only) errors.push(`paket ini khusus ${only}`);
      const body = g('soal');
      if (!body) errors.push('soal kosong');

      let topic = g('topik');
      if (topic && TOPIK[category]) {
        const hit = TOPIK[category].find((t) => t.toLowerCase() === topic.toLowerCase());
        if (!hit) warnings.push(`topik "${topic}" tidak dikenali, dikosongkan`);
        topic = hit || '';
      }

      const filled = L.filter((l) => g('opsi_' + l.toLowerCase()));
      if (filled.length < 2) errors.push('minimal 2 pilihan jawaban');
      const kunci = g('kunci').toUpperCase();
      if (category === 'TWK' || category === 'TIU') {
        if (!L.includes(kunci) || !filled.includes(kunci)) errors.push('kolom kunci harus huruf pilihan yang terisi (A sampai E)');
      }
      const options = filled.map((l) => {
        const k = l.toLowerCase();
        let points = 0;
        if (category === 'TKP') {
          points = Number(g('poin_' + k));
          if (!Number.isInteger(points) || points < 1 || points > 5) errors.push(`poin_${k} harus angka 1 sampai 5`);
        } else {
          points = l === kunci ? 5 : 0;
        }
        return { label: l, body: g('opsi_' + k), points };
      });
      return { row, category, topic, body, explanation: g('pembahasan'), options, errors, warnings };
    });
}

export default function ImportExcel({ tryoutId, only = null, onDone }) {
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);

  const pilih = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const readXlsxFile = (await import('read-excel-file')).default;
      setRows(parse(await readXlsxFile(file), only));
    } catch (err) {
      toast(err.message || 'File tidak bisa dibaca. Gunakan file .xlsx sesuai template.', 'error');
    }
    e.target.value = '';
  };

  const ok = (rows || []).filter((r) => !r.errors.length);
  const bad = (rows || []).filter((r) => r.errors.length);

  const kirim = async () => {
    setBusy(true);
    try {
      const res = await api('/api/admin/import', {
        method: 'POST',
        body: { tryout_id: tryoutId, rows: ok.map(({ category, topic, body, explanation, options }) => ({ category, topic, body, explanation, options })) },
      });
      toast(`${res.count} soal berhasil diimpor.`, 'success');
      setRows(null);
      onDone();
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusy(false);
  };

  return (
    <section className="card space-y-3">
      <h2 className="text-xl font-medium">Impor soal dari Excel</h2>
      <p className="text-sm text-ink/60">
        Isi template, lalu unggah. Soal ditambahkan setelah soal yang sudah ada. Gambar diunggah manual lewat tombol Ubah pada soal.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <a href="/template-soal.xlsx" download className="btn-o">Unduh template</a>
        <label className="btn cursor-pointer">
          Pilih file Excel
          <input type="file" accept=".xlsx" hidden onChange={pilih} />
        </label>
      </div>

      {rows && (
        <div className="space-y-3 border-t border-ink/15 pt-3">
          <p className="text-sm font-medium">{ok.length} soal siap diimpor, {bad.length} bermasalah.</p>
          {bad.length > 0 && (
            <ul className="max-h-48 space-y-1 overflow-y-auto rounded-2xl border border-ink/25 bg-paper p-3 text-sm">
              {bad.slice(0, 30).map((r) => <li key={r.row}>Baris {r.row}: {r.errors.join('; ')}</li>)}
              {bad.length > 30 && <li>Dan {bad.length - 30} baris lain.</li>}
            </ul>
          )}
          {rows.some((r) => r.warnings.length > 0) && (
            <ul className="text-xs text-ink/60">
              {rows.filter((r) => r.warnings.length).slice(0, 10).map((r) => <li key={r.row}>Baris {r.row}: {r.warnings.join('; ')}</li>)}
            </ul>
          )}
          <div className="flex gap-3">
            <button className="btn" disabled={busy || !ok.length} onClick={kirim}>{busy ? 'Mengimpor…' : `Impor ${ok.length} soal`}</button>
            <button className="btn-o" onClick={() => setRows(null)}>Batal</button>
          </div>
        </div>
      )}
    </section>
  );
}
