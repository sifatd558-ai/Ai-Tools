import React, { useState } from 'react';
import {
  Menu,
  LogOut,
  Shield,
  UserCheck,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  Key,
  Check,
  AlertTriangle,
  FileText,
  MessageSquare,
  Hash,
  Instagram,
  RefreshCw,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TranscriptSummarizer } from './components/TranscriptSummarizer';
import { ContentGenerator } from './components/ContentGenerator';
import { SeoAndTags } from './components/SeoAndTags';
import { InstagramCommentGen } from './components/InstagramCommentGen';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';

type TabType = 'transcript' | 'content' | 'seo' | 'instagram';

function MainApp() {
  const { currentUser, isAdmin, logout, switchUser, users } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('transcript');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (text: string, label?: string) => {
    navigator.clipboard?.writeText(text);
    setToastMessage(label ? `${label} copied!` : 'Copied to clipboard!');
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const isPending = currentUser && currentUser.status === 'pending';
  const isBlocked = currentUser && currentUser.status === 'blocked';

  return (
    <div className="min-h-screen bg-[#0b0916] text-slate-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* ---------------- TOP NAVBAR ---------------- */}
      <header className="w-full border-b border-[#1f1a3a] bg-[#0c0919]/90 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-400 via-indigo-300 to-white bg-clip-text text-transparent tracking-tight">
              AI Content Suite Pro
            </span>
          </div>

          {/* User Controls & Info */}
          <div className="flex items-center gap-3 sm:gap-5">
            {currentUser ? (
              <>
                {/* Admin button if admin */}
                {isAdmin && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-purple-950/70 hover:bg-purple-900 border border-purple-600/50 text-purple-200 text-xs font-semibold shadow-md transition-all group"
                  >
                    <Shield size={14} className="text-purple-400 group-hover:scale-110 transition-transform" />
                    <span>অ্যাডমিন প্যানেল</span>
                  </button>
                )}

                {/* Quick Account Switcher dropdown / button */}
                <div className="hidden md:flex items-center gap-2">
                  <button
                    onClick={() => {
                      // Toggle between Sifat (Admin) and MD. ROFIKUL ISLAM
                      const target =
                        currentUser.email === 'sifatd558@gmail.com'
                          ? users.find((u) => u.email === 'rofikul@example.com') || users[0]
                          : users.find((u) => u.email === 'sifatd558@gmail.com') || users[1];
                      if (target) {
                        switchUser(target);
                        triggerToast(target.name, `Switched to ${target.name}`);
                      }
                    }}
                    title="Click to toggle between Admin and User account"
                    className="p-1.5 rounded-lg bg-[#191433] hover:bg-[#251e4a] border border-[#271f4b] text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
                  >
                    <RefreshCw size={12} />
                    <span className="text-[11px]">সুইচ ইউজার</span>
                  </button>
                </div>

                {/* User Name matching the screenshot */}
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-semibold tracking-wide text-slate-200 uppercase">
                    {currentUser.name}
                  </span>
                  {isAdmin && (
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50 text-[10px] font-mono">
                      ADMIN
                    </span>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#181335] hover:bg-[#261f4e] border border-[#251f49] text-slate-300 hover:text-white text-xs font-medium transition-all"
                >
                  <LogOut size={14} />
                  <span>লগআউট</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="py-1.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all"
              >
                লগইন / রেজিস্টার
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ---------------- NAVIGATION TABS (matches screenshot) ---------------- */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="bg-[#120f26]/80 border border-[#231e42] rounded-2xl p-1.5 flex items-center gap-1 shadow-lg overflow-x-auto scrollbar-none">
          {/* Hamburger Menu button */}
          <button
            onClick={() => setShowSideMenu(!showSideMenu)}
            className="p-2.5 rounded-xl hover:bg-[#201a40] text-slate-400 hover:text-white transition-colors shrink-0"
            title="Options & Menu"
          >
            <Menu size={20} />
          </button>

          {/* Tab 1: Transcript Summarizer */}
          <button
            onClick={() => setActiveTab('transcript')}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'transcript'
                ? 'bg-[#671ceb] text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1538]'
            }`}
          >
            <FileText size={16} />
            <span>Transcript Summarizer</span>
          </button>

          {/* Tab 2: Content Generator */}
          <button
            onClick={() => setActiveTab('content')}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'content'
                ? 'bg-[#671ceb] text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1538]'
            }`}
          >
            <MessageSquare size={16} />
            <span>Content Generator</span>
          </button>

          {/* Tab 3: SEO & Tags */}
          <button
            onClick={() => setActiveTab('seo')}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'seo'
                ? 'bg-[#671ceb] text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1538]'
            }`}
          >
            <Hash size={16} />
            <span>SEO & Tags</span>
          </button>

          {/* Tab 4: Instagram Comment Gen */}
          <button
            onClick={() => setActiveTab('instagram')}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === 'instagram'
                ? 'bg-[#671ceb] text-white shadow-lg shadow-purple-900/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1538]'
            }`}
          >
            <Instagram size={16} />
            <span>Instagram Comment Gen</span>
          </button>
        </div>
      </div>

      {/* ---------------- ACCESS GATE BANNER IF PENDING OR BLOCKED ---------------- */}
      {isPending && (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">
                  অপেক্ষমান এক্সেস (Pending Admin Approval)
                </h3>
                <p className="text-xs text-amber-200/80 mt-0.5">
                  আপনার অ্যাকাউন্টটি অ্যাডমিনের অনুমোদনের অপেক্ষায় রয়েছে। অথবা অ্যাডমিনের থেকে পাওয়া এক্সেস কি দিয়ে সক্রিয় করুন।
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAuthModal(true)}
                className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5"
              >
                <Key size={14} />
                <span>এক্সেস কি লিখুন</span>
              </button>
              <button
                onClick={() => {
                  const adminUser = users.find((u) => u.email === 'sifatd558@gmail.com') || users[1];
                  switchUser(adminUser);
                  setShowAdminPanel(true);
                }}
                className="py-2 px-4 rounded-xl bg-[#28204d] hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-semibold transition-all"
              >
                অ্যাডমিন হিসেবে অনুমোদন দিন
              </button>
            </div>
          </div>
        </div>
      )}

      {isBlocked && (
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4">
          <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-5 text-center text-rose-300 text-sm">
            আপনার অ্যাকাউন্টটি স্থগিত (Deactivated) করা হয়েছে। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।
          </div>
        </div>
      )}

      {/* ---------------- MAIN CONTENT AREA ---------------- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'transcript' && <TranscriptSummarizer onCopy={triggerToast} />}
        {activeTab === 'content' && <ContentGenerator onCopy={triggerToast} />}
        {activeTab === 'seo' && <SeoAndTags onCopy={triggerToast} />}
        {activeTab === 'instagram' && <InstagramCommentGen onCopy={triggerToast} />}
      </main>

      {/* ---------------- SIDE MENU / DRAWER ---------------- */}
      {showSideMenu && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowSideMenu(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-[#120f26] border-r border-[#26204a] p-6 flex flex-col justify-between shadow-2xl z-10 animate-slide-right">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#231e42] pb-4">
                <span className="font-bold text-white text-lg">AI Content Suite</span>
                <button
                  onClick={() => setShowSideMenu(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Navigation quick links */}
              <div className="space-y-1">
                <button
                  onClick={() => {
                    setActiveTab('transcript');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                    activeTab === 'transcript' ? 'bg-[#671ceb] text-white' : 'text-slate-300 hover:bg-[#1a1538]'
                  }`}
                >
                  <FileText size={16} />
                  <span>Transcript Summarizer</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('content');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                    activeTab === 'content' ? 'bg-[#671ceb] text-white' : 'text-slate-300 hover:bg-[#1a1538]'
                  }`}
                >
                  <MessageSquare size={16} />
                  <span>Content Generator</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('seo');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                    activeTab === 'seo' ? 'bg-[#671ceb] text-white' : 'text-slate-300 hover:bg-[#1a1538]'
                  }`}
                >
                  <Hash size={16} />
                  <span>SEO & Tags</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('instagram');
                    setShowSideMenu(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl text-sm font-medium flex items-center gap-2.5 ${
                    activeTab === 'instagram' ? 'bg-[#671ceb] text-white' : 'text-slate-300 hover:bg-[#1a1538]'
                  }`}
                >
                  <Instagram size={16} />
                  <span>Instagram Comment Gen</span>
                </button>
              </div>

              {/* Admin Panel button inside drawer */}
              <div className="pt-4 border-t border-[#231e42] space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  অ্যাডমিন এক্সেস কন্ট্রোল
                </span>
                <button
                  onClick={() => {
                    setShowSideMenu(false);
                    // switch to admin if not admin
                    if (!isAdmin) {
                      const admin = users.find((u) => u.email === 'sifatd558@gmail.com') || users[1];
                      switchUser(admin);
                    }
                    setShowAdminPanel(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-600/40 text-purple-200 text-xs font-semibold flex items-center gap-2"
                >
                  <Shield size={16} className="text-purple-400" />
                  <span>অ্যাডমিন ড্যাশবোর্ড খুলুন</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-[#231e42] text-xs text-slate-500">
              AI Content Suite Pro • Powered by Gemini 3.8 Flash
            </div>
          </div>
        </div>
      )}

      {/* ---------------- MODALS & TOASTS ---------------- */}
      <AdminPanel
        isOpen={showAdminPanel}
        onClose={() => setShowAdminPanel(false)}
        onCopy={triggerToast}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onCopy={triggerToast}
      />

      <Toast message={toastMessage} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
