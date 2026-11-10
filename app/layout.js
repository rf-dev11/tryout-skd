import { Outfit } from 'next/font/google';
import './globals.css';
import DialogHost from '@/components/DialogHost';

const sans = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata = {
  title: 'Tryout SKD, latihan CPNS dengan pola ujian sebenarnya',
  description: 'Tryout SKD CPNS online: 110 soal dalam 100 menit, pembahasan di setiap soal, analisis per topik, dan ranking per instansi.',
};
export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#f8f7f4' };

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={sans.variable}>
      <body className="bg-paper text-ink antialiased">
        {children}
        <DialogHost />
      </body>
    </html>
  );
}
