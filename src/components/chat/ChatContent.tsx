'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Message } from '@/lib/api/chat';
import { useChat } from '@/contexts/ChatContext';
import { checkAuth } from '@/lib/auth';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { Menu, Plus, Globe, Lightbulb, MoreHorizontal, ArrowUp, User, Mic } from 'lucide-react';
import clsx from 'clsx';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';
import { API_BASE_URL } from '@/config/api';

interface ChatContentProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// Komponen untuk menangani params
function ChatParamsHandler() {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const agentId = searchParams.get('agent');
  return null;
}

export function ChatContent({ isSidebarOpen, onToggleSidebar }: ChatContentProps) {
  const router = useRouter();
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { 
    messages,
    selectedAgent,
    activeChatTitle,
    selectedChat,
    setSelectedChat,
    loadChatDetail,
    setActiveChatTitle,
    findChat,
    chats,
    setChats,
    setSelectedAgent,
    setMessages: setMessagesContext,
    chatId,
    agentId,
    webhookUrl,
    setWebhookUrl
  } = useChat();

  // Local state for messages
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Update local messages when context messages change
  useEffect(() => {
    setLocalMessages(messages);
  }, [messages]);

  // Effect untuk load chat detail ketika chatId berubah
  useEffect(() => {
    if (!chatId) {
      // Jika tidak ada chatId (berarti di halaman agent), 
      // dan ada agent yang dipilih, gunakan nama agent sebagai judul
      if (selectedAgent) {
        setActiveChatTitle(selectedAgent.name);
      }
      setIsLoading(false);
      return;
    }
    if (selectedChat === chatId) {
      setIsLoading(false);
      return;
    } // Prevent loop if chat is already selected

    const fetchChatDetail = async () => {
      try {
        const authData = checkAuth();
        if (!authData) return;

        setIsLoading(true);
        await loadChatDetail(authData.user.id, chatId);
        setSelectedChat(chatId);

        // Set chat title dari chat history
        const chat = findChat(chatId, chats);
        if (chat) {
          setActiveChatTitle(chat.title);
        }
      } catch (error) {
        console.error('Error loading chat detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChatDetail();
  }, [chatId, loadChatDetail, selectedChat, setSelectedChat, selectedAgent, setActiveChatTitle, findChat, chats]);

  // Effect untuk load agent detail ketika agentId berubah
  useEffect(() => {
    if (!agentId) return;
    
    const loadAgentDetail = async () => {
      try {
        const authData = checkAuth();
        if (!authData) return;

        setIsLoading(true);

        const response = await fetch(`${API_BASE_URL}/agents/detail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: authData.user.id,
            agentId: agentId,
            sessionId: authData.token
          })
        });

        if (!response.ok) {
          throw new Error('Agent not found');
        }

        const [agentDetail] = await response.json();
        if (!agentDetail) {
          throw new Error('Agent not found');
        }

        const newAgent = {
          id: agentDetail.id,
          name: agentDetail.name,
          description: agentDetail.description,
          provider: agentDetail.provider,
          rating: agentDetail.rating,
          category: agentDetail.category,
          conversation_count: agentDetail.conversation_count,
          conversation_starters: agentDetail.conversation_starters,
          icon_url: agentDetail.icon_url,
          webhook_url: agentDetail.webhook_url
        };

        setSelectedAgent(newAgent);
        setActiveChatTitle(agentDetail.name);
        setSelectedChat(null);
        setMessagesContext([]);
        
        // Set webhook URL dari agent detail
        if (agentDetail.webhook_url) {
          setWebhookUrl(agentDetail.webhook_url);
        }

      } catch (error) {
        console.error('Error loading agent detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentDetail();
  }, [agentId, setSelectedAgent, setActiveChatTitle, setSelectedChat, setMessagesContext, setWebhookUrl]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localMessages]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend?.trim() || isSending) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: textToSend.trim(),
      role: 'human',
      timestamp: new Date().toISOString()
    };

    setLocalMessages((prev: Message[]) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const authData = checkAuth();
      if (!authData) return;

      // Gunakan chatId yang ada atau selectedChat yang sudah ada
      const currentChatId = chatId || selectedChat;
      
      if (!webhookUrl) {
        throw new Error('No webhook URL available');
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: authData.user.id,
          chatId: currentChatId,
          message: userMessage.content,
          ...(selectedAgent && {
            agentId: selectedAgent.id,
            agentName: selectedAgent.name
          }),
          isAction: true,
          timestamp: new Date().toISOString(),
          sessionId: authData.token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: uuidv4(),
        content: data[0].output,
        role: 'ai',
        timestamp: new Date().toISOString(),
        webhook_url: webhookUrl
      };

      setLocalMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleConversationStarterClick = async (starter: string) => {
    if (!selectedAgent) return;

    const userMessage: Message = {
      id: uuidv4(),
      content: starter,
      role: 'human',
      timestamp: new Date().toISOString()
    };

    setLocalMessages((prev: Message[]) => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const authData = checkAuth();
      if (!authData) return;

      // 1. Buat chat baru
      const newChatResponse = await fetch(`${API_BASE_URL}/chat/newid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: authData.user.id,
          agentId: selectedAgent.id,
          chatName: selectedAgent.name,
          agentName: selectedAgent.name,
          sessionId: authData.token
        })
      });

      if (!newChatResponse.ok) {
        throw new Error('Failed to create new chat');
      }

      const newChat = await newChatResponse.json();
      
      // Update URL dengan chatId baru
      router.replace(`/chat?chatId=${newChat.chatId}`, { scroll: false });
      setSelectedChat(newChat.chatId);

      // 2. Kirim pesan menggunakan webhook_url dari agent
      const response = await fetch(selectedAgent.webhook_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: authData.user.id,
          chatId: newChat.chatId,
          message: userMessage.content,
          agentId: selectedAgent.id,
          agentName: selectedAgent.name,
          isAction: true,
          timestamp: new Date().toISOString(),
          sessionId: authData.token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      const assistantMessage: Message = {
        id: uuidv4(),
        content: data[0].output,
        role: 'ai',
        timestamp: new Date().toISOString(),
        webhook_url: selectedAgent.webhook_url
      };

      setLocalMessages(prev => [...prev, assistantMessage]);

      // 3. Refresh history sidebar hanya saat membuat chat baru
      const historyResponse = await fetch(`${API_BASE_URL}/chat/history-sidebar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: authData.user.id,
          sessionId: authData.token
        })
      });

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        // Update chats di context
        setChats(historyData[0]);
        // Trigger event untuk refresh sidebar hanya saat chat baru dibuat
        window.dispatchEvent(new Event('chat-updated'));
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex-1 flex flex-col h-screen overflow-hidden transition-all duration-200 ease-in-out', {
      'ml-64': isSidebarOpen,
      'ml-0': !isSidebarOpen
    })}>
      <Suspense fallback={null}>
        <ChatParamsHandler />
      </Suspense>
      {/* Header */}
      <div className="flex-none bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4 px-4 py-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <Menu size={20} className="text-gray-500" />
          </button>
          <h2 className="font-semibold text-gray-900 dark:text-white">
            {activeChatTitle || 'Chat'}
          </h2>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4">
          {localMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              {selectedAgent && (
                <>
                  {selectedAgent.icon_url ? (
                    <Image
                      src={selectedAgent.icon_url.startsWith('http') ? selectedAgent.icon_url : `/images/${selectedAgent.icon_url}`}
                      alt={selectedAgent.name}
                      width={64}
                      height={64}
                      className="rounded-full mb-4 bg-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full mb-4 bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl font-semibold text-gray-400">
                        {selectedAgent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                    {selectedAgent.name}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-2">
                    By {selectedAgent.provider}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-6">
                    <div className="flex items-center gap-1">
                      <span className="font-semibold">{selectedAgent.rating}</span>
                      <span className="text-yellow-500">★</span>
                    </div>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <span>#{1} in {selectedAgent.category}</span>
                    <span className="text-gray-300 dark:text-gray-700">|</span>
                    <span>{(selectedAgent.conversation_count / 1000000).toFixed(0)}M+ Conversations</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-8">
                    {selectedAgent.description}
                  </p>
                </>
              )}

              {selectedAgent?.conversation_starters && (
                <div className="w-full max-w-xl">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                    Conversation Starters
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedAgent.conversation_starters.map((starter, index) => (
                      <button
                        key={index}
                        onClick={() => handleConversationStarterClick(starter)}
                        className="text-left p-4 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-[20px] text-sm text-gray-600 dark:text-gray-400 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.08)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.12)]"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {localMessages.map((message) => (
                <div
                  key={message.id}
                  className={clsx(
                    'flex items-start mb-6',
                    message.role === 'human' ? 'justify-end' : 'w-full'
                  )}
                >
                  <ChatMessage message={message} />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}

          {isSending && (
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-500 dark:border-gray-400 border-t-transparent"></div>
              <span>Mengirim...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Chat Input */}
      <div className="flex-none bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto px-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputMessage.trim()) {
                handleSendMessage();
              }
            }}
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
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 px-4 py-2 bg-transparent focus:outline-none text-[14px] text-gray-700 dark:text-gray-300 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                disabled={isLoading}
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
                disabled={!inputMessage.trim() || isLoading}
                className="p-2 bg-black dark:bg-white hover:bg-gray-900 dark:hover:bg-gray-100 rounded-full"
              >
                <ArrowUp size={16} className="text-white dark:text-black" />
              </button>
            </div>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pb-4 md:pb-4 pb-[calc(1rem+env(safe-area-inset-bottom,16px))]">
            Enterprise AI bisa salah. Periksa info penting. Support kami <a href="https://trakteer.id/kamunaku" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">di sini</a>.
          </p>
        </div>
      </div>
    </div>
  );
} 