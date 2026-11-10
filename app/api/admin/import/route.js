import { db, json, err, handler, onlySubtes } from '@/lib/server';

const CATS = ['TWK', 'TIU', 'TKP'];
const LABELS = ['A', 'B', 'C', 'D', 'E'];

// Impor soal massal dari hasil baca Excel (divalidasi di browser, divalidasi ulang di sini).
export const POST = handler(async (req) => {
  const { tryout_id, rows } = await req.json();
  if (!tryout_id || !Array.isArray(rows) || !rows.length) return err('Tidak ada soal untuk diimpor');
  if (rows.length > 300) return err('Maksimal 300 soal per impor');

  const only = await onlySubtes(tryout_id);
  if (only && rows.some((r) => r.category !== only)) return err(`Paket ini khusus ${only}. Hapus baris kategori lain dari file Excel.`);

  for (const [i, r] of rows.entries()) {
    const ok =
      CATS.includes(r.category) && r.body &&
      Array.isArray(r.options) && r.options.length >= 2 &&
      r.options.every((o) => LABELS.includes(o.label) && o.body);
    if (!ok) return err(`Data soal ke-${i + 1} tidak valid`);
  }

  const { data: ex } = await db.from('questions').select('category,position').eq('tryout_id', tryout_id);
  const next = { TWK: 0, TIU: 0, TKP: 0 };
  (ex || []).forEach((q) => { next[q.category] = Math.max(next[q.category], q.position); });

  const qrows = rows.map((r) => ({
    tryout_id, category: r.category, position: ++next[r.category],
    topic: r.topic || null, body: r.body, explanation: r.explanation || null,
  }));
  const { data: ins, error } = await db.from('questions').insert(qrows).select('id,category,position');
  if (error) throw error;
  const idOf = (i) => ins.find((x) => x.category === qrows[i].category && x.position === qrows[i].position).id;

  const orows = rows.flatMap((r, i) =>
    r.options.map((o) => ({ question_id: idOf(i), label: o.label, body: o.body, points: Number(o.points) || 0 }))
  );
  const { error: e2 } = await db.from('options').insert(orows);
  if (e2) {
    await db.from('questions').delete().in('id', ins.map((x) => x.id));
    throw e2;
  }
  return json({ ok: true, count: rows.length });
}, { admin: true });
