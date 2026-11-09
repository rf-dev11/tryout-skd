// Pengganti alert, confirm, dan prompt bawaan browser.
// toast(pesan, jenis)      : notifikasi kecil, hilang sendiri. Jenis: 'error' | 'success' | 'warn' | 'info'
// confirmBox(pesan, opsi)  : kotak konfirmasi, mengembalikan Promise<boolean>
// promptBox(pesan, opsi)   : kotak isian, mengembalikan Promise<string | null>
// Opsi: { title, okText, cancelText, danger, placeholder }
const listeners = new Set();
const emit = (e) => listeners.forEach((l) => l(e));

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const toast = (message, type = 'info') => emit({ kind: 'toast', message: String(message ?? ''), type });

export const confirmBox = (message, opts = {}) =>
  new Promise((resolve) => (listeners.size ? emit({ kind: 'confirm', message, opts, resolve }) : resolve(false)));

export const promptBox = (message, opts = {}) =>
  new Promise((resolve) => (listeners.size ? emit({ kind: 'prompt', message, opts, resolve }) : resolve(null)));
