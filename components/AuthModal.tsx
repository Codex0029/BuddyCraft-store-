'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, UserPlus, HelpCircle, Lock, Mail, User as UserIcon, Shield, Sparkles, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'login' | 'register' | 'forgot';
}

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }: AuthModalProps) {
  const { login, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'forgot' | 'discord-mock'>((initialTab as any) || 'login');

  // Input fields
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simulated Discord input fields
  const [discordUserTag, setDiscordUserTag] = useState('');
  const [discordGameName, setDiscordGameName] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please enter both your email and password.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.user) {
        login(data.user, data.token);
        onClose();
        resetForm();
      } else {
        addToast(data.error || 'Login failed.', 'error');
      }
    } catch (_) {
      setIsLoading(false);
      addToast('An error occurred during authentication.', 'error');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !username || !password) {
      addToast('Please fill out all registration fields.', 'error');
      return;
    }

    if (password.length < 6) {
      addToast('Your password must be at least 6 characters long.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (res.ok && data.user) {
        login(data.user, data.token);
        onClose();
        resetForm();
      } else {
        addToast(data.error || 'Registration failed.', 'error');
      }
    } catch (_) {
      setIsLoading(false);
      addToast('An error occurred during registration.', 'error');
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      addToast('Please enter your email address.', 'error');
      return;
    }

    setIsLoading(true);
    // Simulate forgot password success
    setTimeout(() => {
      setIsLoading(false);
      addToast(`Password reset link successfully sent to ${email}!`, 'success');
      setActiveTab('login');
    }, 1500);
  };

  const handleDiscordAuthorizationMock = async (e: React.FormEvent) => {
    e.preventDefault();
    const gameUsername = discordGameName.trim() || 'AlexPlayer';
    const discTag = discordUserTag.trim() || 'AlexDiscord#4321';

    setIsLoading(true);
    addToast('Contacting Discord OAuth Service...', 'info');

    setTimeout(async () => {
      try {
        // Register or login a user who is linked to discord
        const emailAddress = `${gameUsername.toLowerCase()}@discord-mock.net`;

        // Check if user already exists
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailAddress, password: 'discord_secure_auth_123' }),
        });

        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.user) {
          login(loginData.user, loginData.token);
          addToast('Logged in via Discord account!', 'success');
        } else {
          // If login failed (not exists), register him with Discord parameters!
          const regRes = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: emailAddress,
              username: gameUsername,
              password: 'discord_secure_auth_123',
            }),
          });

          const regData = await regRes.json();

          if (regRes.ok && regData.user) {
            // Update the Discord properties on user!
            const updateRes = await fetch('/api/auth/me', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${regData.token}`,
              },
              body: JSON.stringify({
                action: 'link-discord',
                discordUsername: discTag,
                discordId: `ds-${Math.floor(100000000000000 + Math.random() * 900000000000000)}`,
                discordAvatar: `https://picsum.photos/seed/${gameUsername}/150/150`,
              }),
            });

            const updateData = await updateRes.json();
            if (updateRes.ok && updateData.user) {
              login(updateData.user, regData.token);
              addToast('Discord authentication complete! Account registered.', 'success');
            } else {
              login(regData.user, regData.token);
            }
          } else {
            addToast(regData.error || 'Discord OAuth linkage failed.', 'error');
          }
        }

        setIsLoading(false);
        onClose();
        resetForm();
      } catch (err: any) {
        setIsLoading(false);
        addToast('Discord authentication failed.', 'error');
      }
    }, 2000);
  };

  const resetForm = () => {
    setEmail('');
    setUsername('');
    setPassword('');
    setDiscordUserTag('');
    setDiscordGameName('');
  };

  const setTabWithReset = (tab: any) => {
    resetForm();
    setActiveTab(tab);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
            id="auth-backdrop"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-[#110b21] border border-purple-500/10 rounded-2xl shadow-2xl z-50 overflow-hidden"
            id="auth-modal"
          >
            {/* Corner Decorative Glowing elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-purple-500/5 relative z-10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h2 className="text-base font-black tracking-wider uppercase text-white">
                  {activeTab === 'login' && 'Sign In'}
                  {activeTab === 'register' && 'Create Account'}
                  {activeTab === 'forgot' && 'Reset Password'}
                  {activeTab === 'discord-mock' && 'Discord Linkage'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                id="close-auth-modal-btn"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Tabs for Login / Register */}
            {(activeTab === 'login' || activeTab === 'register') && (
              <div className="grid grid-cols-2 bg-black/40 border border-purple-500/5 p-1 rounded-xl mb-6 relative z-10">
                <button
                  onClick={() => setTabWithReset('login')}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-purple-600/30 text-white border border-purple-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setTabWithReset('register')}
                  className={`py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-purple-600/30 text-white border border-purple-500/20'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Register
                </button>
              </div>
            )}

            {/* Forms Container */}
            <div className="relative z-10 text-left">
              {/* LOGIN TAB */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="steve@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Password</label>
                      <button
                        type="button"
                        onClick={() => setTabWithReset('forgot')}
                        className="text-[10px] uppercase font-bold tracking-widest text-purple-400 hover:text-purple-300 font-mono cursor-pointer"
                      >
                        Forgot?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-950/40 hover:shadow-purple-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? 'Signing In...' : 'Login to Store'}
                  </button>

                  {/* Discord Login Button */}
                  <div className="relative flex py-2.5 items-center">
                    <div className="flex-grow border-t border-purple-500/5"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold font-mono uppercase text-slate-500">Or Login with Socials</span>
                    <div className="flex-grow border-t border-purple-500/5"></div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('discord-mock')}
                    className="w-full py-3 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                    </svg>
                    Simulated Discord Login
                  </button>
                </form>
              )}

              {/* REGISTER TAB */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="steve@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Minecraft Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        placeholder="Minecraft In-Game Name (IGN)"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                    <span className="block text-[9px] text-slate-500 leading-normal">
                      Important: Provide your exact Minecraft IGN. All ranks and keys will be pushed to this specific username inside the server!
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Create Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-purple-950/40 hover:shadow-purple-500/25 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? 'Creating Account...' : 'Register Account'}
                  </button>
                </form>
              )}

              {/* FORGOT PASSWORD TAB */}
              {activeTab === 'forgot' && (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-xs text-slate-400 leading-relaxed mb-1">
                    Enter your email below. We&apos;ll send a password recovery validation token directly to your inbox.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="steve@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer"
                  >
                    {isLoading ? 'Sending Reset Link...' : 'Request Reset Link'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTabWithReset('login')}
                    className="text-xs block text-center w-full text-purple-400 hover:text-purple-300 font-semibold cursor-pointer font-mono"
                  >
                    Cancel and Back to Login
                  </button>
                </form>
              )}

              {/* DISCORD MOCK AUTHORIZATION TAB */}
              {activeTab === 'discord-mock' && (
                <form onSubmit={handleDiscordAuthorizationMock} className="space-y-4">
                  <div className="p-4 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 fill-[#5865F2]" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.094 13.094 0 0 1-1.873-.894.077.077 0 0 1-.008-.128c.126-.093.252-.19.372-.287a.075.075 0 0 1 .077-.011c3.92 1.793 8.18 1.793 12.061 0a.073.073 0 0 1 .078.009c.12.099.246.195.373.289a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 1-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.156 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.156-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.156 2.418z" />
                      </svg>
                      <span className="text-xs font-bold text-slate-100 uppercase font-mono">Discord Authorization Gate</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      We&apos;ve simulated a premium Discord OAuth integration! Enter your preferred gaming handles to test how the server syncs characters.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#5865F2] font-mono">Discord Username Tag</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SteveDiscord#4321"
                      value={discordUserTag}
                      onChange={(e) => setDiscordUserTag(e.target.value)}
                      className="w-full bg-[#120c24] border border-[#5865F2]/30 focus:border-[#5865F2]/70 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-[#5865F2] font-mono">Minecraft IGN</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MinecraftSteve"
                      value={discordGameName}
                      onChange={(e) => setDiscordGameName(e.target.value)}
                      className="w-full bg-[#120c24] border border-[#5865F2]/30 focus:border-[#5865F2]/70 outline-none rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-semibold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-[#5865F2]/20 flex items-center justify-center gap-1.5"
                  >
                    {isLoading ? 'Authorizing...' : 'Authorize Discord App'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('login')}
                    className="text-xs block text-center w-full text-slate-400 hover:text-white font-semibold cursor-pointer font-mono"
                  >
                    Go Back
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
