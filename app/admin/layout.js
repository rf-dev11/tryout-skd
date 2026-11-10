'use client';
import Shell from '@/components/Shell';
import { PageSkeleton, LoadError } from '@/components/Skeleton';
import { useMeState } from '@/lib/useMe';

export default function AdminLayout({ children }) {
  const { me, error, retry } = useMeState({ admin: true });
  return (
    <Shell
      me={me}
      admin
      links={[{ href: '/admin', label: 'Paket dan tryout' }, { href: '/admin/siswa', label: 'Siswa' }, { href: '/admin/instansi', label: 'Instansi' }, { href: '/admin/pengumuman', label: 'Pengumuman' }]}
    >
      {me ? children : error ? <LoadError message={error} onRetry={retry} /> : <PageSkeleton cards={2} />}
    </Shell>
  );
}
