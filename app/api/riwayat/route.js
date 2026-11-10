import { db, json, handler } from '@/lib/server';
import { settleExpired, countsFor } from '@/lib/attempt';
export const dynamic = 'force-dynamic';

// Semua nilai yang pernah diperoleh peserta, termasuk dari tryout/paket yang kini disembunyikan.
export const GET = handler(async (req, user) => {
  await settleExpired(user.id);
  const { data, error } = await db
    .from('attempts')
    .select('id,tryout_id,mode,subtes,finished_at,score_twk,score_tiu,score_tkp,score_total,tryouts(title,kind,classes(title))')
    .eq('user_id', user.id)
    .not('finished_at', 'is', null)
    .order('finished_at', { ascending: false })
    .limit(200);
  if (error) throw error;

  const counts = await countsFor([...new Set((data || []).map((a) => a.tryout_id))]);
  return json(
    (data || []).map((a) => ({
      id: a.id,
      mode: a.mode,
      subtes: a.subtes,
      finished_at: a.finished_at,
      score_twk: a.score_twk,
      score_tiu: a.score_tiu,
      score_tkp: a.score_tkp,
      score_total: a.score_total,
      title: a.tryouts?.title || 'Tryout',
      paket: a.tryouts?.classes?.title || '',
      kategori: counts?.[a.tryout_id] ? Object.keys(counts[a.tryout_id]).filter((k) => counts[a.tryout_id][k] > 0) : null,
    }))
  );
});
