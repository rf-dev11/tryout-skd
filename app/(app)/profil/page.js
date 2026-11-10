'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { useMe, loadMe } from '@/lib/useMe';
import { toast, confirmBox } from '@/lib/dialog';
import { Sk } from '@/components/Skeleton';

const BLANK_PW = { lama: '', baru: '', ulang: '' };

// Pesan galat Supabase Auth diterjemahkan supaya jelas bagi peserta.
const pesanPw = (m = '') => {
  if (/different from the old/i.test(m)) return 'Password baru harus berbeda dari password lama.';
  if (/at least/i.test(m)) return 'Password baru minimal 6 karakter.';
  if (/weak|pwned|easy to guess/i.test(m)) return 'Password terlalu mudah ditebak. Gunakan kombinasi yang lebih sulit.';
  return 'Password belum bisa diganti. Coba lagi beberapa saat.';
};

export default function Profil() {
  const me = useMe();
  const [instansi, setInstansi] = useState([]);
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState(BLANK_PW);
  const [show, setShow] = useState(false);
  const [busyPw, setBusyPw] = useState(false);

  useEffect(() => {
    api('/api/profil')
      .then((r) => {
        setInstansi(r.instansi);
        setF({ full_name: r.profile.full_name, instansi_id: r.profile.instansi_id || '', jabatan_tujuan: r.profile.jabatan_tujuan || '' });
      })
      .catch((e) => toast(e.message, 'error'));
  }, []);

  if (!me) return null;
  if (!f) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Sk className="h-9 w-32" />
        <Sk className="h-80 max-w-lg !rounded-3xl" />
      </div>
    );
  }

  const save = async (e) => {
    e.preventDefault();
    if (!(await confirmBox('Perubahan nama, instansi, dan jabatan tujuan akan disimpan.', { title: 'Simpan perubahan profil?', okText: 'Ya, simpan' }))) return;
    setBusy(true);
    try {
      await api('/api/profil', { method: 'PATCH', body: f });
      loadMe({ force: true }).catch(() => {}); // nama di header ikut diperbarui
      toast('Profil berhasil disimpan.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusy(false);
  };

  const gantiPw = async (e) => {
    e.preventDefault();
    if (pw.baru.length < 6) return toast('Password baru minimal 6 karakter.', 'warn');
    if (pw.baru !== pw.ulang) return toast('Ulangi password baru dengan isian yang sama.', 'warn');
    if (pw.baru === pw.lama) return toast('Password baru harus berbeda dari password lama.', 'warn');
    if (!(await confirmBox('Mulai sekarang kamu masuk memakai password baru ini.', { title: 'Ganti password?', okText: 'Ya, ganti' }))) return;

    setBusyPw(true);
    try {
      const { data } = await supabase.auth.getSession();
      const email = data.session?.user?.email || me.profile.email;
      // Cek password lama dulu, supaya orang lain yang memegang perangkat ini tidak bisa mengganti password.
      const { error: e1 } = await supabase.auth.signInWithPassword({ email, password: pw.lama });
      if (e1) throw new Error('Password lama salah.');
      const { error: e2 } = await supabase.auth.updateUser({ password: pw.baru });
      if (e2) throw new Error(pesanPw(e2.message));
      setPw(BLANK_PW);
      toast('Password berhasil diganti. Gunakan password baru saat masuk berikutnya.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
    setBusyPw(false);
  };

  return (
    <>
      <h1 className="text-3xl font-medium tracking-tight">Profil</h1>
      <div className="mt-5 grid items-start gap-5 lg:grid-cols-2">
        <form onSubmit={save} className="card space-y-4">
          <h2 className="text-xl font-medium">Data diri</h2>
          <div>
            <label className="label">Email login</label>
            <input className="input !bg-ink/5" disabled value={me.profile.email || ''} />
          </div>
          <div>
            <label className="label">Nama lengkap</label>
            <input className="input" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">Instansi tujuan</label>
            <select className="input" value={f.instansi_id} onChange={(e) => setF({ ...f, instansi_id: e.target.value })}>
              <option value="">Belum dipilih</option>
              {instansi.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
            <p className="mt-1 text-xs text-ink/60">Dipakai untuk ranking per instansi. Instansi yang belum ada bisa diminta ke admin.</p>
          </div>
          <div>
            <label className="label">Jabatan atau formasi tujuan (opsional)</label>
            <input className="input" value={f.jabatan_tujuan} onChange={(e) => setF({ ...f, jabatan_tujuan: e.target.value })} />
          </div>
          <button className="btn" disabled={busy}>{busy ? 'Menyimpan…' : 'Simpan profil'}</button>
        </form>

        <form onSubmit={gantiPw} className="card space-y-4">
          <h2 className="text-xl font-medium">Ganti password</h2>
          <div>
            <label className="label" htmlFor="pw-lama">Password lama</label>
            <input id="pw-lama" className="input" type={show ? 'text' : 'password'} autoComplete="current-password" required value={pw.lama} onChange={(e) => setPw({ ...pw, lama: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="pw-baru">Password baru (minimal 6 karakter)</label>
            <input id="pw-baru" className="input" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={6} value={pw.baru} onChange={(e) => setPw({ ...pw, baru: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="pw-ulang">Ulangi password baru</label>
            <input id="pw-ulang" className="input" type={show ? 'text' : 'password'} autoComplete="new-password" required minLength={6} value={pw.ulang} onChange={(e) => setPw({ ...pw, ulang: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-flame" checked={show} onChange={(e) => setShow(e.target.checked)} />
            Tampilkan password
          </label>
          <button className="btn" disabled={busyPw}>{busyPw ? 'Memeriksa…' : 'Ganti password'}</button>
        </form>
      </div>
    </>
  );
}
