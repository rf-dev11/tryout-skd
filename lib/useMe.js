'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { api } from './api';
import { confirmBox } from './dialog';

// Profil + paket milik user disimpan di memori. Halaman berikutnya langsung tampil dari simpanan ini,
// lalu data diperbarui diam-diam di belakang layar (tanpa layar "Memuat" setiap pindah halaman).
const store = { uid: null, me: null, at: 0, inflight: null, subs: new Set() };
const emit = () => store.subs.forEach((f) => f());
const NO_SESSION = 'no-session';
const FRESH_MS = 20000; // data dianggap masih segar 20 detik

export function clearMe({ silent = false } = {}) {
  store.uid = null;
  store.me = null;
  store.at = 0;
  store.inflight = null;
  if (!silent) emit();
}

export function loadMe({ force = false } = {}) {
  if (store.inflight) return store.inflight;
  if (!force && store.me && Date.now() - store.at < FRESH_MS) return Promise.resolve(store.me);
  const p = (async () => {
    const { data } = await supabase.auth.getSession();
    const uid = data.session?.user?.id;
    if (!uid) {
      clearMe();
      throw new Error(NO_SESSION);
    }
    if (store.uid && store.uid !== uid) store.me = null; // ganti akun: buang data akun lama
    const m = await api('/api/me');
    store.uid = uid;
    store.me = m;
    store.at = Date.now();
    emit();
    return m;
  })().finally(() => { store.inflight = null; });
  store.inflight = p;
  return p;
}

export function useMeState({ admin = false } = {}) {
  const router = useRouter();
  const [, bump] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const f = () => bump((n) => n + 1);
    store.subs.add(f);
    return () => store.subs.delete(f);
  }, []);

  const run = useCallback((force) => {
    setError('');
    loadMe({ force })
      .then((m) => { if (admin && m.profile.role !== 'admin') router.replace('/dashboard'); })
      .catch((e) => {
        if (e.message === NO_SESSION || e.status === 401) router.replace('/login');
        else setError(e.message);
      });
  }, []);
  useEffect(() => { run(false); }, []);

  const me = store.me && !(admin && store.me.profile.role !== 'admin') ? store.me : null;
  return { me, error, retry: () => run(true) };
}

export const useMe = (opts) => useMeState(opts).me;

// Keluar: tanya dulu, lalu kembali ke halaman awal.
export function useLogout() {
  const router = useRouter();
  return async () => {
    const ok = await confirmBox('Kamu akan keluar dari akunmu. Jawaban yang sudah tersimpan tidak hilang.', {
      title: 'Keluar dari akun?',
      okText: 'Ya, keluar',
      cancelText: 'Tetap di sini',
    });
    if (!ok) return;
    clearMe({ silent: true });
    await supabase.auth.signOut();
    router.replace('/');
  };
}
