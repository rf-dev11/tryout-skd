'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Tombol di header beranda: "Masuk" untuk pengunjung, "Ke dashboard" untuk yang sudah login.
export default function AuthButton({ className = '' }) {
  const [masuk, setMasuk] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setMasuk(!!data.session));
  }, []);
  return masuk ? (
    <Link href="/dashboard" className={`btn ${className}`}>Ke dashboard</Link>
  ) : (
    <Link href="/login" className={`btn-o !bg-white ${className}`}>Masuk</Link>
  );
}
