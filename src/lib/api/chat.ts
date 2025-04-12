import { API_BASE_URL } from '@/config/api';
import { getAuthToken } from '@/lib/utils/auth';

export interface Message {
  id: string;
  content: string;
  role: 'human' | 'ai';
  timestamp: string;
  webhook_url?: string;
}

export interface ChatHistory {
  id: string;
  user_id: string;
  chat_name: string | null;
  mode: string | null;
  created_at: string;
  last_updated: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'human' | 'ai';
  timestamp: string;
}

export interface SendMessageResponse {
  message: Message;
  chat_id: string;
}

export interface GetChatHistoryResponse {
  id: string;
  user_id: string;
  chat_name: string | null;
  mode: string | null;
  created_at: string;
  last_updated: string;
}

export interface GetChatMessagesResponse {
  messages: Message[];
}

// Helper untuk mendapatkan user data
const getAuthData = () => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  return auth;
};

export async function sendMessage(chatId: string | null, content: string): Promise<SendMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({
      chat_id: chatId,
      message: content,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return await response.json();
}

export async function getChatHistory(): Promise<GetChatHistoryResponse[]> {
  const authData = getAuthData();
  const userId = authData.user?.id;

  if (!userId) {
    throw new Error('User ID not found');
  }

  const response = await fetch(`${API_BASE_URL}/chat-history`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({
      userId: userId
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get chat history');
  }

  return await response.json();
}

export async function getChatMessages(chatId: string): Promise<GetChatMessagesResponse> {
  const response = await fetch(`${API_BASE_URL}/chat/${chatId}/messages`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Gagal mengambil pesan chat');
  }

  return response.json();
}

export async function renameChat(chatId: string, newTitle: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/chat/edit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify({
      id: chatId,
      chatName: newTitle,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to rename chat');
  }
}

export async function deleteChat(userId: string, chatId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        chatId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
} 