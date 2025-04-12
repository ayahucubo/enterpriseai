'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, Search, Plus, User, ChevronDown, LogOut, Settings, Crown, MessageSquare, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { getRecentAgents } from '@/lib/api/explore';
import { renameChat, deleteChat } from '@/lib/api/chat';
import type { Agent, ChatHistory } from '@/lib/api/explore';
import { useSidebar } from '@/contexts/SidebarContext';
import { useChat } from '@/contexts/ChatContext';
import clsx from 'clsx';
import { checkAuth } from '@/lib/auth';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface ChatItemProps {
  chat: {
    chat_id: string;
    title: string;
  };
  isActive: boolean;
  onSelect: (chat: { chat_id: string; title: string }) => void;
}

// Komponen untuk menangani params
function SidebarParamsHandler({ onParamsChange }: { onParamsChange: (chatId: string | null, agentId: string | null) => void }) {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const agentId = searchParams.get('agent');
  
  useEffect(() => {
    onParamsChange(chatId, agentId);
  }, [chatId, agentId, onParamsChange]);
  
  return null;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { recentAgents, chatHistory, loadChatHistory } = useSidebar();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState<string>('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);
  const { handleRenameChat } = useChat();

  // Tambahkan useEffect untuk mengatur username saat komponen dimuat
  useEffect(() => {
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

  const handleParamsChange = useCallback((chatId: string | null, agentId: string | null) => {
    setActiveChatId(chatId);
  }, []);

  useEffect(() => {
    // Listen for chat-updated event untuk refresh chat history
    const handleChatUpdate = () => {
      loadChatHistory();
    };
    
    // Listen for auth-changed event untuk refresh data
    const handleAuthChange = () => {
      // Get username from localStorage
      try {
        const auth = localStorage.getItem('auth');
        if (auth) {
          const authData = JSON.parse(auth);
          if (authData?.user?.name) {
            setUsername(authData.user.name);
          }
        } else {
          setUsername('');
        }
      } catch (error) {
        console.error('Error getting username:', error);
        setUsername('');
      }
      
      // Refresh chat history
      loadChatHistory();
    };
    
    window.addEventListener('chat-updated', handleChatUpdate);
    window.addEventListener('auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('chat-updated', handleChatUpdate);
      window.removeEventListener('auth-changed', handleAuthChange);
    };
  }, [loadChatHistory]); // Tambahkan loadChatHistory sebagai dependency

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
      // Hapus data auth
      localStorage.removeItem('auth');
      // Hapus cookie Google
      document.cookie = 'g_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Trigger event untuk membersihkan data chat
      window.dispatchEvent(new Event('chat-updated'));
      // Tunggu sebentar untuk memastikan event diproses
      await new Promise(resolve => setTimeout(resolve, 100));
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/login');
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const auth = localStorage.getItem('auth');
      if (!auth) return;

      const authData = JSON.parse(auth);
      await deleteChat(authData.user.id, chatId);
      
      if (activeChatId === chatId) {
        router.push('/chat');
      }

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

  const handleChatSelect = (chat: { chat_id: string; title: string }) => {
    if (window.innerWidth < 768) {
      onToggle();
      setTimeout(() => {
        router.replace(`/chat?chatId=${chat.chat_id}`, { scroll: false });
      }, 50);
    } else {
      router.replace(`/chat?chatId=${chat.chat_id}`, { scroll: false });
    }
  };

  const handleAgentClick = (agent: Agent) => {
    if (window.innerWidth < 768) {
      onToggle();
      setTimeout(() => {
        router.push(`/chat?agent=${agent.id}`);
      }, 50);
    } else {
      router.push(`/chat?agent=${agent.id}`);
    }
  };

  const ChatItem = ({ chat, isActive, onSelect }: ChatItemProps) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState('');

    const handleRename = async () => {
      if (!newTitle.trim()) return;
      try {
        await handleRenameChat(chat.chat_id, newTitle);
        setIsRenaming(false);
        setNewTitle('');
        setShowDropdown(false);
        window.dispatchEvent(new Event('chat-updated'));
      } catch (error) {
        console.error('Error renaming chat:', error);
      }
    };

    const handleDelete = async () => {
      try {
        await handleDeleteChat(chat.chat_id);
        setShowDropdown(false);
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    };

    return (
      <div className="relative group">
        <div 
          className={clsx(
            "flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800",
            isActive && "bg-gray-100 dark:bg-gray-800"
          )}
          onClick={(e) => {
            // Jika tidak sedang klik tombol more options
            if (!(e.target as HTMLElement).closest('button')) {
              onSelect(chat);
            }
          }}
        >
          <div className="flex-1 mr-2">
            {isRenaming ? (
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename();
                  } else if (e.key === 'Escape') {
                    setIsRenaming(false);
                    setNewTitle('');
                  }
                }}
                onBlur={() => {
                  setIsRenaming(false);
                  setNewTitle('');
                }}
                className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded focus:outline-none focus:border-blue-500"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="text-sm text-gray-700 dark:text-gray-300 break-words">
                {chat.title}
              </span>
            )}
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showDropdown && (
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="py-1">
              <button
                key="rename-button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                  setNewTitle(chat.title);
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="flex items-center gap-2">
                  <Edit2 size={16} />
                  Rename
                </span>
              </button>
              <button
                key="delete-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="flex items-center gap-2">
                  <Trash2 size={16} />
                  Delete
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <Suspense fallback={null}>
        <SidebarParamsHandler onParamsChange={handleParamsChange} />
      </Suspense>

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
              <Crown size={20} className="text-gray-500" />
              <span>Explore Agent</span>
            </Link>
          </nav>

          {/* Agents */}
          <div className="px-4 pb-4">
            <h2 className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
              AGENTS
            </h2>
            <div className="mt-2 space-y-1">
              {recentAgents && recentAgents.length > 0 && recentAgents.some(agent => agent.id) && (
                recentAgents
                  .filter(agent => agent.id) // Filter hanya agent yang memiliki id
                  .map((agent) => (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentClick(agent)}
                      className="w-full flex items-center gap-3 px-2 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={agent.icon_url.startsWith('http') ? agent.icon_url : `/images/${agent.icon_url}`}
                          alt={agent.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="truncate">{agent.name}</span>
                    </button>
                  ))
              )}
            </div>
          </div>

          {/* RIWAYAT CHAT */}
          <div className="px-4 pb-4">
            <h2 className="px-2 py-2 text-xs font-semibold text-gray-400 dark:text-gray-500 break-words">
              RIWAYAT CHAT
            </h2>
            <div className="mt-2 space-y-1">
              {/* Today */}
              {chatHistory?.today?.length > 0 && (
                <div key="today" className="mb-4">
                  <h4 className="px-2 text-xs text-gray-500 dark:text-gray-400 mb-1">Hari Ini</h4>
                  {chatHistory.today.map(chat => (
                    <ChatItem 
                      key={chat.chat_id} 
                      chat={{ chat_id: chat.chat_id.toString(), title: chat.title }}
                      isActive={activeChatId === chat.chat_id.toString()} 
                      onSelect={handleChatSelect} 
                    />
                  ))}
                </div>
              )}

              {/* Previous 7 days */}
              {chatHistory?.previous_7_days?.length > 0 && (
                <div key="previous-7-days" className="mb-4">
                  <h4 className="px-2 text-xs text-gray-500 dark:text-gray-400 mb-1">7 Hari Terakhir</h4>
                  {chatHistory.previous_7_days.map(chat => (
                    <ChatItem 
                      key={chat.chat_id} 
                      chat={{ chat_id: chat.chat_id.toString(), title: chat.title }}
                      isActive={activeChatId === chat.chat_id.toString()} 
                      onSelect={handleChatSelect} 
                    />
                  ))}
                </div>
              )}

              {/* Previous 30 days */}
              {chatHistory?.previous_30_days?.length > 0 && (
                <div key="previous-30-days">
                  <h4 className="px-2 text-xs text-gray-500 dark:text-gray-400 mb-1">30 Hari Terakhir</h4>
                  {chatHistory.previous_30_days.map(chat => (
                    <ChatItem 
                      key={chat.chat_id} 
                      chat={{ chat_id: chat.chat_id.toString(), title: chat.title }}
                      isActive={activeChatId === chat.chat_id.toString()} 
                      onSelect={handleChatSelect} 
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* User profile - always at bottom */}
        <div className="mt-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,16px))] bg-[hsl(262,80%,98%)] dark:bg-[hsl(262,80%,10%)]">
          <div ref={profileMenuRef} className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[hsl(262,80%,95%)] dark:hover:bg-[hsl(262,80%,15%)] rounded-lg"
            >
              <div className="w-8 h-8 rounded-full bg-[#3f51b5] flex items-center justify-center text-white">
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