'use client';
import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function LupaPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setError('Gagal mengirim email. Coba lagi beberapa saat atau minta admin lewat WhatsApp.');
    else setSent(true);
    setBusy(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-frame">
      <form onSubmit={submit} className="auth-panel">
        <p className="text-lg font-medium tracking-tight text-flame">OneShoot ASN</p>
        <h1 className="text-3xl font-medium tracking-tight">Lupa password</h1>
        {sent ? (
          <p className="text-sm">Jika email terdaftar, tautan untuk membuat password baru sudah dikirim. Cek kotak masuk dan folder spam.</p>
        ) : (
          <>
            <div>
              <label className="label">Email akun</label>
              <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {error && <p className="rounded-xl border border-ink bg-sun p-3 text-sm">{error}</p>}
            <button className="btn w-full" disabled={busy}>{busy ? 'Mengirim…' : 'Kirim tautan reset'}</button>
            <p className="text-xs text-ink/60">Email tidak aktif? Minta admin mengganti passwordmu lewat WhatsApp.</p>
          </>
        )}
        <Link href="/login" className="block text-sm font-medium text-flame underline-offset-4 hover:underline">Kembali ke halaman masuk</Link>
      </form>
      </div>
    </div>
  );
}
