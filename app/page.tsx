'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { motion } from 'motion/react';
import { Shield, Sparkles, Sword, Trophy, Zap, Copy, Check, Users, Server, Award, Heart, MessageSquare, ArrowRight, Play, Compass } from 'lucide-react';

export default function HomePage() {
  const { settings, addToast } = useApp();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [copied, setCopied] = useState(false);

  const handleCopyIp = () => {
    navigator.clipboard.writeText(settings.serverIp);
    setCopied(true);
    addToast('Server IP copied to clipboard! Open Minecraft and connect!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const openAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setIsAuthOpen(true);
  };

  // Features cards
  const features = [
    {
      title: 'Competitive Factions',
      desc: 'Build massive kingdoms, form diplomatic alliances, raid enemy bases using custom TNT cannons, and conquer the war zone.',
      icon: Sword,
      color: 'text-orange-400',
      bg: 'bg-orange-500/5 border-orange-500/10',
    },
    {
      title: 'Custom Survival RPG',
      desc: 'Experience classic survival enhanced with skills, player-driven shop markets, custom quests, land claiming, and leveling dungeons.',
      icon: Compass,
      color: 'text-amber-400',
      bg: 'bg-amber-500/5 border-amber-500/10',
    },
    {
      title: 'SkyBlock Realms',
      desc: 'Start on a floating island in the sky, expand your automation engines, compile raw minion generators, and compete in the island top lists.',
      icon: Shield,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/5 border-yellow-500/10',
    },
    {
      title: 'Dynamic Minigames',
      desc: 'Quick BedWars, SkyWars, and Duels lobbies. Zero ping, balanced gameplay, custom kits, cosmetics, and seasonal leaderboards.',
      icon: Trophy,
      color: 'text-rose-400',
      bg: 'bg-rose-500/5 border-rose-500/10',
    },
  ];

  // Testimonials
  const testimonials = [
    {
      author: 'xX_GamerSteve_Xx',
      role: 'Noble Player',
      text: 'The best server community I have ever played! The staff are incredibly helpful, and the custom RPG quests on Survival keep the gameplay super fresh and engaging. The delivery of noble rank features was instant!',
      avatar: 'https://minotar.net/helm/Steve/64.png',
    },
    {
      author: 'Notch_Lover',
      role: 'Legend Tier Patron',
      text: 'Legend rank is absolutely worth it! Rainbow chat prefixes and server full join prioritizations make gameplay flawless. BuddyCraft has perfect ping, zero lag, and balanced ranks.',
      avatar: 'https://minotar.net/helm/Notch/64.png',
    },
    {
      author: 'Valkyrie_MC',
      role: 'GOD Player',
      text: 'Universe crates are packed with stellar resources. I opened 5 keys and unlocked legendary gear and direct survival multipliers. Outstanding store with secured checkout gateway options!',
      avatar: 'https://minotar.net/helm/Alex/64.png',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden" id="home-view">
      {/* Background Animated Atmosphere */}
      <div className="absolute top-0 left-0 w-full h-[800px] bg-gradient-to-b from-orange-950/25 via-amber-950/5 to-transparent pointer-events-none z-0" />
      <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] bg-yellow-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={openAuth} />

      {/* Core Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28 flex flex-col items-center text-center">
        {/* Server Announcement Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
          <span className="text-[11px] uppercase tracking-[0.15em] font-extrabold text-orange-300 font-mono">
            SUMMER TOURNAMENT SEASON LIVE
          </span>
        </motion.div>

        {/* Hero Branding Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7.5xl font-black tracking-tight leading-[1.05] text-white max-w-4xl"
        >
          Unleash Your Ultimate{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-300">
            Minecraft Experience
          </span>
        </motion.h1>

        {/* Hero Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-base sm:text-lg text-slate-400 max-w-2xl mt-6 leading-relaxed"
        >
          Join <strong>BuddyCraft</strong>, a custom survival, competitive factions, and skyblock realm packed with quests, leaderboards, and thousands of friendly players. Power up your game with rank perks, cosmetics, and crate keys!
        </motion.p>

        {/* IP Widget & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto"
        >
          {/* Main Action buttons */}
          <Link
            href="/store"
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-orange-600 via-orange-500 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-orange-950/40 hover:shadow-orange-500/30 transition-all duration-300 group cursor-pointer"
            id="hero-visit-store-btn"
          >
            Visit Server Store
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Minecraft Connection CTA */}
          <div
            onClick={handleCopyIp}
            className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#19110d] border border-orange-500/15 hover:border-orange-500/40 hover:bg-[#221611] transition-all duration-300 cursor-pointer flex items-center justify-between sm:justify-start gap-4 shadow-inner group"
            title="Click to Copy Server IP"
            id="hero-copy-ip-btn"
          >
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-orange-400" />
              <div className="text-left font-mono">
                <span className="block text-[8px] uppercase tracking-wider text-slate-500 font-bold leading-none">
                  Server Connection Address
                </span>
                <span className="text-xs font-black text-slate-200">
                  {settings.serverIp}
                </span>
              </div>
            </div>
            <div className="text-slate-500 group-hover:text-orange-400 transition-colors pl-2">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 rounded-2xl bg-[#19110d]/60 border border-orange-500/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Border shine */}
          <div className="absolute top-0 left-0 w-full h-[1.5px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"></div>

          {[
            { label: 'Active Server Players', val: '1,428+', note: 'Online Right Now', icon: Users, color: 'text-emerald-400' },
            { label: 'Registered Accounts', val: '15,840+', note: 'Growing Community', icon: Award, color: 'text-orange-400' },
            { label: 'Global Server Uptime', val: '99.9%', note: 'Lag-Free Node Host', icon: Zap, color: 'text-amber-400' },
            { label: 'Player Satisfaction', val: '100%', note: 'Premium Active Support', icon: Heart, color: 'text-rose-400' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-3">
              <div className="flex justify-center mb-1.5">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <span className="block text-xl sm:text-3.5xl font-black text-white leading-none font-sans">
                {stat.val}
              </span>
              <span className="block text-[11px] font-bold text-slate-300 uppercase mt-1 font-mono">
                {stat.label}
              </span>
              <span className="block text-[9px] text-slate-500 mt-0.5 leading-none">
                {stat.note}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Server Realms Highlight */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-orange-500/5">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4.5xl font-black text-white uppercase tracking-tight">
            Our Minecraft Realms
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4">
            BuddyCraft hosts fully bespoke customized game types featuring deep mechanics, reliable balances, and weekly leaderboards. Join play today!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border ${feat.bg} flex flex-col text-left justify-between hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden`}
            >
              {/* Corner decorative item */}
              <div className="absolute -top-3 -right-3 w-16 h-16 bg-white/5 rounded-full rotate-45 group-hover:bg-white/10 transition-colors" />

              <div>
                <div className="mb-4">
                  <feat.icon className={`w-8 h-8 ${feat.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-white transition-colors">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed">
                  {feat.desc}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-400 group-hover:text-orange-300 transition-colors font-mono">
                Join {settings.serverIp}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 border-t border-orange-500/5 bg-black/10 rounded-3xl mb-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-2xl sm:text-4.5xl font-black text-white uppercase tracking-tight">
            Loved By Gamers
          </h2>
          <p className="text-sm sm:text-base text-slate-400 mt-4">
            Hear from our veteran community players who log in every single day to expand their realms on BuddyCraft.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((test, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#19110d]/40 border border-orange-500/10 flex flex-col justify-between text-left relative"
            >
              <p className="text-sm text-slate-300 italic leading-relaxed">
                &ldquo;{test.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-orange-500/5">
                <img
                  src={test.avatar}
                  alt={test.author}
                  className="w-9 h-9 rounded-lg bg-orange-950 border border-orange-500/20"
                />
                <div>
                  <span className="block text-sm font-bold text-slate-100">{test.author}</span>
                  <span className="block text-[10px] uppercase font-bold text-orange-400 font-mono tracking-wider leading-none">
                    {test.role}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Discord Footer Invitation Call to action */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 mb-24 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[#1c140d]/80 via-[#130c0c]/90 to-black/80 border border-orange-500/15 relative overflow-hidden shadow-2xl">
          {/* Neon lights */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-6 relative z-10">
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight uppercase">
              Join Our{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">
                Discord Community
              </span>
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Have questions or want to collaborate with other server factions? Join our Discord server to connect with 15k+ members, claim daily giveaways, chat with staff, and receive coupon announcements!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href={settings.discordInvite}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                Join Discord Server
                <MessageSquare className="w-4 h-4" />
              </a>
              <Link
                href="/store"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-200 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-orange-500/20 transition-all cursor-pointer"
              >
                Go to Store
                <Compass className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="relative z-10 bg-[#0a0604] border-t border-orange-500/10 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <span className="block text-sm font-black text-white uppercase tracking-wider">
              {settings.storeName}
            </span>
            <p className="mt-1">
              BuddyCraft Store is not affiliated with, nor endorsed by Mojang AB or Microsoft.
            </p>
            <p className="mt-1 text-[11px]">
              Minecraft is copyright Mojang Synergies AB. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <Link href="/store" className="hover:text-slate-300 transition-colors">Ranks Store</Link>
            <a href={settings.discordInvite} className="hover:text-slate-300 transition-colors" target="_blank" rel="noreferrer">Help Support</a>
            <span className="text-slate-700">|</span>
            <span className="font-normal">&copy; 2026 BuddyCraft Server Network.</span>
          </div>
        </div>
      </footer>

      {/* Cart & Auth slide widgets */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onOpenAuth={openAuth} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialTab={authTab} />
    </div>
  );
}
