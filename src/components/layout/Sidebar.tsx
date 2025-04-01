'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Menu, Search, Plus, User, ChevronDown, LogOut, Settings, Crown, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { getRecentAgents } from '@/lib/api/explore';
import { getChatHistory as getChatHistoryApi, renameChat, deleteChat } from '@/lib/api/chat';
import { getChatHistory as getChatHistorySidebar } from '@/lib/api/explore';
import type { Agent, ChatHistory } from '@/lib/api/explore';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeChatId = searchParams.get('chatId');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistory>({
    today: [],
    previous_7_days: [],
    previous_30_days: []
  });
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState<string>('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [agents, history] = await Promise.all([
          getRecentAgents(),
          getChatHistorySidebar()
        ]);
        setRecentAgents(agents);
        setChatHistory(history);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    // Get username from localStorage
    try {
      const auth = localStorage.getItem('auth');
      if (auth) {
        const authData = JSON.parse(auth);
        if (authData?.user?.name) {
          setUsername(authData.user.name);
        }
      }
    } catch (error) {
      console.error('Error getting username:', error);
    }
  }, []);

  useEffect(() => {
    // Handle click outside to close profile menu
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      // Hapus token dari localStorage
      localStorage.removeItem('auth');

      // Hapus cookie Google jika ada
      document.cookie = 'g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      // Tunggu sebentar sebelum redirect untuk memastikan cleanup selesai
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect ke halaman login
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      // Tetap redirect ke login jika terjadi error
      router.push('/login');
    }
  };

  const loadChatHistory = async () => {
    try {
      const history = await getChatHistorySidebar();
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newName: string) => {
    try {
      await renameChat(chatId, newName);
      await loadChatHistory();
      setEditingChatId(null);
      setNewChatName('');
      window.dispatchEvent(new Event('chat-updated'));
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const auth = localStorage.getItem('auth');
      if (!auth) return;

      const authData = JSON.parse(auth);
      await deleteChat(authData.user.id, chatId);
      
      // Load fresh data
      const [agents, history] = await Promise.all([
        getRecentAgents(),
        getChatHistorySidebar()
      ]);
      setRecentAgents(agents);
      setChatHistory(history);
      
      // If the deleted chat was active, redirect to home
      if (activeChatId === chatId) {
        router.push('/chat');
      }

      // Trigger chat-updated event for other components
      window.dispatchEvent(new Event('chat-updated'));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Focus input when editing starts
  useEffect(() => {
    if (editingChatId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingChatId]);

  const renderChatButton = (chat: any) => (
    <div key={chat.chat_id} className="relative group">
      <div
        onClick={() => router.push(`/chat?chatId=${chat.chat_id}`, { scroll: false })}
        className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg cursor-pointer ${
          activeChatId === chat.chat_id.toString() ? 'bg-[hsl(262,80%,95%)] dark:bg-[hsl(262,80%,15%)]' : ''
        }`}
      >
        <MessageSquare size={16} />
        {editingChatId === chat.chat_id.toString() ? (
          <form 
            className="flex-1"
            onSubmit={(e) => {
              e.preventDefault();
              handleRenameChat(chat.chat_id.toString(), newChatName);
            }}
          >
            <input
              ref={editInputRef}
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 text-sm rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[hsl(262,80%,75%)]"
              onBlur={() => {
                if (newChatName.trim()) {
                  handleRenameChat(chat.chat_id.toString(), newChatName);
                } else {
                  setEditingChatId(null);
                  setNewChatName('');
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setEditingChatId(null);
                  setNewChatName('');
                }
              }}
            />
          </form>
        ) : (
          <>
            <span className="truncate flex-1">{chat.title}</span>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingChatId(chat.chat_id.toString());
                  setNewChatName(chat.title);
                }}
                className="p-1 hover:bg-[hsl(262,80%,90%)] dark:hover:bg-[hsl(262,80%,20%)] rounded"
              >
                <Edit2 size={14} className="text-gray-500" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Apakah Anda yakin ingin menghapus chat ini?')) {
                    handleDeleteChat(chat.chat_id.toString());
                  }
                }}
                className="p-1 hover:bg-[hsl(262,80%,90%)] dark:hover:bg-[hsl(262,80%,20%)] rounded"
              >
                <Trash2 size={14} className="text-red-500" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay untuk mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-[hsl(262,80%,98%)] dark:bg-[hsl(262,80%,10%)] transform transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Search and New Chat */}
        <div className="p-4">
          <div className="relative flex items-center">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-[hsl(262,80%,75%)]"
            />
            <button
              onClick={() => router.push('/chat')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg"
            >
              <Plus size={16} className="text-[hsl(262,80%,75%)]" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Menu */}
          <nav className="px-4 pb-4">
            <Link
              href="/explore"
              className="flex items-center gap-3 px-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg"
            >
              <Crown size={16} />
              Explore Agent
            </Link>
          </nav>

          {/* Agents */}
          <div className="px-4 pb-4">
            <h2 className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
              AGENTS
            </h2>
            <div className="mt-2 space-y-1">
              {recentAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => router.push(`/chat?agent=${agent.id}`, { scroll: false })}
                  className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg"
                >
                  <img src={agent.icon_url} alt={agent.name} className="w-6 h-6 rounded-full" />
                  <span className="text-left">{agent.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* RIWAYAT CHAT */}
          <div className="px-4 pb-4">
            <h2 className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
              RIWAYAT CHAT
            </h2>
            <div className="mt-2 space-y-1">
              {/* Today */}
              {chatHistory.today.length > 0 && (
                <div className="mb-4">
                  <h4 className="px-2 text-xs text-gray-500 dark:text-gray-400 mb-1">Hari Ini</h4>
                  {chatHistory.today.map(renderChatButton)}
                </div>
              )}

              {/* Previous 7 days */}
              {chatHistory.previous_7_days.length > 0 && (
                <div className="mb-4">
                  <h4 className="px-2 text-xs text-gray-500 dark:text-gray-400 mb-1">7 Hari Terakhir</h4>
                  {chatHistory.previous_7_days.map(renderChatButton)}
                </div>
              )}

              {/* Previous 30 days */}
              {chatHistory.previous_30_days.length > 0 && (
                <div>
                  <h4 className="px-2 text-xs text-gray-500 dark:text-gray-400 mb-1">30 Hari Terakhir</h4>
                  {chatHistory.previous_30_days.map(renderChatButton)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User profile - always at bottom */}
        <div className="mt-auto p-4 bg-[hsl(262,80%,98%)] dark:bg-[hsl(262,80%,10%)]">
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-[hsl(262,80%,75%)] flex items-center justify-center text-white">
                {username ? username[0].toUpperCase() : 'U'}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{username || 'User'}</div>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transform transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
            </button>

            {showProfileMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-white dark:bg-gray-900 border border-[hsl(262,80%,90%)] dark:border-[hsl(262,80%,20%)] rounded-lg shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg"
                >
                  <LogOut size={16} />
                  <span>Keluar</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
} 