import { db, json, handler } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req, user) => {
  if (user.role === 'admin') return json({ profile: user, classes: [], announcements: [] });

  const { data: enr } = await db.from('enrollments').select('classes(*)').eq('user_id', user.id);
  const classes = (enr || []).map((e) => e.classes).filter(Boolean);
  const ids = classes.map((c) => c.id);

  const { data: tryouts } = await db
    .from('tryouts').select('*').in('class_id', ids).eq('is_published', true).order('created_at');
  const { data: attempts } = await db
    .from('attempts')
    .select('id,tryout_id,mode,subtes,started_at,finished_at,score_twk,score_tiu,score_tkp,score_total')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false });
  const { data: announcements } = await db
    .from('announcements').select('id,title,body,created_at')
    .eq('is_active', true).order('created_at', { ascending: false }).limit(3);

  return json({
    profile: user,
    announcements: announcements || [],
    classes: classes.map((c) => ({
      ...c,
      tryouts: (tryouts || [])
        .filter((t) => t.class_id === c.id)
        .map((t) => ({ ...t, attempts: (attempts || []).filter((a) => a.tryout_id === t.id) })),
    })),
  });
});
