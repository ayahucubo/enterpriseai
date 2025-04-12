'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { Agent, AgentDetail, getAgentDetail } from '@/lib/api/explore';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { API_BASE_URL } from '@/config/api';

interface AgentDetailModalProps {
  agent: Agent;
  onClose: () => void;
  onStartChat: () => void;
}

export function AgentDetailModal({ agent, onClose, onStartChat }: AgentDetailModalProps) {
  const [agentDetail, setAgentDetail] = useState<AgentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const loadAgentDetail = async () => {
      try {
        const detail = await getAgentDetail(agent.id);
        setAgentDetail(detail);
      } catch (error) {
        console.error('Error loading agent detail:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAgentDetail();
  }, [agent.id]);

  const handleStarterClick = async (starter: string) => {
    try {
      setIsProcessing(true);

      const auth = localStorage.getItem('auth');
      if (!auth) {
        router.push('/login');
        return;
      }

      const authData = JSON.parse(auth);
      if (!authData.token || !authData.user) {
        localStorage.removeItem('auth');
        router.push('/login');
        return;
      }

      // Buat chat baru
      const response = await fetch(`${API_BASE_URL}/chat/newid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: authData.user.id,
          agentId: agent.id,
          chatName: agent.name,
          agentName: agent.name,
          sessionId: authData.token
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create new chat');
      }

      const data = await response.json();
      const chatId = data.chatId;

      // Kirim pesan starter
      const chatResponse = await fetch(agentDetail?.webhook_url || `${API_BASE_URL}/chatbot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: starter,
          userId: authData.user.id,
          chatId: chatId,
          isAction: true,
          timestamp: new Date().toISOString(),
          sessionId: authData.token
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Failed to send message');
      }

      // Trigger chat-updated event untuk memperbarui sidebar
      window.dispatchEvent(new Event('chat-updated'));

      // Tutup modal dan arahkan ke halaman chat
      onClose();
      router.push(`/chat?chatId=${chatId}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Terjadi kesalahan saat memulai chat');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-50" />
        <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-900 rounded-2xl p-8 flex items-center justify-center z-50">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={isProcessing ? undefined : onClose}
      />
      
      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-xl z-50">
        {/* Header */}
        <div className="flex justify-between items-center p-4">
          <div className="w-8" /> {/* Spacer */}
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {/* Agent Info */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-lg overflow-hidden mb-4">
              <Image
                src={agent.icon_url.startsWith('http') ? agent.icon_url : `/images/${agent.icon_url}`}
                alt={agent.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {agent.name}
            </h2>
            <p className="text-sm text-gray-500 mb-2">
              By {agent.provider}
            </p>
            {agentDetail?.rating && (
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{agentDetail.rating}</span>
                  <span className="text-yellow-500">★</span>
                </div>
                <span className="text-gray-300">|</span>
                <span>#{1} in {agentDetail.category}</span>
                <span className="text-gray-300">|</span>
                <span>{(agentDetail.conversation_count / 1000000).toFixed(0)}M+ Conversations</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-center mb-8">
            {agent.description}
          </p>

          {/* Conversation Starters */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Conversation Starters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {agentDetail?.conversation_starters.map((starter, index) => (
                <button
                  key={index}
                  onClick={() => handleStarterClick(starter)}
                  disabled={isProcessing}
                  className={`text-left p-4 bg-white hover:bg-gray-50 rounded-[20px] text-sm text-gray-600 transition-colors shadow-[0_0_0_1px_rgba(0,0,0,0.08)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.12)] relative ${
                    isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {/* Start Chat Button */}
          <button
            onClick={() => {
              onStartChat();
              router.push(`/chat?agent=${agent.id}`);
            }}
            disabled={isProcessing}
            className={`w-full mt-8 py-3 px-4 bg-[#3f51b5] text-white rounded-xl font-medium hover:bg-[#3b1672] transition-colors flex items-center justify-center gap-2 ${
              isProcessing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <MessageCircle size={20} />
            <span>Mulai Chat</span>
          </button>

          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center rounded-2xl">
              <div className="flex flex-col items-center gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#3f51b5] border-t-transparent"></div>
                <p className="text-sm text-gray-600">Memulai percakapan...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 