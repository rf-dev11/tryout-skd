import { db, json, err, handler } from '@/lib/server';
import { finalize, endsAt, feedbackFor } from '@/lib/attempt';
import { SKD, sortQ } from '@/lib/config';
export const dynamic = 'force-dynamic';

// Mulai atau lanjutkan sesi. mode 'tryout' (berwaktu, masuk ranking) atau 'latihan' (per subtes, tanpa waktu).
export const POST = handler(async (req, user, { params }) => {
  const b = await req.json().catch(() => ({}));
  const mode = b.mode === 'latihan' ? 'latihan' : 'tryout';
  const subtes = mode === 'latihan' ? b.subtes : null;
  if (mode === 'latihan' && !SKD.kategori[subtes]) return err('Pilih subtes latihan');

  const { data: t } = await db.from('tryouts').select('*').eq('id', params.id).single();
  if (!t || !t.is_published) return err('Tryout tidak ditemukan', 404);

  const { data: enr } = await db
    .from('enrollments').select('user_id').eq('user_id', user.id).eq('class_id', t.class_id).maybeSingle();
  if (!enr) return err('Kamu belum punya akses ke kelas ini', 403);

  let q = db
    .from('attempts').select('*, tryouts(duration_minutes)')
    .eq('user_id', user.id).eq('tryout_id', t.id).eq('mode', mode).is('finished_at', null);
  q = subtes ? q.eq('subtes', subtes) : q.is('subtes', null);
  let { data: att } = await q.maybeSingle();

  if (mode === 'tryout' && att && Date.now() > endsAt(att)) {
    await finalize(att.id);
    return json({ finished: true, attempt_id: att.id });
  }
  if (!att) {
    const { data, error } = await db
      .from('attempts').insert({ user_id: user.id, tryout_id: t.id, mode, subtes })
      .select('*, tryouts(duration_minutes)').single();
    if (error) throw error;
    att = data;
  }

  // Poin (kunci jawaban) tidak dikirim saat ujian berjalan.
  const { data: qs } = await db
    .from('questions')
    .select('id,category,position,body,image_url,options(id,label,body,image_url)')
    .eq('tryout_id', t.id);
  const soal = sortQ(subtes ? (qs || []).filter((x) => x.category === subtes) : qs);
  const { data: ans } = await db.from('answers').select('question_id,option_id').eq('attempt_id', att.id);
  const answers = Object.fromEntries((ans || []).map((a) => [a.question_id, a.option_id]));

  return json({
    attempt_id: att.id,
    tryout: { title: t.title },
    ends_at: mode === 'tryout' ? new Date(endsAt(att)).toISOString() : null,
    now: new Date().toISOString(),
    questions: soal,
    answers,
    feedback: mode === 'latihan' ? await feedbackFor(Object.keys(answers)) : {},
  });
});
