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
    // Browser: selalu ambil baru. CDN Vercel: boleh pakai salinan 10 detik, supaya banyak pengunjung beranda
    // hanya memicu satu pembacaan database per 10 detik. Perubahan admin terlihat paling lambat ~10 detik.
    return NextResponse.json(list, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Vercel-CDN-Cache-Control': 'max-age=10',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Gagal memuat paket' }, { status: 500 });
  }
}
