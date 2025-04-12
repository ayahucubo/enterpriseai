'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense } from 'react';
import Link from 'next/link';
import { SearchParamsProvider } from '@/components/common/SearchParamsProvider';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-xl font-semibold">
            Enterprise AI
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Kebijakan Privasi</h1>
        
        <div className="prose dark:prose-invert max-w-none text-sm">
          <p className="mb-6">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Informasi yang Kami Kumpulkan</h2>
            <p>
              Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami saat menggunakan layanan Enterprise AI.
              Informasi ini dapat mencakup:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Informasi akun (nama, email)</li>
              <li>Riwayat percakapan dengan AI</li>
              <li>Data penggunaan layanan</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Penggunaan Informasi</h2>
            <p>
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Menyediakan dan memelihara layanan</li>
              <li>Meningkatkan pengalaman pengguna</li>
              <li>Mengirim pembaruan dan informasi penting</li>
              <li>Mencegah penyalahgunaan layanan</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Perlindungan Data</h2>
            <p>
              Kami mengambil langkah-langkah keamanan yang sesuai untuk melindungi informasi Anda dari akses yang tidak sah
              atau pengungkapan yang tidak sah.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Berbagi Informasi</h2>
            <p>
              Kami tidak menjual atau menyewakan informasi pribadi Anda kepada pihak ketiga. Informasi hanya dibagikan dalam
              situasi berikut:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Dengan persetujuan Anda</li>
              <li>Untuk mematuhi kewajiban hukum</li>
              <li>Untuk melindungi hak dan keamanan</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Hak Privasi Anda</h2>
            <p>
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Mengakses data pribadi Anda</li>
              <li>Meminta koreksi data yang tidak akurat</li>
              <li>Meminta penghapusan data Anda</li>
              <li>Menolak pemrosesan data tertentu</li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
} 