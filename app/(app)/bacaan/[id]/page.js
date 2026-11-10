'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Sk, LoadError } from '@/components/Skeleton';

export default function Bacaan() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    setError('');
    setD(null);
    api(`/api/bacaan/${id}`).then(setD).catch((e) => setError(e.message));
  };
  useEffect(load, [id]);
  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);

  if (error) return <LoadError message={error} onRetry={load} />;
  if (!d) return <div className="space-y-4" aria-busy="true"><Sk className="h-9 w-2/3" /><Sk className="h-64 !rounded-3xl" /></div>;

  const { material: m, paket, siblings } = d;
  const n = siblings.findIndex((x) => x.id === m.id);
  const prev = n > 0 ? siblings[n - 1] : null;
  const next = n >= 0 && n < siblings.length - 1 ? siblings[n + 1] : null;

  return (
    <>
      <Link href="/dashboard" className="text-sm font-medium text-flame underline-offset-4 hover:underline">Kembali ke dashboard</Link>
      <p className="mt-3 text-sm text-ink/60">{paket}</p>
      <h1 className="text-3xl font-medium leading-tight tracking-tight">{m.title}</h1>

      <article className="card mt-5 max-w-3xl">
        {m.image_url && <img src={m.image_url} alt="" className="mb-4 max-h-96 max-w-full rounded-2xl border border-ink/20" />}
        {m.body && <div className="whitespace-pre-wrap leading-relaxed">{m.body}</div>}
        {m.link_url && (
          <a href={m.link_url} target="_blank" rel="noreferrer" className="btn mt-5">Buka berkas bacaan</a>
        )}
        {!m.body && !m.link_url && !m.image_url && <p className="text-sm text-ink/60">Isi bacaan belum ditambahkan.</p>}
      </article>

      {(prev || next) && (
        <div className="mt-4 grid max-w-3xl grid-cols-2 gap-2">
          {prev ? <Link href={`/bacaan/${prev.id}`} className="btn-o !justify-start text-left">Sebelumnya: {prev.title}</Link> : <span />}
          {next ? <Link href={`/bacaan/${next.id}`} className="btn !justify-end text-right">Berikutnya: {next.title}</Link> : <span />}
        </div>
      )}
    </>
  );
}
