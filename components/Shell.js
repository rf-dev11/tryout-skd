'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLogout } from '@/lib/useMe';
import { Sk } from './Skeleton';

const STUDENT = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/riwayat', label: 'Riwayat' },
  { href: '/ranking', label: 'Ranking' },
  { href: '/profil', label: 'Profil' },
];

// Ikon garis sederhana, dipilih berdasarkan alamat menu.
const ICONS = {
  '/dashboard': <><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></>,
  '/riwayat': <><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1M3.5 4.5v4h4" /><path d="M12 7.5V12l3 2" /></>,
  '/ranking': <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" /></>,
  '/profil': <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  '/admin': <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />,
  '/admin/siswa': <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5" /><circle cx="17" cy="9" r="2.5" /><path d="M17 14.5c2.5 0 4.5 1.5 4.5 4" /></>,
  '/admin/instansi': <path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M14 9h5a1 1 0 0 1 1 1v11M3 21h18M8 8h2M8 12h2M8 16h2" />,
  '/admin/pengumuman': <path d="M3 11v3a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 9a4 4 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
};

function Icon({ name, className = 'h-6 w-6' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name] || ICONS['/dashboard']}
    </svg>
  );
}

// Shell dipasang sekali di layout, jadi menu samping tidak ikut dimuat ulang saat pindah halaman.
// admin: true untuk panel admin. Saat data akun masih dimuat (me kosong), kerangka menu tetap tampil.
export default function Shell({ me, links = [], admin = false, children }) {
  const path = usePathname() || '';
  const logout = useLogout();
  const student = !admin;
  const nav = [...(student ? STUDENT : []), ...links];
  const on = (h) => (h === '/admin' ? path === h : path === h || path.startsWith(h + '/'));

  return (
    <div className="app-bg">
      <div className="app-frame">
        {/* Desktop: bilah ikon di sisi kiri */}
        <aside className="sticky top-0 hidden h-screen w-[84px] shrink-0 flex-col items-center justify-between self-start bg-frame py-5 md:flex">
          <div className="flex flex-col items-center gap-3">
            <Link href="/" aria-label="Beranda" className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-flame text-sm font-bold tracking-wide text-white">OS</Link>
            {nav.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-label={l.label}
                title={l.label}
                className={`group relative flex h-12 w-12 items-center justify-center rounded-2xl transition ${on(l.href) ? 'bg-sun text-ink' : 'text-white/80 hover:bg-white/10'}`}
              >
                <Icon name={l.href} />
                <span className="pointer-events-none absolute left-full z-30 ml-3 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-xs text-white group-hover:block">{l.label}</span>
              </Link>
            ))}
          </div>
          <button aria-label="Keluar" title="Keluar" onClick={logout} className="flex h-12 w-12 items-center justify-center rounded-2xl text-white/80 transition hover:bg-white/10">
            <Icon name="logout" />
          </button>
        </aside>

        <div className="app-panel">
         <div className="mx-auto w-full max-w-7xl">
          <header className="px-5 pt-5 sm:px-8 sm:pt-7">
            <div className="flex items-center justify-between gap-3">
              <Link href="/" className="flex items-baseline gap-2">
                <span className="hidden text-sm text-ink/60 sm:inline">Selamat datang di</span>
                <span className="text-2xl font-medium tracking-tight text-flame">OneShoot ASN</span>
              </Link>
              {!me && <Sk className="h-11 w-11 !rounded-full sm:w-44" />}
              {me && (
                <div className="flex items-center gap-3">
                  <Link href={student ? '/profil' : '/admin'} aria-label="Buka profil" className="flex items-center gap-2.5 rounded-full border border-ink bg-white py-1 pl-1 pr-4 transition hover:bg-ink/5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sun text-base font-semibold">
                      {(me.profile.full_name || '?').trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="hidden min-w-0 leading-tight sm:block">
                      <span className="block max-w-[10rem] truncate text-sm font-medium">{me.profile.full_name}</span>
                      <span className="block max-w-[10rem] truncate text-xs text-ink/60">{me.profile.role === 'admin' ? 'Admin' : me.profile.instansi_name ? `Tujuan ${me.profile.instansi_name}` : 'Peserta'}</span>
                    </span>
                  </Link>
                  <button onClick={logout} aria-label="Keluar" className="flex h-11 w-11 items-center justify-center rounded-full border border-ink bg-white transition hover:bg-ink/5 md:hidden">
                    <Icon name="logout" className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Admin di ponsel: menu bisa digeser ke samping */}
            {!student && nav.length > 0 && (
              <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 md:hidden">
                {nav.map((l) => (
                  <Link key={l.href} href={l.href} className={`shrink-0 rounded-full border border-ink px-4 py-2 text-sm ${on(l.href) ? 'bg-ink text-white' : 'bg-white'}`}>{l.label}</Link>
                ))}
              </div>
            )}
          </header>

          <main className={`px-5 py-6 sm:px-8 ${student ? 'pb-28 md:pb-10' : 'pb-10'}`}>{children}</main>
         </div>
        </div>
      </div>

      {/* Peserta di ponsel: menu tab di bawah layar */}
      {student && (
        <nav className="fixed inset-x-3 bottom-3 z-20 grid grid-cols-4 gap-1 rounded-3xl bg-frame p-1.5 pb-[calc(0.375rem+env(safe-area-inset-bottom))] shadow-lg md:hidden">
          {STUDENT.map((l) => (
            <Link key={l.href} href={l.href} className={`flex flex-col items-center gap-0.5 rounded-2xl py-2 text-xs font-medium ${on(l.href) ? 'bg-sun text-ink' : 'text-white/80'}`}>
              <Icon name={l.href} className="h-5 w-5" />
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
