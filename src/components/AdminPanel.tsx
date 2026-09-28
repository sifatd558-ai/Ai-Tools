import React, { useState } from 'react';
import {
  Shield,
  Users,
  Key,
  UserCheck,
  UserX,
  Plus,
  Trash2,
  CheckCircle,
  Clock,
  Ban,
  Copy,
  Sparkles,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { User, AccessCode } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCopy: (text: string, label: string) => void;
}

export const AdminPanel: React.FC<Props> = ({ isOpen, onClose, onCopy }) => {
  const {
    users,
    accessCodes,
    updateUserStatus,
    updateUserRole,
    deleteUser,
    approveAllPending,
    createAccessCode,
    deleteAccessCode,
    addUserDirectly,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'codes' | 'pending'>('users');
  const [searchQuery, setSearchQuery] = useState('');

  // New code form state
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [newCodeMaxUses, setNewCodeMaxUses] = useState(50);
  const [creatingCode, setCreatingCode] = useState(false);

  // New user form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');

  if (!isOpen) return null;

  const pendingUsers = users.filter((u) => u.status === 'pending');
  const activeUsers = users.filter((u) => u.status === 'active');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCode(true);
    const code = newCodeName || `VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    await createAccessCode(code, newCodeLabel || 'Standard Access Pass', newCodeMaxUses);
    setNewCodeName('');
    setNewCodeLabel('');
    setCreatingCode(false);
    onCopy(code, 'New Access Code created & copied!');
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    await addUserDirectly(newUserName, newUserEmail, newUserRole);
    setNewUserName('');
    setNewUserEmail('');
    setShowAddUserModal(false);
    onCopy(newUserEmail, 'User added with immediate active access!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#120f24] border border-[#2d2557] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#231e42] bg-[#16122c]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
              <Shield size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>অ্যাডমিন কন্ট্রোল ও এক্সেস প্যানেল</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-600/30 text-purple-300 border border-purple-500/40">
                  Super Admin
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                সবার এক্সেস পরিচালনা করুন, নতুন কোড দিন এবং ব্যবহারকারী অনুমোদন করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-[#201a3d] hover:bg-[#2c2452] text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-[#231e42] bg-[#0e0b1d]">
          <div className="bg-[#15112a] border border-[#262047] p-3.5 rounded-xl">
            <span className="text-xs text-slate-400">মোট ইউজার</span>
            <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
          </div>
          <div className="bg-[#15112a] border border-[#262047] p-3.5 rounded-xl">
            <span className="text-xs text-emerald-400 font-medium">এক্টিভ এক্সেস</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{activeUsers.length}</div>
          </div>
          <div className="bg-[#15112a] border border-[#262047] p-3.5 rounded-xl">
            <span className="text-xs text-amber-400 font-medium">অনুমোদনের অপেক্ষায়</span>
            <div className="text-2xl font-bold text-amber-400 mt-1">{pendingUsers.length}</div>
          </div>
          <div className="bg-[#15112a] border border-[#262047] p-3.5 rounded-xl">
            <span className="text-xs text-purple-400 font-medium">এক্সেস কি সমূহ</span>
            <div className="text-2xl font-bold text-purple-400 mt-1">{accessCodes.length}</div>
          </div>
        </div>

        {/* Nav Tabs inside modal */}
        <div className="flex border-b border-[#231e42] px-6 bg-[#141029] gap-2 pt-2">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users size={16} />
            <span>সকল ব্যবহারকারী ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'pending'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Clock size={16} />
            <span>অপেক্ষমান আবেদন ({pendingUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('codes')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'codes'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Key size={16} />
            <span>এক্সেস কি ও কোড ({accessCodes.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: ALL USERS */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2 px-3.5 pl-9 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {pendingUsers.length > 0 && (
                    <button
                      onClick={approveAllPending}
                      className="py-2 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                    >
                      <UserCheck size={14} />
                      <span>সব অনুমোদন দিন ({pendingUsers.length})</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowAddUserModal(true)}
                    className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Plus size={14} />
                    <span>ইউজার যুক্ত করুন</span>
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="border border-[#251f46] rounded-xl overflow-hidden bg-[#0d0a1b]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#171231] text-slate-400 font-semibold border-b border-[#251f46]">
                    <tr>
                      <th className="py-3 px-4">নাম ও ইমেইল</th>
                      <th className="py-3 px-4">রোল</th>
                      <th className="py-3 px-4">এক্সেস স্ট্যাটাস</th>
                      <th className="py-3 px-4 text-right">একশন ও নিয়ন্ত্রণ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1939]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#130f28] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-white">{u.name}</div>
                          <div className="text-slate-400 text-[11px] font-mono">{u.email}</div>
                          {u.usedCode && (
                            <span className="text-[10px] text-purple-400">কোড: {u.usedCode}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                              u.role === 'admin'
                                ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {u.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] ${
                              u.status === 'active'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                : u.status === 'pending'
                                ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                                : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                            }`}
                          >
                            {u.status === 'active' && <CheckCircle size={11} />}
                            {u.status === 'pending' && <Clock size={11} />}
                            {u.status === 'blocked' && <Ban size={11} />}
                            {u.status === 'active' ? 'এক্টিভ (অনুমোদিত)' : u.status === 'pending' ? 'অনুমোদনের অপেক্ষায়' : 'স্থগিত (Blocked)'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {u.status !== 'active' ? (
                            <button
                              onClick={() => updateUserStatus(u.id, 'active')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all text-[11px]"
                              title="এক্সেস দিন"
                            >
                              এক্সেস দিন
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserStatus(u.id, 'blocked')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-all text-[11px]"
                              title="এক্সেস বন্ধ করুন"
                            >
                              স্থগিত
                            </button>
                          )}

                          <button
                            onClick={() => updateUserRole(u.id, u.role === 'admin' ? 'user' : 'admin')}
                            className="px-2.5 py-1 rounded-lg bg-[#251e46] hover:bg-purple-600 text-slate-300 hover:text-white transition-all text-[11px]"
                            title="রোল পরিবর্তন"
                          >
                            {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                          </button>

                          {u.email !== 'sifatd558@gmail.com' && (
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="p-1 rounded-lg bg-red-900/30 hover:bg-red-700 text-red-300 hover:text-white transition-all"
                              title="Delete user"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PENDING APPROVALS */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">অপেক্ষমান আবেদনসমূহ</h3>
                  <p className="text-xs text-slate-400">এই ইউজাররা অ্যাপ ব্যবহার করার জন্য আপনার অনুমোদনের অপেক্ষায় আছেন</p>
                </div>

                {pendingUsers.length > 0 && (
                  <button
                    onClick={approveAllPending}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <CheckCircle size={14} />
                    <span>সবাইকে এক্সেস অনুমোদন দিন</span>
                  </button>
                )}
              </div>

              {pendingUsers.length === 0 ? (
                <div className="text-center py-12 bg-[#0c0a18] rounded-xl border border-[#211b3e] text-slate-400 space-y-2">
                  <CheckCircle size={32} className="mx-auto text-emerald-400 opacity-80" />
                  <p className="text-sm font-medium text-slate-300">কোন অপেক্ষমান আবেদন নেই!</p>
                  <p className="text-xs">সব ইউজার বর্তমানে অনুমোদিত এবং অ্যাপ এক্সেস পাচ্ছেন।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingUsers.map((pu) => (
                    <div
                      key={pu.id}
                      className="bg-[#15112c] border border-amber-500/30 rounded-xl p-4 flex items-center justify-between gap-3 shadow-md"
                    >
                      <div>
                        <h4 className="font-bold text-white text-sm">{pu.name}</h4>
                        <p className="text-xs text-slate-400 font-mono">{pu.email}</p>
                        <span className="text-[10px] text-amber-400 mt-1 inline-block">
                          আবেদন তারিখ: {new Date(pu.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateUserStatus(pu.id, 'active')}
                          className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1 shadow"
                        >
                          <CheckCircle size={13} />
                          <span>অনুমোদন দিন</span>
                        </button>
                        <button
                          onClick={() => deleteUser(pu.id)}
                          className="p-1.5 rounded-lg bg-rose-900/40 hover:bg-rose-700 text-rose-300 hover:text-white"
                          title="বাতিল করুন"
                        >
                          <UserX size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCESS CODES GENERATOR */}
          {activeTab === 'codes' && (
            <div className="space-y-6">
              {/* Generator Form */}
              <div className="bg-[#15112c] border border-[#262047] rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key size={17} className="text-purple-400" />
                  <span>নতুন এক্সেস কি তৈরি করুন</span>
                </h3>
                <p className="text-xs text-slate-400">
                  এই কোডটি যে কাউকে দিলে সে তাৎক্ষণিকভাবে এক্সেস পেয়ে অ্যাপ ব্যবহার করতে পারবে।
                </p>

                <form onSubmit={handleCreateCode} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">কাস্টম কোড (ঐচ্ছিক)</label>
                    <input
                      type="text"
                      value={newCodeName}
                      onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                      placeholder="e.g. CREATOR-2026"
                      className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2 px-3 text-xs text-slate-200 uppercase font-mono focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">লেবেল / বর্ণনা</label>
                    <input
                      type="text"
                      value={newCodeLabel}
                      onChange={(e) => setNewCodeLabel(e.target.value)}
                      placeholder="e.g. VIP Member Access"
                      className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">সর্বোচ্চ ব্যবহার সংখ্যা</label>
                    <input
                      type="number"
                      value={newCodeMaxUses}
                      onChange={(e) => setNewCodeMaxUses(Number(e.target.value))}
                      min={1}
                      max={10000}
                      className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3 pt-2">
                    <button
                      type="submit"
                      disabled={creatingCode}
                      className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-md flex items-center gap-2"
                    >
                      <Plus size={15} />
                      <span>এক্সেস কি জেনারেট করুন</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Codes Table */}
              <div className="border border-[#251f46] rounded-xl overflow-hidden bg-[#0d0a1b]">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#171231] text-slate-400 font-semibold border-b border-[#251f46]">
                    <tr>
                      <th className="py-3 px-4">এক্সেস কি (Code)</th>
                      <th className="py-3 px-4">লেবেল</th>
                      <th className="py-3 px-4">ব্যবহার হয়েছে</th>
                      <th className="py-3 px-4 text-right">কপি ও ব্যবস্থাপনা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e1939]">
                    {accessCodes.map((code) => (
                      <tr key={code.id} className="hover:bg-[#130f28] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-purple-400 font-bold bg-purple-950/60 px-2 py-1 rounded border border-purple-800/40">
                            {code.code}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{code.label}</td>
                        <td className="py-3 px-4">
                          <span className="text-slate-400 font-mono">
                            {code.usedCount} / {code.maxUses} জন
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => onCopy(code.code, `Access Code: ${code.code}`)}
                            className="py-1 px-2.5 rounded-lg bg-[#221c42] hover:bg-purple-600 text-slate-300 hover:text-white transition-all text-xs inline-flex items-center gap-1"
                            title="Copy code"
                          >
                            <Copy size={12} />
                            <span>কপি</span>
                          </button>
                          <button
                            onClick={() => deleteAccessCode(code.id)}
                            className="p-1 rounded-lg bg-red-900/30 hover:bg-red-700 text-red-300 hover:text-white transition-all"
                            title="Delete access code"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-[#16122d] border border-purple-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#262047] pb-3">
              <h3 className="text-lg font-bold text-white">নতুন ব্যবহারকারী যুক্ত করুন</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 mb-1">পূর্ণ নাম</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Tanvir Ahmed"
                  className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">ইমেইল ঠিকানা</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="e.g. user@gmail.com"
                  className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">রোল</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
                  className="w-full bg-[#0b0818] border border-[#252046] rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-purple-500 focus:outline-none cursor-pointer"
                >
                  <option value="user">Regular User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="py-2 px-4 rounded-xl bg-[#231d44] text-slate-300 text-xs font-semibold hover:bg-[#2f275c]"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md"
                >
                  এক্টিভ এক্সেস দিন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
