import { json, err, handler } from '@/lib/server';
import { getAttempt, finalize } from '@/lib/attempt';
export const dynamic = 'force-dynamic';

export const POST = handler(async (req, user, { params }) => {
  const a = await getAttempt(params.id, user);
  if (!a) return err('Sesi tidak ditemukan', 404);
  await finalize(a.id);
  return json({ ok: true });
});
