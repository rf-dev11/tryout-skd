'use client';
import { useParams } from 'next/navigation';
import Exam from '@/components/Exam';

export default function Page() {
  const { id } = useParams();
  return <Exam id={id} mode="tryout" />;
}
