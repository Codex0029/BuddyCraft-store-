'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingCart, Copy, Check, LogIn, LogOut, LayoutDashboard, User as UserIcon, Shield, Server, Menu, X, Trash2, ChevronRight, Gift } from 'lucide-react';

interface HeaderProps {
  onOpenCart?: () => void;
  onOpenAuth?: (tab?: 'login' | 'register') => void;
}

export default function Header({ onOpenCart, onOpenAuth }: HeaderProps) {
  const { user, token, logout, cart, settings, addToast } = useApp();
  const pathname = usePathname();
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(settings.serverIp);
    setCopied(true);
    addToast('Server IP copied to clipboard! Open Minecraft and connect!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Safe fallback avatar using official minotar helm API
  const avatarUrl = user?.discordAvatar || `https://minotar.net/helm/${user?.username || 'Steve'}/64.png`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-orange-500/10 bg-[#100b08]/80 backdrop-blur-md" id="store-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group" id="brand-logo-link">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-400 p-[1.5px] shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-[#120c18] rounded-[10px] flex items-center justify-center text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300 tracking-tighter">
                BC
              </div>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">Buddy</span>
                <span className="text-slate-200">Craft</span>
              </span>
              <span className="block text-[10px] uppercase tracking-[0.2em] text-orange-400 font-bold leading-none font-mono">
                Store
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                pathname === '/'
                  ? 'text-orange-400 bg-orange-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              id="nav-home"
            >
              Home
            </Link>
            <Link
              href="/store"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                pathname === '/store'
                  ? 'text-orange-400 bg-orange-500/10'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              id="nav-store"
            >
              Store
            </Link>
          </nav>
        </div>

        {/* Server IP Copy Widget & CTA Controls */}
        <div className="flex items-center gap-3">
          {/* IP Widget */}
          <div
            onClick={handleCopyIp}
            className="hidden lg:flex items-center gap-3 px-4 py-2 rounded-xl bg-[#19110d] border border-orange-500/10 hover:border-orange-500/30 hover:bg-[#201510] transition-all duration-300 cursor-pointer shadow-inner group"
            title="Click to copy server IP"
            id="server-ip-widget"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse relative">
              <span className="absolute -inset-1 rounded-full bg-orange-500/50 animate-ping"></span>
            </div>
            <div className="text-left font-mono">
              <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none">
                Minecraft server IP
              </span>
              <span className="text-xs font-semibold text-slate-200 group-hover:text-orange-400 transition-colors">
                {settings.serverIp}
              </span>
            </div>
            <div className="text-slate-400 group-hover:text-orange-400 transition-colors">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </div>
          </div>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="p-3 rounded-xl bg-[#19110d] border border-orange-500/10 hover:border-orange-500/30 text-slate-300 hover:text-orange-400 transition-all duration-300 relative cursor-pointer"
            id="header-cart-btn"
          >
            <ShoppingCart className="w-5 h-5" />
            <AnimatePresence>
              {totalCartItems > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-1.5 -right-1.5 w-5.5 h-5.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg border border-[#100b08]"
                >
                  {totalCartItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* User Section */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 pl-2.5 pr-3 py-1.5 rounded-xl bg-[#19110d] border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 cursor-pointer"
                id="header-user-btn"
              >
                {/* 3D-Helm or discord render */}
                <img
                  src={avatarUrl}
                  alt={user.username}
                  className="w-7 h-7 rounded-lg bg-orange-950 border border-orange-500/20 object-cover"
                />
                <span className="hidden sm:inline text-sm font-semibold text-slate-200 max-w-[100px] truncate">
                  {user.username}
                </span>
              </button>

              <AnimatePresence>
                {userDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)}></div>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2.5 w-56 rounded-xl border border-orange-500/10 bg-[#120c18] p-2 shadow-2xl backdrop-blur-xl z-50"
                      id="user-dropdown-menu"
                    >
                      <div className="px-3 py-2 border-b border-orange-500/5 mb-1 text-left">
                        <span className="block text-xs text-slate-400 font-mono">Connected Gamer</span>
                        <span className="block text-sm font-bold text-slate-100 truncate">{user.username}</span>
                      </div>

                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-semibold text-orange-400 hover:bg-orange-500/10 transition-colors text-left"
                          onClick={() => setUserDropdownOpen(false)}
                          id="nav-admin-panel"
                        >
                          <Shield className="w-4.5 h-4.5 text-orange-400" />
                          Admin Dashboard
                        </Link>
                      )}

                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-semibold text-slate-300 hover:text-white hover:bg-orange-500/10 transition-colors text-left"
                        onClick={() => setUserDropdownOpen(false)}
                        id="nav-user-dashboard"
                      >
                        <LayoutDashboard className="w-4.5 h-4.5 text-orange-400" />
                        My Dashboard
                      </Link>

                      <button
                        onClick={() => {
                          setUserDropdownOpen(false);
                          logout();
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                        id="header-logout-btn"
                      >
                        <LogOut className="w-4.5 h-4.5 text-rose-400" />
                        Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={() => onOpenAuth?.('login')}
              className="px-4.5 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-lg shadow-orange-950/40 hover:shadow-orange-500/25 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
              id="header-login-btn"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}

          {/* Mobile Menu Icon */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-[#19110d] border border-orange-500/10 text-slate-300 hover:text-white md:hidden cursor-pointer"
            id="mobile-menu-toggle"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Slide-down */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-orange-500/10 bg-[#120c18] px-4 py-5 space-y-4"
            id="mobile-nav-menu"
          >
            <div className="flex flex-col gap-1.5">
              <Link
                href="/"
                className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  pathname === '/' ? 'text-orange-400 bg-orange-500/5 border-l-2 border-orange-500' : 'text-slate-300 hover:bg-white/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/store"
                className={`px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  pathname === '/store' ? 'text-orange-400 bg-orange-500/5 border-l-2 border-orange-500' : 'text-slate-300 hover:bg-white/5'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Store
              </Link>
            </div>

            {/* Mobile Connection Widget */}
            <div
              onClick={handleCopyIp}
              className="flex items-center justify-between p-4 rounded-xl bg-[#19110d] border border-orange-500/10 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse relative">
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/50 animate-ping"></span>
                </div>
                <div className="font-mono text-left">
                  <span className="block text-[9px] uppercase tracking-widest text-slate-400 font-bold leading-none">
                    Minecraft Server IP
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {settings.serverIp}
                  </span>
                </div>
              </div>
              <div className="text-slate-400">
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
