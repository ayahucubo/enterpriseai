'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense } from 'react';
import Link from 'next/link';
import { SearchParamsProvider } from '@/components/common/SearchParamsProvider';

export default function Terms() {
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
        <h1 className="text-2xl font-bold mb-8">Ketentuan Layanan</h1>
        
        <div className="prose dark:prose-invert max-w-none text-sm">
          <p className="mb-6">
            Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mengakses dan menggunakan layanan Enterprise AI, Anda menyetujui untuk terikat oleh ketentuan layanan ini. 
              Jika Anda tidak setuju dengan bagian apapun dari ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Penggunaan Layanan</h2>
            <p>
              Anda setuju untuk menggunakan layanan ini hanya untuk tujuan yang sah dan sesuai dengan semua hukum dan peraturan yang berlaku. 
              Anda tidak diperkenankan menggunakan layanan ini untuk:
            </p>
            <ul className="list-disc pl-6 mt-4">
              <li>Melakukan tindakan ilegal atau mendorong aktivitas ilegal</li>
              <li>Menyebarkan informasi yang salah atau menyesatkan</li>
              <li>Mengirim spam atau pesan yang tidak diinginkan</li>
              <li>Mengumpulkan informasi pribadi pengguna lain tanpa izin</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. Batasan Tanggung Jawab</h2>
            <p>
              Enterprise AI menyediakan layanan "sebagaimana adanya" tanpa jaminan apapun. 
              Kami tidak bertanggung jawab atas kerugian yang mungkin timbul dari penggunaan layanan kami.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. Perubahan Layanan</h2>
            <p>
              Kami berhak untuk memodifikasi atau menghentikan layanan kami, baik sementara maupun permanen, 
              dengan atau tanpa pemberitahuan sebelumnya.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Hak Kekayaan Intelektual</h2>
            <p>
              Semua konten yang dihasilkan oleh Enterprise AI tetap menjadi hak milik kami. 
              Anda diberikan lisensi terbatas untuk menggunakan konten tersebut sesuai dengan ketentuan layanan ini.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
} 