import { db, json, err, handler } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = handler(async (req, user) => {
  const { data } = await db.from('instansi').select('id,name').order('name');
  return json({ profile: user, instansi: data || [] });
});

// Peserta hanya boleh mengubah nama, instansi tujuan, dan jabatan tujuan miliknya sendiri.
export const PATCH = handler(async (req, user) => {
  const b = await req.json();
  const full_name = (b.full_name || '').trim();
  if (!full_name) return err('Nama tidak boleh kosong');
  const { error } = await db
    .from('profiles')
    .update({
      full_name,
      instansi_id: b.instansi_id || null,
      jabatan_tujuan: (b.jabatan_tujuan || '').trim() || null,
    })
    .eq('id', user.id);
  if (error) throw error;
  return json({ ok: true });
});
