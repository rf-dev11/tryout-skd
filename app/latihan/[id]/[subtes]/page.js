'use client';
import { useParams } from 'next/navigation';
import Exam from '@/components/Exam';
import { SKD } from '@/lib/config';

export default function Page() {
  const { id, subtes } = useParams();
  const k = String(subtes).toUpperCase();
  if (!SKD.kategori[k]) return <p className="p-8 text-sm">Subtes tidak dikenal.</p>;
  return <Exam id={id} mode="latihan" subtes={k} />;
}
