'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, Suspense } from 'react';
import type { Message } from '@/lib/api/chat';
import type { ChatHistory, ChatItem, ExtendedAgent } from '@/lib/api/explore';
import { useSidebar } from '@/contexts/SidebarContext';
import { API_BASE_URL } from '@/config/api';
import { useSearchParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

interface ChatContextType {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  chats: ChatHistory;
  setChats: (chats: ChatHistory) => void;
  activeChatTitle: string;
  setActiveChatTitle: (title: string) => void;
  loadChatDetail: (userId: string, chatId: string) => Promise<void>;
  isDataFetched: boolean;
  setIsDataFetched: (value: boolean) => void;
  isAgentsFetched: boolean;
  setIsAgentsFetched: (value: boolean) => void;
  findChat: (chatId: string | null, chats: ChatHistory) => ChatItem | null;
  handleRenameChat: (chatId: string, newTitle: string) => Promise<void>;
  selectedAgent: ExtendedAgent | null;
  setSelectedAgent: (agent: ExtendedAgent | null) => void;
  selectedChat: string | null;
  setSelectedChat: (chatId: string | null) => void;
  chatId: string | null;
  agentId: string | null;
  webhookUrl: string | null;
  setWebhookUrl: (url: string | null) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Komponen untuk menangani params
function ChatParamsHandler({ onParamsReady }: { onParamsReady: (chatId: string | null, agentId: string | null) => void }) {
  const searchParams = useSearchParams();
  const chatId = searchParams.get('chatId');
  const agentId = searchParams.get('agent');

  useEffect(() => {
    onParamsReady(chatId, agentId);
  }, [chatId, agentId, onParamsReady]);

  return null;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatHistory>({
    today: [],
    previous_7_days: [],
    previous_30_days: []
  });
  const [activeChatTitle, setActiveChatTitle] = useState('');
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [isAgentsFetched, setIsAgentsFetched] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ExtendedAgent | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const { chatHistory } = useSidebar();
  const [chatId, setChatId] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);

  // Update chats whenever chatHistory changes
  useEffect(() => {
    setChats(chatHistory);
  }, [chatHistory]);

  // Listen for chat-updated event
  useEffect(() => {
    const handleChatUpdate = () => {
      // Reset semua state chat
      setMessages([]);
      setChats({
        today: [],
        previous_7_days: [],
        previous_30_days: []
      });
      setActiveChatTitle('');
      setSelectedAgent(null);
      setSelectedChat(null);
      setChatId(null);
      setAgentId(null);
      setWebhookUrl(null);
    };

    window.addEventListener('chat-updated', handleChatUpdate);
    return () => {
      window.removeEventListener('chat-updated', handleChatUpdate);
    };
  }, []);

  // Tambahkan useEffect untuk mengatur webhookUrl saat agentId berubah
  useEffect(() => {
    const loadAgentWebhook = async () => {
      if (!agentId) return;
      
      try {
        const auth = localStorage.getItem('auth');
        if (!auth) return;
        
        const authData = JSON.parse(auth);
        if (!authData?.user?.id) return;
        
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
        
        if (!response.ok) return;
        
        const [agentDetail] = await response.json();
        if (agentDetail?.webhook_url) {
          setWebhookUrl(agentDetail.webhook_url);
        }
      } catch (error) {
        console.error('Error loading agent webhook URL:', error);
      }
    };
    
    loadAgentWebhook();
  }, [agentId]);

  const findChat = (chatId: string | null, chats: ChatHistory): ChatItem | null => {
    if (!chatId) return null;
    
    const todayChat = chats.today.find(c => c.chat_id.toString() === chatId);
    if (todayChat) return todayChat;
    
    const prev7DaysChat = chats.previous_7_days.find(c => c.chat_id.toString() === chatId);
    if (prev7DaysChat) return prev7DaysChat;
    
    const prev30DaysChat = chats.previous_30_days.find(c => c.chat_id.toString() === chatId);
    if (prev30DaysChat) return prev30DaysChat;
    
    return null;
  };

  const loadChatDetail = async (userId: string, chatId: string) => {
    try {
      const auth = localStorage.getItem('auth');
      if (!auth) return;
      
      const authData = JSON.parse(auth);
      if (!authData?.token) return;

      // Pertama, ambil detail chat untuk mendapatkan webhook_url
      const detailResponse = await fetch(`${API_BASE_URL}/chat/detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          chatId,
          sessionId: authData.token
        })
      });
      const detailData = await detailResponse.json();
      
      if (detailResponse.ok && detailData.length > 0) {
        setWebhookUrl(detailData[0].webhook_url);
      }

      // Kemudian ambil riwayat chat
      const chatResponse = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          chatId,
          sessionId: authData.token
        })
      });
      const chatData = await chatResponse.json();
      
      if (chatResponse.ok) {
        const transformedMessages = chatData.map((item: any) => ({
          id: item.id ? item.id.toString() : uuidv4(),
          role: item.message?.type === 'human' ? 'human' : 'ai',
          content: item.message?.content || item.output || '',
          createdAt: new Date().toISOString(),
          session_id: item.session_id,
          additional_kwargs: item.message?.additional_kwargs || {},
          response_metadata: item.message?.response_metadata || {}
        }));
        setMessages(transformedMessages);
      } else {
        console.error('Failed to load chat messages:', chatData);
      }
    } catch (error) {
      console.error('Error loading chat detail:', error);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      console.log('=== START RENAME CHAT ===');
      console.log('Parameters:', { chatId, newTitle });
      console.log('Before rename - activeChatTitle:', activeChatTitle);
      
      const authData = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!) : null;
      if (!authData) return;

      const response = await fetch(`${API_BASE_URL}/chat/edit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: authData.user.id,
          chatId,
          chatName: newTitle.trim(),
          sessionId: authData.token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rename chat');
      }

      // Update chat title di context
      setChats(prevChats => {
        console.log('Inside setChats - prevChats:', prevChats);
        const updatedChats = {
          ...prevChats,
          today: prevChats.today.map(chat => {
            if (chat.chat_id.toString() === chatId) {
              console.log('Found chat to rename in today:', chat);
              return { ...chat, title: newTitle.trim() };
            }
            return chat;
          }),
          previous_7_days: prevChats.previous_7_days.map(chat => {
            if (chat.chat_id.toString() === chatId) {
              console.log('Found chat to rename in previous_7_days:', chat);
              return { ...chat, title: newTitle.trim() };
            }
            return chat;
          }),
          previous_30_days: prevChats.previous_30_days.map(chat => {
            if (chat.chat_id.toString() === chatId) {
              console.log('Found chat to rename in previous_30_days:', chat);
              return { ...chat, title: newTitle.trim() };
            }
            return chat;
          })
        };
        return updatedChats;
      });

      // Update active chat title jika chat yang di-rename adalah chat yang sedang aktif
      const currentChat = findChat(chatId, chats);
      if (currentChat && activeChatTitle === currentChat.title) {
        console.log('Updating activeChatTitle to:', newTitle.trim());
        setActiveChatTitle(newTitle.trim());
      }

      console.log('=== END RENAME CHAT ===');
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        setMessages,
        chats,
        setChats,
        activeChatTitle,
        setActiveChatTitle,
        loadChatDetail,
        isDataFetched,
        setIsDataFetched,
        isAgentsFetched,
        setIsAgentsFetched,
        findChat,
        handleRenameChat,
        selectedAgent,
        setSelectedAgent,
        selectedChat,
        setSelectedChat,
        chatId,
        agentId,
        webhookUrl,
        setWebhookUrl,
      }}
    >
      <Suspense fallback={null}>
        <ChatParamsHandler onParamsReady={(newChatId, newAgentId) => {
          setChatId(newChatId);
          setAgentId(newAgentId);
        }} />
      </Suspense>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
} 