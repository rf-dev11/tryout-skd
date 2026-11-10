'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { clearMe, loadMe } from '@/lib/useMe';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email atau password salah.');
      setLoading(false);
      return;
    }
    try {
      clearMe({ silent: true });
      const me = await loadMe({ force: true }); // data akun sudah siap saat halaman berikutnya terbuka
      router.replace(me.profile.role === 'admin' ? '/admin' : '/dashboard');
    } catch {
      setError('Akun belum diaktifkan admin. Hubungi admin lewat WhatsApp.');
      await supabase.auth.signOut();
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-frame">
      <form onSubmit={submit} className="auth-panel">
        <Link href="/" className="block text-lg font-medium tracking-tight text-flame">Tryout SKD</Link>
        <h1 className="text-3xl font-medium tracking-tight">Masuk</h1>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="rounded-xl border border-ink bg-sun p-3 text-sm">{error}</p>}
        <button className="btn w-full" disabled={loading}>{loading ? 'Memeriksa…' : 'Masuk'}</button>
        <Link href="/lupa-password" className="block text-sm font-medium text-flame underline-offset-4 hover:underline">Lupa password?</Link>
        <p className="text-sm text-ink/60">
          Belum punya akun? <Link href="/#paket" className="font-medium text-ink underline underline-offset-4">Beli paket</Link>, lalu admin akan membuatkan akunmu.
        </p>
      </form>
      </div>
    </div>
  );
}
