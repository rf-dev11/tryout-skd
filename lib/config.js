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
