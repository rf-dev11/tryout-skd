'use client';
import Shell from '@/components/Shell';
import { useMe } from '@/lib/useMe';

export default function AdminLayout({ children }) {
  const me = useMe({ admin: true });
  if (!me) return <p className="p-8 text-sm">Memuat…</p>;
  return (
    <Shell me={me} links={[{ href: '/admin', label: 'Kelas dan tryout' }, { href: '/admin/siswa', label: 'Siswa' }, { href: '/admin/instansi', label: 'Instansi' }, { href: '/admin/pengumuman', label: 'Pengumuman' }]}>
      {children}
    </Shell>
  );
}
