// Pola SKD CPNS: 110 soal, 100 menit. Ambang batas bisa disesuaikan dengan aturan terbaru.
export const SKD = {
  durasi: 100,
  total: 110,
  kategori: {
    TWK: { nama: 'Tes Wawasan Kebangsaan', jumlah: 30, ambang: 65 },
    TIU: { nama: 'Tes Intelegensia Umum', jumlah: 35, ambang: 80 },
    TKP: { nama: 'Tes Karakteristik Pribadi', jumlah: 45, ambang: 166 },
  },
};

export const WA_ADMIN = process.env.NEXT_PUBLIC_WA_ADMIN;
export const rupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

const ORDER = { TWK: 0, TIU: 1, TKP: 2 };
export const sortQ = (qs) =>
  [...(qs || [])]
    .sort((a, b) => ORDER[a.category] - ORDER[b.category] || a.position - b.position)
    .map((q) => ({ ...q, options: [...(q.options || [])].sort((x, y) => x.label.localeCompare(y.label)) }));

// Sub-indikator resmi SKD, dipakai untuk analisis per topik.
export const TOPIK = {
  TWK: ['Nasionalisme', 'Integritas', 'Bela Negara', 'Pilar Negara', 'Bahasa Indonesia'],
  TIU: ['Verbal', 'Numerik', 'Figural'],
  TKP: ['Pelayanan Publik', 'Jejaring Kerja', 'Sosial Budaya', 'Teknologi Informasi dan Komunikasi', 'Profesionalisme', 'Anti Radikalisme'],
};

// Jenis paket. Nama tabel di database tetap "classes", di tampilan disebut "Paket".
export const PAKET = {
  tryout: { label: 'Paket Tryout', ringkas: 'Beberapa tryout SKD berwaktu' },
  campuran: { label: 'Latihan + Tryout', ringkas: 'Latihan per subtes dan tryout berwaktu' },
  topik: { label: 'Paket Topik', ringkas: 'Fokus pada satu subtes' },
  bacaan: { label: 'Paket Bacaan', ringkas: 'Materi bacaan untuk belajar' },
};
export const paketLabel = (p) =>
  p?.package_type === 'topik' && p.topic_subtes ? `Paket ${p.topic_subtes}` : PAKET[p?.package_type]?.label || 'Paket';

// Harga coret: diskon hanya berlaku jika harga normal lebih besar dari harga jual.
export const adaDiskon = (price, original) => Number(original) > Number(price);
export const hemat = (price, original) => (adaDiskon(price, original) ? Math.round((1 - Number(price) / Number(original)) * 100) : 0);

// Jumlah soal dari { TWK: n, TIU: n, TKP: n }. null = belum diketahui.
export const totalSoal = (counts) => (counts ? Object.values(counts).reduce((a, b) => a + b, 0) : null);
export const subtesAda = (counts) => Object.keys(SKD.kategori).filter((k) => !counts || counts[k] > 0);
