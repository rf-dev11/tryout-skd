import { db, json, err, handler } from '@/lib/server';
export const dynamic = 'force-dynamic';

const ALLOWED = ['classes', 'tryouts', 'instansi', 'announcements'];
const check = (t) => ALLOWED.includes(t);

export const GET = handler(async (req, user, { params }) => {
  if (!check(params.table)) return err('Tabel tidak valid', 404);
  const { data, error } = await db.from(params.table).select('*').order('created_at');
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
