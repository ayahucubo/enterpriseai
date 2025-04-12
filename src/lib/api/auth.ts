import { API_BASE_URL } from '@/config/api';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface GoogleLoginData {
  token: string;
  email: string;
  name: string;
  picture?: string;
}

interface GoogleUser {
  id: string;
  google_id: string;
  email: string;
  name: string;
  created_at: string;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login gagal');
  }

  const data = await response.json();
  return {
    token: data.id,
    user: {
      id: data.id,
      name: data.name || data.email.split('@')[0],
      email: data.email
    }
  };
}

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registrasi gagal');
  }

  return response.json();
}

export async function loginWithGoogle(data: GoogleLoginData): Promise<any> {
  const response = await fetch('https://coachbot-n8n-01.fly.dev/webhook/google-auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ idToken: data.token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login dengan Google gagal');
  }

  const result = await response.json();
  console.log('Raw backend response:', result);

  return result;
}

export async function loginWithFacebook(token: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/auth/facebook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login dengan Facebook gagal');
  }

  return response.json();
} 