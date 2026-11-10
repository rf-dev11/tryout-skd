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

// Tryout berwaktu yang waktunya sudah habis tetapi belum pernah dibuka lagi tidak punya nilai.
// Selesaikan otomatis supaya nilainya masuk riwayat (jeda 60 detik untuk jawaban yang masih dalam perjalanan).
export async function settleExpired(userId) {
  const { data } = await db
    .from('attempts')
    .select('id,started_at,tryouts(duration_minutes)')
    .eq('user_id', userId)
    .eq('mode', 'tryout')
    .is('finished_at', null);
  const late = (data || []).filter((a) => a.tryouts && Date.now() > endsAt(a) + 60000);
  await Promise.all(late.map((a) => finalize(a.id)));
  return late.length;
}

// Jumlah soal per kategori untuk beberapa tryout: { [tryout_id]: { TWK, TIU, TKP } }. null jika view belum dibuat.
// Hanya untuk tampilan dan jarang berubah, jadi seluruh view disimpan 30 detik di memori server
// (satu kueri untuk semua peserta, bukan satu per permintaan).
let countsCache = { at: 0, rows: null };
export async function countsFor(tryoutIds) {
  if (!tryoutIds.length) return {};
  if (!countsCache.rows || Date.now() - countsCache.at > 30000) {
    const { data, error } = await db.from('tryout_counts').select('tryout_id,category,n');
    if (error) return null;
    countsCache = { at: Date.now(), rows: data || [] };
  }
  const want = new Set(tryoutIds);
  const out = {};
  tryoutIds.forEach((id) => { out[id] = {}; });
  countsCache.rows.forEach((r) => { if (want.has(r.tryout_id)) out[r.tryout_id][r.category] = r.n; });
  return out;
}
