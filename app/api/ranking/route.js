import { db, json, err, handler } from '@/lib/server';
export const dynamic = 'force-dynamic';

// Ranking satu tryout: nilai terbaik tiap peserta, diurutkan dari total tertinggi.
// Nilai sama: yang selesai lebih dulu di atas. Bisa difilter per instansi tujuan.
export const GET = handler(async (req, user) => {
  const sp = new URL(req.url).searchParams;
  const tryoutId = sp.get('tryout_id');
  const instansiId = sp.get('instansi_id');
  if (!tryoutId) return err('Pilih tryout');

  const { data: t } = await db.from('tryouts').select('class_id,title').eq('id', tryoutId).single();
  if (!t) return err('Tryout tidak ditemukan', 404);
  if (user.role !== 'admin') {
    const { data: enr } = await db
      .from('enrollments').select('user_id').eq('user_id', user.id).eq('class_id', t.class_id).maybeSingle();
    if (!enr) return err('Kamu belum punya akses ke kelas ini', 403);
  }

  const { data: rows, error } = await db
    .from('attempts')
    .select('user_id,score_twk,score_tiu,score_tkp,score_total,finished_at,profiles(full_name,jabatan_tujuan,instansi_id,instansi(name))')
    .eq('tryout_id', tryoutId)
    .eq('mode', 'tryout')
    .not('finished_at', 'is', null);
  if (error) throw error;

  const best = new Map();
  for (const r of rows) {
    const b = best.get(r.user_id);
    if (!b || r.score_total > b.score_total || (r.score_total === b.score_total && r.finished_at < b.finished_at)) {
      best.set(r.user_id, r);
    }
  }

  const all = [...best.values()]
    .sort((a, b) => b.score_total - a.score_total || a.finished_at.localeCompare(b.finished_at))
    .map((r, i) => ({
      is_me: r.user_id === user.id,
      rank_all: i + 1,
      name: r.profiles?.full_name || '-',
      instansi_id: r.profiles?.instansi_id || null,
      instansi: r.profiles?.instansi?.name || null,
      jabatan: r.profiles?.jabatan_tujuan || null,
      twk: r.score_twk, tiu: r.score_tiu, tkp: r.score_tkp, total: r.score_total,
    }));

  const list = (instansiId ? all.filter((r) => r.instansi_id === instansiId) : all).map((r, i) => ({ ...r, rank: i + 1 }));
  return json({
    tryout: t.title,
    jumlah: list.length,
    mine: list.find((r) => r.is_me) || null,
    list: list.slice(0, 100),
  });
});
