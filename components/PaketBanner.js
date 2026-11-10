import { paketLabel } from '@/lib/config';

// Banner paket 16:9. Jika admin belum mengunggah banner, tampil blok bergaris dengan nama jenis paket
// supaya tinggi semua kartu tetap sama.
export default function PaketBanner({ p, tone }) {
  if (p.banner_url) {
    return <img src={p.banner_url} alt={`Banner ${p.title}`} loading="lazy" className="aspect-[16/9] w-full border-b border-ink object-cover" />;
  }
  return (
    <div className={`flex aspect-[16/9] w-full items-end border-b border-ink bg-[repeating-linear-gradient(45deg,rgba(28,28,28,.07)_0_10px,transparent_10px_20px)] p-4 ${tone.bg}`}>
      <span className="text-2xl font-semibold leading-tight tracking-tight">{paketLabel(p)}</span>
    </div>
  );
}
