import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { STORAGE_KEYS, getStoredUsers, setStoredUsers, getCurrentUser, setCurrentUser, clearCurrentUser } from '../lib/storage';

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'cashier';
  name: string;
  email?: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUsers: User[] = [
  {
    id: '1',
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator',
    email: 'admin@dimsummpokrani.com',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: '2',
    username: 'kasir1',
    password: 'kasir123',
    role: 'cashier',
    name: 'Kasir 1',
    email: 'kasir1@dimsummpokrani.com',
    createdAt: new Date().toISOString(),
    isActive: true,
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize users in localStorage if not exists
    const users = getStoredUsers();
    if (users.length === 0) {
      setStoredUsers(defaultUsers);
    }

    // Check for existing session using centralized storage utility
    const storedUser = getCurrentUser();
    if (storedUser) {
      setUser(storedUser as User);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const users = getStoredUsers() as User[];
    const foundUser = users.find(
      (u: User) => u.username === username && u.password === password && u.isActive
    );

    if (!foundUser) {
      return false;
    }

    setUser(foundUser);
    setCurrentUser(foundUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    clearCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};