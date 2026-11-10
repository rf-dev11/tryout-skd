'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';
import { api } from './api';
import { confirmBox } from './dialog';

// Profil + paket milik user disimpan di memori. Halaman berikutnya langsung tampil dari simpanan ini,
// lalu data diperbarui diam-diam di belakang layar (tanpa layar "Memuat" setiap pindah halaman).
const store = { uid: null, me: null, at: 0, inflight: null, queued: null, live: false, subs: new Set() };
const emit = () => store.subs.forEach((f) => f());
const NO_SESSION = 'no-session';
const FRESH_MS = 5000; // data dianggap masih segar 5 detik

export function clearMe({ silent = false } = {}) {
  store.uid = null;
  store.me = null;
  store.at = 0;
  store.inflight = null;
  store.queued = null;
  if (!silent) emit();
}

export function loadMe({ force = false } = {}) {
  if (store.inflight) {
    if (!force) return store.inflight;
    // Refresh paksa saat ada yang berjalan: tunggu selesai, lalu ambil ulang sekali (digabung agar tidak menumpuk),
    // supaya perubahan yang terjadi di tengah proses tidak terlewat.
    if (!store.queued) {
      store.queued = store.inflight
        .catch(() => {})
        .then(() => { store.queued = null; return loadMe({ force: true }); });
    }
    return store.queued;
  }
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
  useEffect(() => {
    run(false);
    // Layout tetap terpasang saat navigasi; segarkan data saat pengguna kembali ke tab.
    const refresh = () => {
      if (document.visibilityState === 'visible') run(true);
    };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    // Cadangan jika Realtime terlewat. Realtime hidup: cukup ambil ulang tiap ~30 detik (hemat server saat banyak peserta).
    // Realtime mati: tiap ~15 detik. Diukur dari pengambilan data terakhir, jadi tidak menumpuk dengan refresh lain.
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const limit = store.live ? 30000 : 15000;
      if (Date.now() - store.at >= limit - 500) run(true);
    }, 5000);
    return () => {
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
      window.clearInterval(timer);
    };
  }, [run]);

  // Realtime: perubahan data dari admin langsung memicu pengambilan ulang (isi event diabaikan;
  // data tetap diambil lewat /api/me). Hanya aktif saat tab terlihat. Polling di atas tetap jadi cadangan,
  // termasuk untuk perubahan yang menyembunyikan item (nonaktif/unpublish), yang tidak lolos RLS dan tidak dikirim Realtime.
  useEffect(() => {
    if (admin) return undefined;
    let ch = null;
    let timer = null;
    let dead = false;
    const kick = () => {
      window.clearTimeout(timer);
      // Jeda acak 0,6-3,6 detik: kalau 100 peserta menerima sinyal bersamaan, permintaannya tersebar, tidak serentak.
      timer = window.setTimeout(() => run(true), 600 + Math.random() * 3000);
    };
    const open = async () => {
      if (ch || dead) return;
      const { data } = await supabase.auth.getSession();
      const uid = data.session?.user?.id;
      if (!uid || ch || dead) return;
      ch = supabase
        .channel('me-sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' }, kick)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tryouts' }, kick)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, kick)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, kick)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments', filter: `user_id=eq.${uid}` }, kick)
        .subscribe((status) => { store.live = status === 'SUBSCRIBED'; });
    };
    const close = () => {
      if (ch) { supabase.removeChannel(ch); ch = null; }
      store.live = false;
    };
    const onVis = () => (document.visibilityState === 'visible' ? open() : close());
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      dead = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
      close();
    };
  }, [run, admin]);

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
