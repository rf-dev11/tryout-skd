import { db, json, err, handler } from '@/lib/server';
import { sortQ } from '@/lib/config';
export const dynamic = 'force-dynamic';

const LABELS = ['A', 'B', 'C', 'D', 'E'];

export const GET = handler(async (req) => {
  const tryoutId = new URL(req.url).searchParams.get('tryout_id');
  const { data, error } = await db.from('questions').select('*, options(*)').eq('tryout_id', tryoutId);
  if (error) throw error;
  return json(sortQ(data));
}, { admin: true });

// Simpan soal baru / ubah soal lama beserta pilihan jawabannya.
export const POST = handler(async (req) => {
  const { id, options = [], ...q } = await req.json();
  const row = {
    tryout_id: q.tryout_id,
    category: q.category,
    topic: q.topic || null,
    position: q.position,
    body: q.body || null,
    image_url: q.image_url || null,
    explanation: q.explanation || null,
    explanation_image_url: q.explanation_image_url || null,
  };

  let qid = id;
  if (qid) {
    const { error } = await db.from('questions').update(row).eq('id', qid);
    if (error) throw error;
  } else {
    const { data, error } = await db.from('questions').insert(row).select().single();
    if (error) throw error;
    qid = data.id;
  }

  const keep = options.filter((o) => o.body || o.image_url);
  if (keep.length < 2) return err('Minimal 2 pilihan jawaban');

  // Upsert per label supaya riwayat jawaban peserta tidak hilang saat soal diedit.
  const { error: e1 } = await db.from('options').upsert(
    keep.map((o) => ({
      question_id: qid,
      label: o.label,
      body: o.body || null,
      image_url: o.image_url || null,
      points: Number(o.points) || 0,
    })),
    { onConflict: 'question_id,label' }
  );
  if (e1) throw e1;

  const drop = LABELS.filter((l) => !keep.find((o) => o.label === l));
  if (drop.length) await db.from('options').delete().eq('question_id', qid).in('label', drop);
  return json({ ok: true, id: qid });
}, { admin: true });

export const DELETE = handler(async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  const { error } = await db.from('questions').delete().eq('id', id);
  if (error) throw error;
  return json({ ok: true });
}, { admin: true });
