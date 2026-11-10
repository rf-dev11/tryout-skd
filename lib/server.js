import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Klien dengan service role: hanya dipakai di server (route handler).
export const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const json = (data, status = 200) => NextResponse.json(data, { status });
export const err = (msg, status = 400) => json({ error: msg }, status);

export async function getUser(req) {
  const token = (req.headers.get('authorization') || '').replace('Bearer ', '');
  if (!token) return null;
  const { data } = await db.auth.getUser(token);
  if (!data?.user) return null;
  const { data: profile } = await db.from('profiles').select('*').eq('id', data.user.id).single();
  return profile || null;
}

export function handler(fn, { admin = false } = {}) {
  return async (req, ctx) => {
    try {
      const user = await getUser(req);
      if (!user) return err('Belum login', 401);
      if (admin && user.role !== 'admin') return err('Khusus admin', 403);
      return await fn(req, user, { ...ctx, params: await ctx?.params });
    } catch (e) {
      return err(e.message || 'Terjadi kesalahan', 500);
    }
  };
}

// Paket topik hanya boleh berisi satu subtes. Mengembalikan subtes itu, atau null jika paketnya bebas.
export async function onlySubtes(tryoutId) {
  const { data } = await db.from('tryouts').select('classes(package_type,topic_subtes)').eq('id', tryoutId).single();
  const c = data?.classes;
  return c?.package_type === 'topik' ? c.topic_subtes : null;
}
