import { db, json, err, handler } from '@/lib/server';
import { getAttempt, endsAt, feedbackFor } from '@/lib/attempt';
export const dynamic = 'force-dynamic';

export const POST = handler(async (req, user, { params }) => {
  const a = await getAttempt(params.id, user);
  if (!a || a.finished_at) return err('Sesi sudah selesai', 409);
  const latihan = a.mode === 'latihan';
  if (!latihan && Date.now() > endsAt(a) + 30000) return err('Waktu sudah habis', 409);

  const { question_id, option_id } = await req.json();
  if (!option_id) {
    if (!latihan) await db.from('answers').delete().eq('attempt_id', a.id).eq('question_id', question_id);
    return json({ ok: true });
  }

  // Pastikan pilihan memang milik soal tersebut dan soal milik tryout ini.
  const { data: ok } = await db
    .from('options')
    .select('id, questions!inner(tryout_id)')
    .eq('id', option_id).eq('question_id', question_id).eq('questions.tryout_id', a.tryout_id)
    .maybeSingle();
  if (!ok) return err('Jawaban tidak valid');

  if (latihan) {
    // Jawaban latihan dikunci: hanya jawaban pertama yang dipakai.
    const { data: ex } = await db
      .from('answers').select('option_id').eq('attempt_id', a.id).eq('question_id', question_id).maybeSingle();
    if (!ex) {
      const { error } = await db.from('answers').insert({ attempt_id: a.id, question_id, option_id });
      if (error) throw error;
    }
    const fb = await feedbackFor([question_id]);
    return json({ ok: true, option_id: ex?.option_id || option_id, feedback: fb[question_id] });
  }

  const { error } = await db.from('answers').upsert({ attempt_id: a.id, question_id, option_id });
  if (error) throw error;
  return json({ ok: true });
});
