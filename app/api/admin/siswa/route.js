import { db, json, err, handler } from '@/lib/server';
export const dynamic = 'force-dynamic';

export const GET = handler(async () => {
  const { data, error } = await db
    .from('profiles').select('*, enrollments(class_id), instansi(name)').eq('role', 'student').order('created_at', { ascending: false });
  if (error) throw error;
  return json(data);
}, { admin: true });

// Buat akun siswa (setelah pembayaran dikonfirmasi) + langsung beri akses kelas.
export const POST = handler(async (req) => {
  const { full_name, email, password, class_ids = [] } = await req.json();
  if (!full_name || !email || !password) return err('Nama, email, dan password wajib diisi');
  if (password.length < 6) return err('Password minimal 6 karakter');

  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return err(error.message);

  const { error: e2 } = await db.from('profiles').insert({ id: data.user.id, full_name, email, role: 'student' });
  if (e2) {
    await db.auth.admin.deleteUser(data.user.id);
    throw e2;
  }
  if (class_ids.length) {
    await db.from('enrollments').insert(class_ids.map((c) => ({ user_id: data.user.id, class_id: c })));
  }
  return json({ ok: true });
}, { admin: true });

// Atur akses kelas ({user_id, class_id, on}) atau ganti password ({user_id, password}).
export const PATCH = handler(async (req) => {
  const { user_id, class_id, on, password } = await req.json();
  if (password) {
    if (password.length < 6) return err('Password minimal 6 karakter');
    const { error } = await db.auth.admin.updateUserById(user_id, { password });
    if (error) return err(error.message);
    return json({ ok: true });
  }
  if (on) await db.from('enrollments').upsert({ user_id, class_id });
  else await db.from('enrollments').delete().eq('user_id', user_id).eq('class_id', class_id);
  return json({ ok: true });
}, { admin: true });

export const DELETE = handler(async (req) => {
  const id = new URL(req.url).searchParams.get('id');
  const { error } = await db.auth.admin.deleteUser(id);
  if (error) return err(error.message);
  return json({ ok: true });
}, { admin: true });
