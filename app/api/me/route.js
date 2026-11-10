import { db, json, handler } from '@/lib/server';
import { settleExpired, countsFor } from '@/lib/attempt';
export const dynamic = 'force-dynamic';

const kosong = Promise.resolve({ data: [] });

export const GET = handler(async (req, user) => {
  if (user.role === 'admin') return json({ profile: user, classes: [], announcements: [] });

  // Gelombang 1: semua yang tidak saling bergantung dijalankan bersamaan (lebih cepat di koneksi lambat).
  const [, enr, ann] = await Promise.all([
    settleExpired(user.id),
    db.from('enrollments').select('classes(*)').eq('user_id', user.id),
    db.from('announcements').select('id,title,body,created_at').eq('is_active', true).order('created_at', { ascending: false }).limit(3),
  ]);
  const classes = (enr.data || [])
    .map((e) => e.classes)
    .filter(Boolean)
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  const ids = classes.map((c) => c.id);

  // Gelombang 2
  const [tys, atts, mats] = await Promise.all([
    ids.length ? db.from('tryouts').select('*').in('class_id', ids).eq('is_published', true).order('created_at') : kosong,
    db.from('attempts')
      .select('id,tryout_id,mode,subtes,started_at,finished_at,score_twk,score_tiu,score_tkp,score_total')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(300),
    ids.length ? db.from('materials').select('id,class_id,title').in('class_id', ids).eq('is_published', true).order('created_at') : kosong,
  ]);
  const tryouts = tys.data || [];
  const counts = await countsFor(tryouts.map((t) => t.id)); // null jika migrasi belum dijalankan

  return json({
    profile: user,
    announcements: ann.data || [],
    classes: classes.map((c) => ({
      ...c,
      materials: (mats.data || []).filter((m) => m.class_id === c.id),
      tryouts: tryouts
        .filter((t) => t.class_id === c.id)
        .map((t) => ({
          ...t,
          counts: counts ? counts[t.id] : null,
          attempts: (atts.data || []).filter((a) => a.tryout_id === t.id),
        })),
    })),
  });
});
