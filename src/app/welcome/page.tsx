'use client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useRef, useEffect, Suspense } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Link from 'next/link';
import { Send, User, Heart, Globe, Lightbulb, Mic, ArrowUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SearchParamsProvider } from '@/components/common/SearchParamsProvider';
import Image from 'next/image';
import { API_BASE_URL } from '@/config/api';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
}

interface Category {
  category_id: number;
  category_name: string;
  description: string;
  icon_url: string;
  hook: string;
  sequence: number;
}

const markdownComponents = {
  p: ({ children }: { children: React.ReactNode }) => <p className="mb-2 last:mb-0 text-sm">{children}</p>,
  strong: ({ children }: { children: React.ReactNode }) => <strong className="font-bold text-sm">{children}</strong>,
  em: ({ children }: { children: React.ReactNode }) => <em className="italic">{children}</em>,
  ul: ({ children }: { children: React.ReactNode }) => (
    <ul className="list-disc pl-6 space-y-2 my-4">
      {children}
    </ul>
  ),
  ol: ({ children }: { children: React.ReactNode }) => <ol className="list-decimal pl-6 mb-2">{children}</ol>,
  li: ({ children }: { children: React.ReactNode }) => (
    <li className="pl-2">
      {children}
    </li>
  ),
  code: ({ inline, className, children }: { inline?: boolean; className?: string; children: React.ReactNode }) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <SyntaxHighlighter
        style={dracula}
        language={match[1]}
        PreTag="div"
        className="rounded-md my-2"
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className="bg-gray-100 rounded px-1">
        {children}
      </code>
    );
  }
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showInitialDisclaimer, setShowInitialDisclaimer] = useState(true);
  const [chatId] = useState(() => uuidv4());
  const [categories, setCategories] = useState<Category[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/welcome/tabs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: '',
            sessionId: ''
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }

        const data = await response.json();
        setCategories(data.sort((a: Category, b: Category) => a.sequence - b.sequence));
      } catch (error) {
        console.error('Error loading initial data:', error);
        setCategories([]);
      }
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setShowInitialDisclaimer(false);
    }
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage = {
      id: uuidv4(),
      content: text.trim(),
      role: 'user' as const
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          chatId: chatId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const assistantMessage = {
        id: uuidv4(),
        content: data[0].output,
        role: 'assistant' as const
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      await handleSendMessage(input);
    }
  };

  const handleCategoryClick = async (category: Category) => {
    const message = `Saya tertarik dengan kategori ${category.category_name}. ${category.hook}`;
    await handleSendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim()) {
        handleSendMessage(input);
      }
    }
  };

  const ChatMessage = ({ content, role }: Message) => (
    <div
      className={`flex items-start mb-6 ${role === 'user' ? 'justify-end' : 'w-full px-4'
        }`}
    >
      <div
        className={`${role === 'user'
          ? 'max-w-[80%] bg-[#f9f6fe]'
          : 'w-full bg-white'
          } rounded-2xl p-4 text-gray-900`}
      >
        <ReactMarkdown components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchParamsProvider>
        {(searchParams) => (
          <div className="flex flex-col min-h-screen bg-white">
            <header className="border-b border-gray-200">
              <div className="grid grid-cols-3 items-center h-16 px-4">

                {/* KIRI */}
                <Link href="/" className="flex items-center gap-2">
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

                {/* TENGAH */}
                <div className="flex justify-center">
                  <div className="relative w-40 h-10">
                    <Image
                      src="/icons/logo-pelni.jpeg"
                      alt="PELNI Logo"
                      fill
                      className="object-contain scale-140"
                    />
                  </div>
                </div>

                {/* KANAN */}
                <div className="flex justify-end items-center gap-4">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/register"
                    className="hidden md:block px-4 py-2 text-sm font-medium text-white bg-[#3f51b5] hover:bg-[#3b1672] rounded-lg"
                  >
                    Daftar
                  </Link>
                </div>

              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full p-4 relative">
              <div className="text-center mb-8">
                <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4">Apa yang bisa saya bantu?</h1>
                <p className="text-[14px] text-gray-600 max-w-2xl mx-auto leading-relaxed">
                  💡 Aku Asisten AI perusahaan kamu.<br />
                  👉 Ketik pesan di chat untuk tanya fiture atau <Link href="/login" className="text-[#3f51b5] font-medium hover:underline">Login/Daftar untuk mulai mencoba.</Link>
                </p>
              </div>

              {/* Category Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {categories.map((category) => (
                  <div
                    key={category.category_id}
                    onClick={() => handleCategoryClick(category)}
                    className="p-6 rounded-lg border border-gray-200 hover:border-[#3f51b5] transition-colors duration-200 cursor-pointer bg-white"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <Image
                          src={category.icon_url.startsWith('http') ? category.icon_url : `/images/${category.icon_url}`}
                          alt={category.category_name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2 text-gray-900">{category.category_name}</h3>
                        <p className="text-sm text-gray-600">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto mb-24">
                {messages.map((message) => (
                  <ChatMessage key={message.id} {...message} />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900">
                <div className="max-w-5xl mx-auto px-4">
                  <form
                    onSubmit={handleSubmit}
                    className="flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-lg overflow-hidden mb-1 mt-4"
                  >
                    <div className="flex items-center gap-2 p-2">
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                      >
                        <User className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </button>

                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan..."
                        className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-[14px] text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      />
                    </div>

                    <div className="flex items-center gap-2 px-2 pb-2">
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-not-allowed rounded-full"
                      >
                        <Globe size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>Search</span>
                      </button>

                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-not-allowed rounded-full"
                      >
                        <Lightbulb size={16} className="text-gray-400 dark:text-gray-500" />
                        <span>Reason</span>
                      </button>

                      <div className="flex-1"></div>

                      <button
                        type="button"
                        disabled
                        className="p-2 text-gray-400 dark:text-gray-500 cursor-not-allowed rounded-full"
                      >
                        <Mic size={16} className="text-gray-400 dark:text-gray-500" />
                      </button>

                      <button
                        type="submit"
                        disabled={!input.trim()}
                        className="p-2 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 rounded-full"
                      >
                        <ArrowUp size={16} className="text-white dark:text-black" />
                      </button>
                    </div>
                  </form>

                  <p className="text-xs text-gray-500 text-center mt-2 pb-4 md:pb-4 pb-[calc(1rem+env(safe-area-inset-bottom,16px))]">
                    {showInitialDisclaimer ? (
                      <span>
                        Dengan mengirim pesan ke Enterprise AI, Anda menyetujui{' '}
                        <Link href="/terms" className="text-[#3f51b5] hover:underline font-bold">
                          Ketentuan Layanan
                        </Link>{' '}
                        & telah membaca{' '}
                        <Link href="/privacy" className="text-[#3f51b5] hover:underline font-bold">
                          Kebijakan Privasi
                        </Link>{' '}
                        kami.
                      </span>
                    ) : (
                      <>
                        Enterprise AI bisa salah. Periksa info penting. <a href="https://trakteer.id/kamunaku" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Dukung kami</a>.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </main>
          </div>
        )}
      </SearchParamsProvider>
    </Suspense>
  );
}
