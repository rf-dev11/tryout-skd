'use client';
import Shell from '@/components/Shell';
import { PageSkeleton, LoadError } from '@/components/Skeleton';
import { useMeState } from '@/lib/useMe';

// Menu samping dan header dipasang sekali di sini. Pindah halaman hanya mengganti isi di dalamnya,
// dan data akun diambil dari simpanan (lihat lib/useMe.js), jadi tidak ada layar "Memuat" di tiap halaman.
export default function AppLayout({ children }) {
  const { me, error, retry } = useMeState();
  const admin = me?.profile.role === 'admin';
  return (
    <Shell me={me} admin={admin} links={admin ? [{ href: '/admin', label: 'Panel admin' }] : []}>
      {me ? children : error ? <LoadError message={error} onRetry={retry} /> : <PageSkeleton />}
    </Shell>
  );
}
