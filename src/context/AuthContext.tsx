import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AccessCode } from '../types';

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  users: User[];
  accessCodes: AccessCode[];
  loading: boolean;
  error: string | null;
  login: (email: string) => Promise<boolean>;
  register: (name: string, email: string, accessCode?: string) => Promise<{ success: boolean; message: string; pending?: boolean }>;
  redeemCode: (code: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  switchUser: (targetUser: User) => void;
  refreshData: () => Promise<void>;
  updateUserStatus: (id: string, status: 'active' | 'pending' | 'blocked') => Promise<boolean>;
  updateUserRole: (id: string, role: 'admin' | 'user') => Promise<boolean>;
  deleteUser: (id: string) => Promise<boolean>;
  approveAllPending: () => Promise<number>;
  createAccessCode: (code: string, label: string, maxUses: number) => Promise<boolean>;
  deleteAccessCode: (id: string) => Promise<boolean>;
  addUserDirectly: (name: string, email: string, role: 'admin' | 'user') => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_USERS: User[] = [
  {
    id: 'user-rofikul',
    name: 'MD. ROFIKUL ISLAM',
    email: 'rofikul@example.com',
    role: 'user',
    status: 'active',
    createdAt: '2026-09-15T10:30:00.000Z',
    usedCode: 'PRO2026',
  },
  {
    id: 'admin-sifat',
    name: 'Sifat (Admin)',
    email: 'sifatd558@gmail.com',
    role: 'admin',
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('ai_content_suite_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default to the user in the screenshot: MD. ROFIKUL ISLAM
    return DEFAULT_USERS[0];
  });

  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'sifatd558@gmail.com';

  const refreshData = async () => {
    try {
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const uData = await usersRes.json();
        if (uData.users && uData.users.length > 0) {
          setUsers(uData.users);
          // sync current user if updated in backend
          if (currentUser) {
            const found = uData.users.find((u: User) => u.id === currentUser.id);
            if (found) {
              setCurrentUser(found);
              localStorage.setItem('ai_content_suite_user', JSON.stringify(found));
            }
          }
        }
      }

      const codesRes = await fetch('/api/admin/access-codes');
      if (codesRes.ok) {
        const cData = await codesRes.json();
        if (cData.accessCodes) {
          setAccessCodes(cData.accessCodes);
        }
      }
    } catch (err) {
      console.warn('Could not fetch backend users, keeping local state:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return false;
      }

      setCurrentUser(data.user);
      localStorage.setItem('ai_content_suite_user', JSON.stringify(data.user));
      setLoading(false);
      refreshData();
      return true;
    } catch (err: any) {
      setError(err.message || 'Network error during login.');
      setLoading(false);
      return false;
    }
  };

  const register = async (name: string, email: string, accessCode?: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, accessCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed.');
        setLoading(false);
        return { success: false, message: data.error || 'Registration failed.' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('ai_content_suite_user', JSON.stringify(data.user));
      setLoading(false);
      refreshData();
      return {
        success: true,
        message: data.message || 'Registered successfully.',
        pending: data.user.status === 'pending',
      };
    } catch (err: any) {
      setError(err.message || 'Network error.');
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  const redeemCode = async (code: string) => {
    if (!currentUser) return { success: false, message: 'Please log in first.' };
    setLoading(true);
    try {
      const res = await fetch('/api/auth/redeem-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email, accessCode: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoading(false);
        return { success: false, message: data.error || 'Failed to redeem code.' };
      }

      setCurrentUser(data.user);
      localStorage.setItem('ai_content_suite_user', JSON.stringify(data.user));
      setLoading(false);
      refreshData();
      return { success: true, message: data.message || 'Access granted!' };
    } catch (err: any) {
      setLoading(false);
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('ai_content_suite_user');
  };

  const switchUser = (targetUser: User) => {
    setCurrentUser(targetUser);
    localStorage.setItem('ai_content_suite_user', JSON.stringify(targetUser));
  };

  const updateUserStatus = async (id: string, status: 'active' | 'pending' | 'blocked') => {
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        refreshData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const updateUserRole = async (id: string, role: 'admin' | 'user') => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        refreshData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const deleteUser = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const approveAllPending = async () => {
    try {
      const res = await fetch('/api/admin/approve-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        refreshData();
        return data.approvedCount || 0;
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  };

  const createAccessCode = async (code: string, label: string, maxUses: number) => {
    try {
      const res = await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          label,
          maxUses,
          createdBy: currentUser?.email || 'sifatd558@gmail.com',
        }),
      });
      if (res.ok) {
        refreshData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const deleteAccessCode = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/access-codes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  const addUserDirectly = async (name: string, email: string, role: 'admin' | 'user') => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role, status: 'active' }),
      });
      if (res.ok) {
        refreshData();
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        users,
        accessCodes,
        loading,
        error,
        login,
        register,
        redeemCode,
        logout,
        switchUser,
        refreshData,
        updateUserStatus,
        updateUserRole,
        deleteUser,
        approveAllPending,
        createAccessCode,
        deleteAccessCode,
        addUserDirectly,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
