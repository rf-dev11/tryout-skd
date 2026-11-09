'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from '@/lib/dialog';

export default function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    await supabase.auth.signOut();
    toast('Password berhasil diganti. Silakan masuk dengan password baru.', 'success');
    router.replace('/login');
  };

  return (
    <div className="auth-wrap">
      <div className="auth-frame">
      <form onSubmit={submit} className="auth-panel">
        <p className="text-lg font-medium tracking-tight text-flame">Tryout SKD</p>
        <h1 className="text-3xl font-medium tracking-tight">Password baru</h1>
        {!ready ? (
          <p className="text-sm">Memeriksa tautan… Jika tidak berubah, tautan sudah kedaluwarsa. <Link href="/lupa-password" className="font-medium text-flame underline">Minta tautan baru</Link>.</p>
        ) : (
          <>
            <div>
              <label className="label">Password baru (minimal 6 karakter)</label>
              <input className="input" type="password" required minLength={6} value={pw} onChange={(e) => setPw(e.target.value)} />
            </div>
            {error && <p className="rounded-xl border border-ink bg-sun p-3 text-sm">{error}</p>}
            <button className="btn w-full" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan password'}</button>
          </>
        )}
      </form>
      </div>
    </div>
  );
}
