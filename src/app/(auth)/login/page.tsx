'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { SearchParamsProvider } from '@/components/common/SearchParamsProvider';
import { API_BASE_URL } from '@/config/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.isValid) {
        throw new Error(data.message || 'Login failed');
      }

      // Simpan data auth dengan format yang konsisten
      localStorage.setItem('auth', JSON.stringify({
        token: data.id,
        user: {
          id: data.user_id,
          name: data.name || data.email.split('@')[0],
          email: data.email
        }
      }));

      window.dispatchEvent(new Event('auth-changed'));
      router.push('/explore');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load Google API Script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // @ts-ignore - Google API types not available
      google.accounts.id.initialize({
        client_id: '394122359778-fjkqodqq7brmtakfipce8a8b3ib0kjcj.apps.googleusercontent.com',
        callback: async (response: any) => {
          try {
            setIsLoading(true);
            setError('');

            const result = await fetch(`${API_BASE_URL}/google-auth`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                idToken: response.credential
              })
            });

            const data = await result.json();

            if (!result.ok) {
              throw new Error(data.message || 'Login with Google failed');
            }

            // Ambil session pertama dari array response
            const session = Array.isArray(data) ? data[0] : data;

            // Decode Google credential untuk mendapatkan info user
            const payload = JSON.parse(atob(response.credential.split('.')[1]));

            // Simpan data auth dengan format yang konsisten
            localStorage.setItem('auth', JSON.stringify({
              token: session.id,
              user: {
                id: session.user_id,
                name: session.name || payload.name,
                email: session.email || payload.email
              }
            }));

            window.dispatchEvent(new Event('auth-changed'));
            router.push('/explore');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Login with Google failed');
          } finally {
            setIsLoading(false);
          }
        }
      });

      // @ts-ignore
      google.accounts.id.renderButton(
        document.getElementById('googleButton'),
        {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
          locale: 'id_ID',
        }
      );
    };

    return () => {
      document.head.removeChild(script);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* KIRI */}
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-20 h-10">
                <Image
                  src="/icons/logo-sdx.jpeg"
                  alt="SDX Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">
                Enterprise AI
              </h1>
            </Link>

            {/* KANAN */}
            <div className="relative w-20 h-10 md:w-40 md:h-10">
              <Image
                src="/icons/logo-pelni.jpeg"
                alt="PELNI Logo"
                fill
                className="object-contain scale-140"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Masuk ke Akun Anda</h2>
          </div>

          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#3f51b5] focus:border-[#3f51b5]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#3f51b5] focus:border-[#3f51b5]"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#3f51b5] hover:bg-[#3b1672] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3f51b5] disabled:opacity-50"
                >
                  {isLoading ? 'Memproses...' : 'Masuk'}
                </button>
                <div className="mt-4 text-center">
                  <Link href="/register" className="text-sm text-[#3f51b5] hover:text-[#3b1672]">
                    Atau daftar akun baru
                  </Link>
                </div>
              </div>

              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Atau masuk dengan</span>
                </div>
              </div>

              <div className="mt-6">
                <div id="googleButton"></div>
              </div>

              {/* Footer Links */}
              <div className="mt-8 text-center space-y-2">
                <div className="flex justify-center space-x-4 text-xs text-gray-500">
                  <Link href="/terms" className="hover:text-gray-700">
                    Kebijakan Penggunaan
                  </Link>
                  <span>•</span>
                  <Link href="/privacy" className="hover:text-gray-700">
                    Kebijakan Privacy
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 