'use client';
import Link from 'next/link';
import { useMe } from '@/lib/useMe';
import PaketSection from '@/components/PaketSection';

export default function TambahPaket() {
  const me = useMe();
  if (!me) return null;
  return (
    <>
      <Link href="/dashboard" className="text-sm font-medium text-flame underline-offset-4 hover:underline">Kembali ke dashboard</Link>
      <h1 className="mt-2 text-3xl font-medium tracking-tight">Tambah paket</h1>
      <p className="mt-1 max-w-xl text-sm text-ink/60">
        Pilih paket yang kamu mau, bayar lewat QRIS, lalu kirim bukti pembayaran ke admin lewat WhatsApp. Setelah dikonfirmasi, paket muncul di dashboardmu.
      </p>
      <div className="mt-6">
        <PaketSection owned={me.classes.map((c) => c.id)} buyer={{ name: me.profile.full_name, email: me.profile.email || '' }} />
      </div>
    </>
  );
}
