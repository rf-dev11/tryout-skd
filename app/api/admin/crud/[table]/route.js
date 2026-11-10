import { db, json, err, handler } from '@/lib/server';
export const dynamic = 'force-dynamic';

const ALLOWED = ['classes', 'tryouts', 'instansi', 'announcements', 'materials'];
const check = (t) => ALLOWED.includes(t);

export const GET = handler(async (req, user, { params }) => {
  if (!check(params.table)) return err('Tabel tidak valid', 404);
  // ?class_id=... menyaring per paket, ?cols=id,title membatasi kolom (hemat data untuk daftar panjang).
  const sp = new URL(req.url).searchParams;
  const cols = /^[a-z_,]+$/.test(sp.get('cols') || '') ? sp.get('cols') : '*';
  let q = db.from(params.table).select(cols).order('created_at');
  if (sp.get('class_id')) q = q.eq('class_id', sp.get('class_id'));
  const { data, error } = await q;
  if (error) throw error;
  return json(data);
}, { admin: true });

export const POST = handler(async (req, user, { params }) => {
  if (!check(params.table)) return err('Tabel tidak valid', 404);
  const { error } = await db.from(params.table).insert(await req.json());
  if (error) throw error;
  return json({ ok: true });
}, { admin: true });

export const PATCH = handler(async (req, user, { params }) => {
  if (!check(params.table)) return err('Tabel tidak valid', 404);
  const { id, ...fields } = await req.json();
  const { error } = await db.from(params.table).update(fields).eq('id', id);
  if (error) throw error;
  return json({ ok: true });
}, { admin: true });

export const DELETE = handler(async (req, user, { params }) => {
  if (!check(params.table)) return err('Tabel tidak valid', 404);
  const id = new URL(req.url).searchParams.get('id');
  const { error } = await db.from(params.table).delete().eq('id', id);
  if (error) throw error;
  return json({ ok: true });
}, { admin: true });
