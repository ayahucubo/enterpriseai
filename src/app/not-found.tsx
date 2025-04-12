'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { Suspense } from 'react';
import Link from 'next/link';
import { SearchParamsProvider } from '@/components/common/SearchParamsProvider';

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsProvider>
        {(searchParams) => (
          <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-8">Halaman tidak ditemukan</p>
              <Link 
                href="/"
                className="inline-block bg-[#3f51b5] text-white px-6 py-3 rounded-lg hover:bg-[#3b1672] transition-colors"
              >
                Kembali ke Beranda
              </Link>
            </div>
          </div>
        )}
      </SearchParamsProvider>
    </Suspense>
  );
} 