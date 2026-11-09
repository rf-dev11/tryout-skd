import { db } from './server';

export async function getAttempt(id, user) {
  const { data } = await db
    .from('attempts')
    .select('*, tryouts(duration_minutes)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  return data;
}

export const endsAt = (a) => new Date(a.started_at).getTime() + a.tryouts.duration_minutes * 60000;

// Hitung skor: TWK/TIU = poin kunci (5), TKP = poin pilihan (1-5).
export async function finalize(attemptId) {
  const { data: rows } = await db
    .from('answers')
    .select('options(points), questions(category)')
    .eq('attempt_id', attemptId);
  const s = { TWK: 0, TIU: 0, TKP: 0 };
  (rows || []).forEach((r) => {
    if (r.questions && r.options) s[r.questions.category] += r.options.points || 0;
  });
  await db
    .from('attempts')
    .update({
      finished_at: new Date().toISOString(),
      score_twk: s.TWK,
      score_tiu: s.TIU,
      score_tkp: s.TKP,
      score_total: s.TWK + s.TIU + s.TKP,
    })
    .eq('id', attemptId)
    .is('finished_at', null);
}

// Kunci + pembahasan per soal, dipakai mode latihan setelah peserta menjawab.
export async function feedbackFor(ids) {
  if (!ids.length) return {};
  const { data } = await db
    .from('questions')
    .select('id,explanation,explanation_image_url,options(id,points)')
    .in('id', ids);
  return Object.fromEntries(
    (data || []).map((q) => [
      q.id,
      {
        pts: Object.fromEntries(q.options.map((o) => [o.id, o.points])),
        explanation: q.explanation,
        explanation_image_url: q.explanation_image_url,
      },
    ])
  );
}
