import { Outfit } from 'next/font/google';
import './globals.css';
import DialogHost from '@/components/DialogHost';

const sans = Outfit({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });

export const metadata = { title: 'Tryout SKD', description: 'Latihan SKD CPNS online dengan pola ujian sebenarnya' };
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
