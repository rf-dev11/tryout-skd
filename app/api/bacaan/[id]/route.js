import { db, json, err, handler } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req, user, { params }) => {
  const { data: m } = await db.from('materials').select('*').eq('id', params.id).maybeSingle();
  const admin = user.role === 'admin';
  if (!m || (!m.is_published && !admin)) return err('Bacaan tidak ditemukan', 404);

  if (!admin) {
    const { data: enr } = await db
      .from('enrollments').select('user_id').eq('user_id', user.id).eq('class_id', m.class_id).maybeSingle();
    if (!enr) return err('Kamu belum punya akses ke paket ini', 403);
  }
  const [{ data: pk }, { data: sib }] = await Promise.all([
    db.from('classes').select('title').eq('id', m.class_id).single(),
    db.from('materials').select('id,title').eq('class_id', m.class_id).eq('is_published', true).order('created_at'),
  ]);
  return json({ material: m, paket: pk?.title || '', siblings: sib || [] });
});
