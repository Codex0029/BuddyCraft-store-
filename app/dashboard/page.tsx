'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Award, Key, Coins, ShoppingBag, Settings, LogOut, CheckCircle, RefreshCw, KeyRound, User as UserIcon, HelpCircle } from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  category: 'ranks' | 'crates' | 'coins';
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  username: string;
  email: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  couponCode?: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentGateway: string;
  paymentId?: string;
  createdAt: string;
}

export default function UserDashboardPage() {
  const { user, token, logout, updateUser, settings, addToast } = useApp();
  const router = useRouter();

  // Drawers / Modals
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');

  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);

  // Form States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const [minecraftName, setMinecraftName] = useState(() => user?.username || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Auth Redirect Guard
  useEffect(() => {
    if (!user && !token) {
      router.push('/store');
    }
  }, [user, token, router]);

  // Load orders on load
  useEffect(() => {
    async function loadOrders() {
      if (!token) return;
      setIsLoadingOrders(true);
      try {
        const res = await fetch('/api/orders', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.orders) {
          setOrders(data.orders);
        }
      } catch (e) {
        console.error('Failed to load user order history:', e);
      }
      setIsLoadingOrders(false);
    }
    loadOrders();
  }, [token]);

  useEffect(() => {
    if (user && !minecraftName) {
      const timer = setTimeout(() => {
        setMinecraftName(user.username);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, minecraftName]);

  const openAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setIsAuthOpen(true);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      addToast('Please enter both old and new passwords.', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('New password must be at least 6 characters long.', 'error');
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'change-password',
          oldPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      setIsSavingPassword(false);

      if (res.ok && data.user) {
        addToast('Password successfully updated!', 'success');
        setOldPassword('');
        setNewPassword('');
      } else {
        addToast(data.error || 'Failed to change password.', 'error');
      }
    } catch (_) {
      setIsSavingPassword(false);
      addToast('Password change network error.', 'error');
    }
  };

  const handleUpdateMinecraftName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minecraftName.trim()) {
      addToast('Minecraft character username is required.', 'error');
      return;
    }

    setIsSavingName(true);
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: 'update-username',
          username: minecraftName.trim(),
        }),
      });

      const data = await res.json();
      setIsSavingName(false);

      if (res.ok && data.user) {
        updateUser(data.user);
        addToast('Minecraft Character IGN successfully linked!', 'success');
      } else {
        addToast(data.error || 'Failed to update username.', 'error');
      }
    } catch (_) {
      setIsSavingName(false);
      addToast('Username update network error.', 'error');
    }
  };

  const handleToggleDiscordLinkage = async () => {
    if (!user) return;
    const isLinked = !!user.discordId;

    try {
      if (isLinked) {
        // Unlink
        const res = await fetch('/api/auth/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: 'unlink-discord' }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          updateUser(data.user);
          addToast('Discord account successfully unlinked from BuddyCraft.', 'info');
        }
      } else {
        // Simulate linking by generating standard Discord tag
        const res = await fetch('/api/auth/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: 'link-discord',
            discordUsername: `${user.username}#${Math.floor(1000 + Math.random() * 9000)}`,
            discordId: `ds-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
            discordAvatar: `https://picsum.photos/seed/${user.username}/150/150`,
          }),
        });
        const data = await res.json();
        if (res.ok && data.user) {
          updateUser(data.user);
          addToast('Discord account linked successfully!', 'success');
        }
      }
    } catch (_) {
      addToast('Discord action network error.', 'error');
    }
  };

  // Extract totals from order history
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');

  let activeRanks = completedOrders
    .flatMap((o) => o.items)
    .filter((item) => item.category === 'ranks')
    .map((item) => item.productName);

  // Remove duplicates
  activeRanks = Array.from(new Set(activeRanks));

  const totalCratesPurchased = completedOrders
    .flatMap((o) => o.items)
    .filter((item) => item.category === 'crates')
    .reduce((sum, item) => sum + item.quantity, 0);

  const totalCoinsPurchased = completedOrders
    .flatMap((o) => o.items)
    .filter((item) => item.category === 'coins')
    .reduce((sum, item) => sum + item.quantity * (item.productName.toLowerCase().includes('500') ? 500 : item.productName.toLowerCase().includes('1000') ? 1000 : item.productName.toLowerCase().includes('2500') ? 2500 : item.productName.toLowerCase().includes('5000') ? 5000 : 10000), 0);

  if (!user) {
    return (
      <div className="h-screen bg-[#0f0a1c] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm text-slate-400">Pumping user statistics dashboard...</p>
      </div>
    );
  }

  // Safe Minecraft avatar
  const avatarUrl = user.discordAvatar || `https://minotar.net/helm/${user.username || 'Steve'}/128.png`;

  return (
    <div className="flex flex-col min-h-screen bg-[#0d081a] text-slate-100" id="user-dashboard-view">
      {/* Glow */}
      <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-purple-950/15 to-transparent pointer-events-none" />

      {/* Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={openAuth} />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* LEFT COLUMN: MINI USER CARD & MENU NAV */}
          <div className="space-y-6">
            {/* User Profile Card */}
            <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="relative inline-block mb-4">
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="w-20 h-20 rounded-2xl mx-auto border border-purple-500/20 shadow-xl bg-purple-950 object-cover"
                />
                <span className="absolute -bottom-1.5 -right-1.5 bg-purple-600 text-white border border-[#140e2a] rounded-lg text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5">
                  {user.isAdmin ? 'Staff Admin' : 'Vip Player'}
                </span>
              </div>

              <div>
                <h3 className="text-base font-black text-slate-100 leading-tight">{user.username}</h3>
                <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{user.email}</span>
              </div>

              {/* Minecraft Status badge */}
              <div className="p-3 bg-black/30 rounded-xl border border-purple-500/5 mt-5 flex items-center justify-between text-left">
                <div>
                  <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold font-mono">Minecraft IGN</span>
                  <span className="text-xs font-semibold text-slate-300">{user.username}</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              </div>
            </div>

            {/* Navigation tabs */}
            <div className="flex flex-col gap-1 rounded-2xl bg-[#140e2a] border border-purple-500/10 p-2 text-left">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-500'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                id="tab-btn-overview"
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                Purchases Overview
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-500'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                id="tab-btn-settings"
              >
                <Settings className="w-4.5 h-4.5" />
                Account Settings
              </button>

              <button
                onClick={logout}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-400 hover:bg-rose-500/5 transition-colors text-left cursor-pointer"
                id="tab-btn-logout"
              >
                <LogOut className="w-4.5 h-4.5" />
                Logout Account
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: CORE DASHBOARD CONTENT */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-8"
                  id="tab-content-overview"
                >
                  {/* Grid cards statistics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    {/* Rank */}
                    <div className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">My Active Ranks</span>
                        <span className="block text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300 mt-1 uppercase">
                          {activeRanks.length > 0 ? activeRanks.join(', ') : 'No Ranks'}
                        </span>
                      </div>
                      <Award className="w-8 h-8 text-purple-400 opacity-80" />
                    </div>

                    {/* Crates */}
                    <div className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Crate Keys Claimed</span>
                        <span className="block text-xl font-black text-white mt-1">
                          {totalCratesPurchased} Keys
                        </span>
                      </div>
                      <Key className="w-8 h-8 text-cyan-400 opacity-80" />
                    </div>

                    {/* Coins */}
                    <div className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10 flex items-center justify-between">
                      <div>
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Total Coins Pushed</span>
                        <span className="block text-xl font-black text-white mt-1">
                          {totalCoinsPurchased} Coins
                        </span>
                      </div>
                      <Coins className="w-8 h-8 text-amber-400 opacity-80" />
                    </div>
                  </div>

                  {/* Transaction Orders history */}
                  <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 text-left">
                    <div className="flex items-center gap-2 border-b border-purple-500/5 pb-4 mb-6">
                      <ShoppingBag className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Purchase & Billing History</h3>
                    </div>

                    {isLoadingOrders ? (
                      <div className="py-12 text-center space-y-2">
                        <RefreshCw className="w-6 h-6 text-purple-500 animate-spin mx-auto" />
                        <span className="block text-xs text-slate-500">Querying transaction log databases...</span>
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="py-16 text-center text-slate-500 space-y-2" id="empty-orders-history">
                        <ShoppingBag className="w-8 h-8 text-slate-700 mx-auto" />
                        <p className="text-xs font-semibold">You haven&apos;t placed any orders yet.</p>
                        <p className="text-[11px] text-slate-600">All successful server billing checkouts are logged here.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto" id="orders-history-table">
                        <table className="w-full text-xs font-semibold">
                          <thead>
                            <tr className="border-b border-purple-500/5 text-slate-500 text-[10px] uppercase font-bold tracking-wider text-left">
                              <th className="pb-3 pr-4">Order ID</th>
                              <th className="pb-3 pr-4">Items Summary</th>
                              <th className="pb-3 pr-4">Date Placed</th>
                              <th className="pb-3 pr-4">Total Price</th>
                              <th className="pb-3 pr-4 text-center">Payment Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-purple-500/5 font-mono text-slate-300">
                            {orders.map((o) => (
                              <tr key={o.id} className="hover:bg-purple-500/5">
                                <td className="py-4.5 pr-4 text-cyan-400 font-bold">{o.id}</td>
                                <td className="py-4.5 pr-4 font-sans max-w-[200px] truncate text-slate-200" title={o.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}>
                                  {o.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}
                                </td>
                                <td className="py-4.5 pr-4 text-slate-400">
                                  {new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </td>
                                <td className="py-4.5 pr-4 font-bold text-slate-200">₹{o.total}</td>
                                <td className="py-4.5 text-center font-sans">
                                  <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                    o.status === 'COMPLETED'
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                      : o.status === 'PENDING'
                                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      : o.status === 'REFUNDED'
                                      ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}>
                                    {o.status === 'COMPLETED' ? 'Verified' : o.status === 'CANCELLED' ? 'Rejected' : o.status === 'PENDING' ? 'Pending' : o.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* TAB 2: SETTINGS */}
              {activeTab === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  id="tab-content-settings"
                >
                  {/* Left block: change IGN & Discord */}
                  <div className="space-y-6 text-left">
                    {/* Link Minecraft IGN */}
                    <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 space-y-4">
                      <div className="flex items-center gap-2 border-b border-purple-500/5 pb-3">
                        <UserIcon className="w-5 h-5 text-purple-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Sync Minecraft IGN</h3>
                      </div>
                      <form onSubmit={handleUpdateMinecraftName} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Minecraft Character Name</label>
                          <input
                            type="text"
                            required
                            placeholder="IGN Username (e.g. MinecraftSteve)"
                            value={minecraftName}
                            onChange={(e) => setMinecraftName(e.target.value)}
                            className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSavingName}
                          className="px-5 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/35 hover:bg-purple-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                        >
                          {isSavingName ? 'Linking character...' : 'Update IGN Name'}
                        </button>
                      </form>
                    </div>

                    {/* Discord Link */}
                    <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 space-y-4">
                      <div className="flex items-center gap-2 border-b border-purple-500/5 pb-3">
                        <svg className="w-5 h-5 fill-purple-400" viewBox="0 0 24 24">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                        </svg>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Discord Social Linkage</h3>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Link your Discord account to automatically claim custom Discord Rank Roles matching your BuddyCraft Store ranks.
                      </p>

                      {user.discordId ? (
                        <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-emerald-300 flex items-center justify-between">
                          <div>
                            <span className="block text-[8px] font-mono text-emerald-400">Linked Discord Account</span>
                            <span className="text-xs font-bold">{user.discordUsername}</span>
                          </div>
                          <button
                            onClick={handleToggleDiscordLinkage}
                            className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Unlink
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleToggleDiscordLinkage}
                          className="w-full py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          Link Discord Account
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right block: password reset */}
                  <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 text-left h-fit">
                    <div className="flex items-center gap-2 border-b border-purple-500/5 pb-3 mb-4">
                      <KeyRound className="w-5 h-5 text-purple-400" />
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">Change Account Password</h3>
                    </div>

                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Current Password</label>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={oldPassword}
                          onChange={(e) => setOldPassword(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">New Password</label>
                        <input
                          type="password"
                          required
                          placeholder="At least 6 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-200"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingPassword}
                        className="px-5 py-2.5 rounded-xl bg-purple-600/20 border border-purple-500/35 hover:bg-purple-600 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        {isSavingPassword ? 'Saving password...' : 'Change Password'}
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0c0717] border-t border-purple-500/10 py-12 text-slate-500 text-xs mt-16 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="block text-sm font-black text-white uppercase tracking-wider">
              {settings.storeName}
            </span>
            <p className="mt-1">
              BuddyCraft Store is not affiliated with, nor endorsed by Mojang AB or Microsoft.
            </p>
          </div>
          <div className="flex items-center gap-6 font-semibold">
            <Link href="/" className="hover:text-slate-300 transition-colors">Home Page</Link>
            <Link href="/store" className="hover:text-slate-300 transition-colors">Server Store</Link>
            <span className="text-slate-700">|</span>
            <span className="font-normal">&copy; 2026 BuddyCraft Server Network.</span>
          </div>
        </div>
      </footer>

      {/* Slide draws */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onOpenAuth={openAuth} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialTab={authTab} />
    </div>
  );
}
