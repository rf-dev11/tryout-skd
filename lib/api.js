import { supabase } from './supabase';

export async function api(path, opts = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const isForm = typeof FormData !== 'undefined' && opts.body instanceof FormData;
  const res = await fetch(path, {
    ...opts,
    headers: {
      ...(isForm ? {} : { 'Content-Type': 'application/json' }),
      Authorization: `Bearer ${token}`,
      ...opts.headers,
    },
    body: opts.body && !isForm && typeof opts.body !== 'string' ? JSON.stringify(opts.body) : opts.body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Terjadi kesalahan');
  return json;
}
