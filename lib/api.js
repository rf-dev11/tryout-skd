import { supabase } from './supabase';

export async function api(path, opts = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  let res;
  try {
    res = await fetch(path, {
      ...opts,
      headers: {
        ...(isForm ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...opts.headers,
      },
      body: opts.body && !isForm && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
    });
  } catch {
    const e = new Error('Koneksi bermasalah. Periksa internetmu lalu coba lagi.');
    e.status = 0;
    throw e;
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(json.error || 'Terjadi kesalahan');
    e.status = res.status;
    throw e;
  }
  return json;
}
