// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define the User interface based on your MongoDB User Model
interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define your API Base URL (adjust the port if your server.ts uses something else)
const API_URL = 'http://localhost:5000/api/auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Fetch current user details using the stored JWT
        const response = await fetch(`${API_URL}/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // Token might be expired or invalid
          localStorage.removeItem('token');
          setUser(null);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // If your register route also returns a token, log them in immediately:
      if (data.token) {
        localStorage.setItem('token', data.token);
        setUser(data.user);
      }

      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Save JWT and Update State
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}