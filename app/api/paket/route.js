import { NextResponse } from 'next/server';
import { db } from '@/lib/server';
export const dynamic = 'force-dynamic';

// Daftar paket untuk beranda (tanpa login). Hanya paket aktif; isi paket cukup berupa jumlah.
export async function GET() {
  try {
    const { data: pk, error } = await db
      .from('classes')
      .select('id,title,description,price,original_price,banner_url,package_type,topic_subtes')
      .eq('is_active', true)
      .order('created_at');
    if (error) throw error;

    const ids = (pk || []).map((p) => p.id);
    let ts = [];
    let ms = [];
    if (ids.length) {
      const [a, b] = await Promise.all([
        db.from('tryouts').select('class_id,kind').in('class_id', ids).eq('is_published', true),
        db.from('materials').select('class_id').in('class_id', ids).eq('is_published', true),
      ]);
      ts = a.data || [];
      ms = b.data || [];
    }
    const list = (pk || []).map((p) => ({
      ...p,
      jumlah_tryout: ts.filter((t) => t.class_id === p.id && t.kind !== 'latihan').length,
      jumlah_latihan: ts.filter((t) => t.class_id === p.id && t.kind === 'latihan').length,
      jumlah_bacaan: ms.filter((m) => m.class_id === p.id).length,
    }));
    // Paket dapat diubah admin kapan saja; jangan sajikan salinan cache lama.
    return NextResponse.json(list, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' } });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Gagal memuat paket' }, { status: 500 });
  }
}
