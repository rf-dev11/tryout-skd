import { db, json, err, handler } from '@/lib/server';

export const POST = handler(async (req) => {
  const form = await req.formData();
  const file = form.get('file');
  if (!file || typeof file === 'string') return err('File kosong');
  if (!file.type.startsWith('image/')) return err('Hanya file gambar');

  const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await db.storage.from('soal').upload(path, Buffer.from(await file.arrayBuffer()), {
    contentType: file.type,
  });
  if (error) throw error;
  return json({ url: db.storage.from('soal').getPublicUrl(path).data.publicUrl });
}, { admin: true });
