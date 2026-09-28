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

const LOCAL_USERS_KEY = 'ai_content_suite_users_db';
const LOCAL_CODES_KEY = 'ai_content_suite_codes_db';
const CURRENT_USER_KEY = 'ai_content_suite_user';

const INITIAL_USERS: User[] = [
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

const INITIAL_CODES: AccessCode[] = [
  {
    id: 'code-1',
    code: 'PRO2026',
    label: 'VIP Pro Creator Pass',
    maxUses: 100,
    usedCount: 1,
    createdBy: 'sifatd558@gmail.com',
    createdAt: '2026-09-01T00:00:00.000Z',
    active: true,
  },
  {
    id: 'code-2',
    code: 'CONTENTPRO',
    label: 'Content Team Access',
    maxUses: 50,
    usedCount: 0,
    createdBy: 'sifatd558@gmail.com',
    createdAt: '2026-09-10T00:00:00.000Z',
    active: true,
  },
  {
    id: 'code-3',
    code: 'ADMINPASS',
    label: 'Unlimited Admin Pass',
    maxUses: 9999,
    usedCount: 0,
    createdBy: 'sifatd558@gmail.com',
    createdAt: '2026-09-20T00:00:00.000Z',
    active: true,
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_USERS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_USERS;
  });

  const [accessCodes, setAccessCodes] = useState<AccessCode[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CODES_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CODES;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(CURRENT_USER_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_USERS[0];
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin' || currentUser?.email === 'sifatd558@gmail.com';

  const saveLocalUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(newUsers));
    } catch (e) {}
  };

  const saveLocalCodes = (newCodes: AccessCode[]) => {
    setAccessCodes(newCodes);
    try {
      localStorage.setItem(LOCAL_CODES_KEY, JSON.stringify(newCodes));
    } catch (e) {}
  };

  const saveCurrentUser = (user: User | null) => {
    setCurrentUser(user);
    try {
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {}
  };

  const refreshData = async () => {
    try {
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok && usersRes.headers.get('content-type')?.includes('application/json')) {
        const uData = await usersRes.json();
        if (uData.users && uData.users.length > 0) {
          saveLocalUsers(uData.users);
          if (currentUser) {
            const found = uData.users.find((u: User) => u.id === currentUser.id);
            if (found) saveCurrentUser(found);
          }
        }
      }

      const codesRes = await fetch('/api/admin/access-codes');
      if (codesRes.ok && codesRes.headers.get('content-type')?.includes('application/json')) {
        const cData = await codesRes.json();
        if (cData.accessCodes) {
          saveLocalCodes(cData.accessCodes);
        }
      }
    } catch (err) {
      // Fallback seamlessly to local storage
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const login = async (email: string): Promise<boolean> => {
    setError(null);
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Try server first
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.user) {
          saveCurrentUser(data.user);
          setLoading(false);
          refreshData();
          return true;
        }
      }
    } catch (e) {}

    // Local fallback
    let user = users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user && cleanEmail === 'sifatd558@gmail.com') {
      user = {
        id: 'admin-' + Date.now(),
        name: 'Sifat (Admin)',
        email: cleanEmail,
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      saveLocalUsers([...users, user]);
    }

    if (!user) {
      setError('User not found. Please register.');
      setLoading(false);
      return false;
    }

    if (user.status === 'blocked') {
      setError('Your account is blocked by admin.');
      setLoading(false);
      return false;
    }

    saveCurrentUser(user);
    setLoading(false);
    return true;
  };

  const register = async (name: string, email: string, accessCode?: string) => {
    setError(null);
    setLoading(true);
    const cleanEmail = email.trim().toLowerCase();

    // Try server first
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: cleanEmail, accessCode }),
      });
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        if (data.user) {
          saveCurrentUser(data.user);
          setLoading(false);
          refreshData();
          return {
            success: true,
            message: data.message || 'Registration successful.',
            pending: data.user.status === 'pending',
          };
        }
      }
    } catch (e) {}

    // Local fallback
    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      setLoading(false);
      return { success: false, message: 'An account with this email already exists.' };
    }

    const isAdminEmail = cleanEmail === 'sifatd558@gmail.com';
    let initialStatus: 'active' | 'pending' = isAdminEmail ? 'active' : 'pending';
    let usedCodeClean = '';

    if (accessCode && !isAdminEmail) {
      const cleanCode = accessCode.trim().toUpperCase();
      const codeObj = accessCodes.find((c) => c.code.toUpperCase() === cleanCode && c.active);
      if (codeObj) {
        initialStatus = 'active';
        codeObj.usedCount += 1;
        usedCodeClean = codeObj.code;
        saveLocalCodes([...accessCodes]);
      } else {
        setLoading(false);
        return { success: false, message: 'Invalid or expired access code.' };
      }
    }

    const newUser: User = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      role: isAdminEmail ? 'admin' : 'user',
      status: initialStatus,
      createdAt: new Date().toISOString(),
      usedCode: usedCodeClean || undefined,
    };

    const updatedUsers = [...users, newUser];
    saveLocalUsers(updatedUsers);
    saveCurrentUser(newUser);
    setLoading(false);

    return {
      success: true,
      message: initialStatus === 'active' ? 'Account active and ready!' : 'Account registered! Awaiting admin approval.',
      pending: initialStatus === 'pending',
    };
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
      if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
        const data = await res.json();
        saveCurrentUser(data.user);
        setLoading(false);
        refreshData();
        return { success: true, message: data.message || 'Access granted!' };
      }
    } catch (e) {}

    const cleanCode = code.trim().toUpperCase();
    const codeObj = accessCodes.find((c) => c.code.toUpperCase() === cleanCode && c.active);

    if (!codeObj) {
      setLoading(false);
      return { success: false, message: 'Invalid or expired access code.' };
    }

    codeObj.usedCount += 1;
    const updatedUser: User = {
      ...currentUser,
      status: 'active',
      usedCode: codeObj.code,
    };

    saveCurrentUser(updatedUser);
    saveLocalUsers(users.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    saveLocalCodes([...accessCodes]);
    setLoading(false);

    return { success: true, message: 'Access code redeemed successfully!' };
  };

  const logout = () => {
    saveCurrentUser(null);
  };

  const switchUser = (targetUser: User) => {
    saveCurrentUser(targetUser);
  };

  const updateUserStatus = async (id: string, status: 'active' | 'pending' | 'blocked') => {
    try {
      await fetch(`/api/admin/users/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (e) {}

    const updated = users.map((u) => (u.id === id ? { ...u, status } : u));
    saveLocalUsers(updated);
    if (currentUser?.id === id) {
      saveCurrentUser({ ...currentUser, status });
    }
    return true;
  };

  const updateUserRole = async (id: string, role: 'admin' | 'user') => {
    try {
      await fetch(`/api/admin/users/${id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
    } catch (e) {}

    const updated = users.map((u) => (u.id === id ? { ...u, role } : u));
    saveLocalUsers(updated);
    if (currentUser?.id === id) {
      saveCurrentUser({ ...currentUser, role });
    }
    return true;
  };

  const deleteUser = async (id: string) => {
    try {
      await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    } catch (e) {}

    const updated = users.filter((u) => u.id !== id);
    saveLocalUsers(updated);
    return true;
  };

  const approveAllPending = async () => {
    try {
      await fetch('/api/admin/approve-all', { method: 'POST' });
    } catch (e) {}

    let count = 0;
    const updated = users.map((u) => {
      if (u.status === 'pending') {
        count++;
        return { ...u, status: 'active' as const };
      }
      return u;
    });
    saveLocalUsers(updated);
    return count;
  };

  const createAccessCode = async (code: string, label: string, maxUses: number) => {
    const cleanCode = code.trim().toUpperCase();
    const newCode: AccessCode = {
      id: 'code-' + Date.now(),
      code: cleanCode,
      label: label || 'Standard Access Pass',
      maxUses,
      usedCount: 0,
      createdBy: currentUser?.email || 'sifatd558@gmail.com',
      createdAt: new Date().toISOString(),
      active: true,
    };

    try {
      await fetch('/api/admin/access-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCode),
      });
    } catch (e) {}

    saveLocalCodes([...accessCodes, newCode]);
    return true;
  };

  const deleteAccessCode = async (id: string) => {
    try {
      await fetch(`/api/admin/access-codes/${id}`, { method: 'DELETE' });
    } catch (e) {}

    saveLocalCodes(accessCodes.filter((c) => c.id !== id));
    return true;
  };

  const addUserDirectly = async (name: string, email: string, role: 'admin' | 'user') => {
    const cleanEmail = email.trim().toLowerCase();
    const newUser: User = {
      id: 'user-' + Date.now(),
      name: name.trim(),
      email: cleanEmail,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
    } catch (e) {}

    saveLocalUsers([...users, newUser]);
    return true;
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
