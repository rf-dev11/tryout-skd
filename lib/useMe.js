'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { api } from './api';

// Memuat profil + kelas milik user. Mengarahkan ke /login jika belum masuk.
export function useMe({ admin = false } = {}) {
  const router = useRouter();
  const [me, setMe] = useState(null);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return router.replace('/login');
      try {
        const m = await api('/api/me');
        if (admin && m.profile.role !== 'admin') return router.replace('/dashboard');
        setMe(m);
      } catch {
        router.replace('/login');
      }
    })();
  }, []);
  return me;
}
