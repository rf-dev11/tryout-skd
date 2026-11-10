'use client';

// Kerangka abu-abu selama data dimuat. Dipakai di dalam halaman, jadi menu samping tidak ikut berkedip.
export const Sk = ({ className = '' }) => (
  <div className={`animate-pulse rounded-2xl bg-ink/10 motion-reduce:animate-none ${className}`} />
);

export function PageSkeleton({ cards = 3 }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Memuat halaman">
      <Sk className="h-9 w-56" />
      <Sk className="h-4 w-72 max-w-full" />
      <div className="grid gap-4 pt-2 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => <Sk key={i} className="h-44 !rounded-3xl" />)}
      </div>
    </div>
  );
}

export function LoadError({ message, onRetry }) {
  return (
    <div className="card max-w-md">
      <p className="font-medium">Halaman belum bisa dimuat</p>
      <p className="mt-1 text-sm text-ink/70">{message || 'Terjadi kesalahan.'}</p>
      <button className="btn mt-4" onClick={onRetry}>Coba lagi</button>
    </div>
  );
}
