import { rupiah, adaDiskon, hemat } from '@/lib/config';

// Harga jual, dengan harga normal dicoret dan label hemat jika ada diskon.
export default function Price({ price, original, size = 'lg' }) {
  const diskon = adaDiskon(price, original);
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
      {diskon && <s className="text-sm text-ink/55 decoration-flame decoration-[1.5px]">{rupiah(original)}</s>}
      <span className={size === 'lg' ? 'text-2xl font-semibold' : 'text-base font-semibold'}>
        {Number(price) > 0 ? rupiah(price) : 'Gratis'}
      </span>
      {diskon && (
        <span className="rounded-md border border-ink bg-flame px-1.5 py-0.5 text-xs font-semibold text-white">
          Hemat {hemat(price, original)}%
        </span>
      )}
    </div>
  );
}
