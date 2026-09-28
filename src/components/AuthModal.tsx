import React, { useState } from 'react';
import { Key, Shield, User as UserIcon, Lock, CheckCircle, AlertCircle, Sparkles, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (text: string, label: string) => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose, onCopy }) => {
  const { login, register, redeemCode, switchUser, users, currentUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'redeem'>('login');

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const ok = await login(email);
    setLoading(false);
    if (ok) {
      onClose();
    } else {
      setErrorMsg('লগইন ব্যর্থ হয়েছে। অ্যাকাউন্ট না থাকলে সাইন-আপ করুন বা অ্যাডমিনের সাথে যোগাযোগ করুন।');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const res = await register(name, email, accessCode);
    setLoading(false);
    if (res.success) {
      if (res.pending) {
        setSuccessMsg('আপনার অ্যাকাউন্ট তৈরি হয়েছে! অ্যাডমিন অনুমোদনের জন্য অপেক্ষা করুন, অথবা এক্সেস কি প্রবেশ করুন।');
        setMode('redeem');
      } else {
        onClose();
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    const res = await redeemCode(accessCode);
    setLoading(false);
    if (res.success) {
      setSuccessMsg('অভিনন্দন! আপনার এক্সেস সক্রিয় করা হয়েছে।');
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#120f24] border border-[#2d2557] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-[#1f1a3d] hover:bg-[#2c2452] text-slate-400 hover:text-white"
        >
          <X size={16} />
        </button>

        {/* Heading */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto mb-3">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-bold text-white">AI Content Suite Pro</h2>
          <p className="text-xs text-slate-400">
            {mode === 'login'
              ? 'অ্যাপে প্রবেশ করতে আপনার ইমেইল প্রদান করুন'
              : mode === 'register'
              ? 'নতুন অ্যাকাউন্ট খুলে এক্সেস নিন'
              : 'এক্সেস কোড প্রবেশ করে তাৎক্ষণিক চালু করুন'}
          </p>
        </div>

        {/* Quick Demo Switcher */}
        <div className="bg-[#0b0818] border border-[#221c43] p-3 rounded-xl space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            দ্রুত অ্যাকাউন্ট সিলেক্ট (Quick Demo Switch):
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const sifat = users.find((u) => u.email === 'sifatd558@gmail.com') || {
                  id: 'admin-sifat',
                  name: 'Sifat (Admin)',
                  email: 'sifatd558@gmail.com',
                  role: 'admin' as const,
                  status: 'active' as const,
                  createdAt: new Date().toISOString(),
                };
                switchUser(sifat);
                onClose();
              }}
              className="py-1.5 px-2.5 rounded-lg bg-purple-950/50 hover:bg-purple-800/60 border border-purple-700/50 text-[11px] text-purple-200 text-left font-medium transition-all"
            >
              👑 Sifat (Admin)
            </button>

            <button
              type="button"
              onClick={() => {
                const rofikul = users.find((u) => u.email === 'rofikul@example.com') || {
                  id: 'user-rofikul',
                  name: 'MD. ROFIKUL ISLAM',
                  email: 'rofikul@example.com',
                  role: 'user' as const,
                  status: 'active' as const,
                  createdAt: new Date().toISOString(),
                };
                switchUser(rofikul);
                onClose();
              }}
              className="py-1.5 px-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-[11px] text-slate-200 text-left font-medium transition-all"
            >
              👤 MD. ROFIKUL ISLAM
            </button>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800/50 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE: LOGIN */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">ইমেইল ঠিকানা (Email)</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sifatd558@gmail.com বা আপনার ইমেইল"
                className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-900/40"
            >
              {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                নতুন ইউজার? অ্যাকাউন্ট খুলতে ক্লিক করুন
              </button>
            </div>
          </form>
        )}

        {/* MODE: REGISTER */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">আপনার পূর্ণ নাম</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="MD. ROFIKUL ISLAM"
                className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">ইমেইল ঠিকানা</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2.5 px-3.5 text-sm text-slate-200 focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">
                এক্সেস কোড / ইনভাইট কি (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="e.g. PRO2026 (কোড থাকলে ইনস্ট্যান্ট এক্সেস)"
                className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2.5 px-3.5 text-sm text-slate-200 font-mono uppercase focus:border-purple-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                টিপ: অ্যাডমিনের দেওয়া কোড থাকলে দিতে পারেন (যেমন: PRO2026)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-900/40"
            >
              {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'রেজিস্ট্রেশন সম্পূর্ণ করুন'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                ইতিমধ্যে অ্যাকাউন্ট আছে? লগইন করুন
              </button>
            </div>
          </form>
        )}

        {/* MODE: REDEEM CODE */}
        {mode === 'redeem' && (
          <form onSubmit={handleRedeem} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 mb-1">এক্সেস কি লিখুন (Access Key)</label>
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                placeholder="PRO2026"
                className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2.5 px-3.5 text-sm text-slate-200 font-mono uppercase focus:border-purple-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-purple-900/40"
            >
              {loading ? 'ভেরিফাই হচ্ছে...' : 'এক্সেস সক্রিয় করুন'}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                লগইনে ফিরে যান
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
