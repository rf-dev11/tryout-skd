import { db, json, err, handler } from '@/lib/server';
import { getAttempt } from '@/lib/attempt';
import { sortQ } from '@/lib/config';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req, user, { params }) => {
  const a = await getAttempt(params.id, user);
  if (!a) return err('Hasil tidak ditemukan', 404);
  if (!a.finished_at) return err('Tryout belum selesai', 409);

  let qq = db.from('questions').select('*, options(*)').eq('tryout_id', a.tryout_id);
  if (a.mode === 'latihan' && a.subtes) qq = qq.eq('category', a.subtes);
  const { data: qs } = await qq;
  const { data: ans } = await db.from('answers').select('question_id,option_id').eq('attempt_id', a.id);
  const { data: t } = await db.from('tryouts').select('title').eq('id', a.tryout_id).single();

  return json({
    attempt: a,
    tryout: t,
    questions: sortQ(qs),
    answers: Object.fromEntries((ans || []).map((x) => [x.question_id, x.option_id])),
  });
});
