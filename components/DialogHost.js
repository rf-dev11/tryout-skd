'use client';
import { useEffect, useRef, useState } from 'react';
import { subscribe } from '@/lib/dialog';

const TONE = {
  error: { bg: 'bg-flame text-white', label: 'Gagal', icon: <path d="M12 8v5M12 16.5v.01" /> },
  success: { bg: 'bg-sky text-ink', label: 'Berhasil', icon: <path d="M6 12.5l4 4 8-9" /> },
  warn: { bg: 'bg-sun text-ink', label: 'Perhatian', icon: <path d="M12 8v5M12 16.5v.01" /> },
  info: { bg: 'bg-lilac text-ink', label: 'Info', icon: <path d="M12 11v5M12 7.5v.01" /> },
};

function Glyph({ children, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  );
}

export default function DialogHost() {
  const [toasts, setToasts] = useState([]);
  const [modal, setModal] = useState(null);
  const [text, setText] = useState('');
  const queue = useRef([]);
  const current = useRef(null); // kotak yang sedang tampil
  const seq = useRef(0);

  const closeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const next = () => {
    const n = queue.current.shift() || null;
    current.current = n;
    setText('');
    setModal(n);
  };
  const close = (value) => {
    if (current.current) current.current.resolve(value);
    next();
  };

  useEffect(
    () =>
      subscribe((e) => {
        if (e.kind === 'toast') {
          const id = ++seq.current;
          setToasts((t) => [...t.slice(-3), { id, message: e.message, type: TONE[e.type] ? e.type : 'info' }]);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), e.type === 'error' ? 7000 : 4500);
          return;
        }
        if (current.current) {
          queue.current.push(e);
        } else {
          current.current = e;
          setModal(e);
        }
      }),
    []
  );

  useEffect(() => {
    if (!modal) return;
    const onKey = (ev) => {
      if (ev.key === 'Escape') close(modal.kind === 'prompt' ? null : false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  const isPrompt = modal?.kind === 'prompt';
  const o = modal?.opts || {};

  return (
    <>
      {/* Toast */}
      <div className="pointer-events-none fixed inset-x-3 top-3 z-[100] flex flex-col gap-2 sm:left-auto sm:right-5 sm:top-5 sm:w-[24rem]">
        {toasts.map((t) => {
          const tone = TONE[t.type];
          return (
            <div key={t.id} role={t.type === 'error' ? 'alert' : 'status'} className="toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border border-ink bg-white p-3 pr-2 shadow-[0_8px_0_-2px_rgba(28,28,28,0.12)]">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink ${tone.bg}`}>
                <Glyph>{tone.icon}</Glyph>
              </span>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-sm font-medium">{tone.label}</p>
                <p className="mt-0.5 break-words text-sm text-ink/70">{t.message}</p>
              </div>
              <button onClick={() => closeToast(t.id)} aria-label="Tutup" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/50 transition hover:bg-ink/5 hover:text-ink">
                <Glyph className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></Glyph>
              </button>
            </div>
          );
        })}
      </div>

      {/* Kotak konfirmasi dan isian */}
      {modal && (
        <div className="fade-in fixed inset-0 z-[110] flex items-end justify-center bg-ink/50 p-4 sm:items-center" onClick={() => close(isPrompt ? null : false)}>
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (isPrompt) {
                if (text.trim()) close(text.trim());
              } else close(true);
            }}
            className="pop-in w-full max-w-sm rounded-3xl border border-ink bg-paper p-6 shadow-xl"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-full border border-ink ${o.danger ? 'bg-flame text-white' : isPrompt ? 'bg-lilac' : 'bg-sun'}`}>
              <Glyph className="h-6 w-6">{isPrompt ? <path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /> : <path d="M12 8v5M12 16.5v.01" />}</Glyph>
            </span>
            <h2 className="mt-4 text-xl font-medium">{o.title || (isPrompt ? 'Isi dulu' : o.danger ? 'Yakin ingin menghapus?' : 'Konfirmasi')}</h2>
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-ink/70">{modal.message}</p>
            {isPrompt && (
              <input autoFocus className="input mt-4" value={text} placeholder={o.placeholder || ''} onChange={(e) => setText(e.target.value)} />
            )}
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button type="button" className="btn-o !min-h-11 sm:!min-h-10" onClick={() => close(isPrompt ? null : false)}>{o.cancelText || 'Batal'}</button>
              <button autoFocus={!isPrompt} className={`btn !min-h-11 sm:!min-h-10 ${o.danger ? '!border-ink !bg-ink hover:!bg-black' : ''}`} disabled={isPrompt && !text.trim()}>
                {o.okText || (isPrompt ? 'Simpan' : o.danger ? 'Ya, hapus' : 'Ya')}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
