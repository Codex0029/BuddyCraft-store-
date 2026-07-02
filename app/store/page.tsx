'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import CartDrawer from '@/components/CartDrawer';
import AuthModal from '@/components/AuthModal';
import { useApp } from '@/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Crown, Zap, Flame, Sparkles, Coins, Orbit, Heart, Rocket, Sparkle, Search, ChevronRight, HelpCircle, ArrowUpDown, Filter, Mail, MessageSquare } from 'lucide-react';

// Product type definition
interface Product {
  id: string;
  name: string;
  category: 'ranks' | 'crates' | 'coins';
  price: number;
  description: string;
  features: string[];
  icon: string;
  gradient: string;
  bonusCoins?: number;
  order: number;
  visible: boolean;
}

export default function StorePage() {
  const { addToCart, settings } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // States
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');

  // Filter/Sort States
  const [selectedCategory, setSelectedCategory] = useState<'ranks' | 'crates' | 'coins'>('ranks');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  // Load products from API
  useEffect(() => {
    async function fetchProducts() {
      setIsLoadingProducts(true);
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
        }
      } catch (err) {
        console.error('Failed to load store products:', err);
      }
      setIsLoadingProducts(false);
    }
    fetchProducts();
  }, []);

  const openAuth = (tab: 'login' | 'register' = 'login') => {
    setAuthTab(tab);
    setIsAuthOpen(true);
  };

  // Helper to map icon names to actual Lucide components
  const renderProductIcon = (iconName: string, category: string) => {
    const classVal = "w-6 h-6 text-white";
    switch (iconName) {
      case 'Shield': return <Shield className={classVal} />;
      case 'Crown': return <Crown className={classVal} />;
      case 'Zap': return <Zap className={classVal} />;
      case 'Flame': return <Flame className={classVal} />;
      case 'Sparkles': return <Sparkles className={classVal} />;
      case 'Coins': return <Coins className={classVal} />;
      case 'Orbit': return <Orbit className={classVal} />;
      case 'Heart': return <Heart className={classVal} />;
      case 'Rocket': return <Rocket className={classVal} />;
      case 'Sparkle': return <Sparkle className={classVal} />;
      default:
        return category === 'coins' ? <Coins className={classVal} /> : <Sparkles className={classVal} />;
    }
  };

  // Filter and Sort logic
  const filteredProducts = products
    .filter((p) => p.category === selectedCategory && p.visible)
    .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return (a.order || 0) - (b.order || 0);
    });

  // FAQ Items
  const faqItems = [
    {
      q: 'How long does it take for my purchase to be delivered in-game?',
      a: 'Ranks, crate keys, and coin packages are delivered almost instantly. On rare occasions, Minecraft command queue deliveries can take 5 to 15 minutes depending on Mojang server congestion. Make sure you are logged onto the server when checking out!',
    },
    {
      q: 'What payment methods do you support?',
      a: 'We support fully encrypted sandbox configurations for Credit Cards (Stripe), PayPal Express Checkouts, Razorpay gateways, and decentralized Crypto (BTC, ETH, LTC) transfers.',
    },
    {
      q: 'Can I purchase a rank upgrade later?',
      a: 'Yes, absolutely! Ranks are modular. If you have NOBLE and want to upgrade to PRIME, you can purchase it. All items in our checkout scale dynamically.',
    },
    {
      q: 'What should I do if my purchase was not received?',
      a: 'If you encounter any delivery issues, simply contact our dedicated support team at support@buddycraft.net or open a support ticket on our official Discord server. We hold complete transaction audit histories and resolve all tickets within 12 hours.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen relative" id="store-view">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-orange-950/20 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <Header onOpenCart={() => setIsCartOpen(true)} onOpenAuth={openAuth} />

      {/* Store Billboard Banner */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-8 text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-orange-950/40 via-slate-900/40 to-amber-950/40 border border-orange-500/10 backdrop-blur-md shadow-2xl relative overflow-hidden">
          {/* Subtle neon dust effect */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(249,115,22,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(249,115,22,0.05)_1px,transparent_1px)] bg-[size:14px_24px]" />

          <div className="max-w-xl mx-auto space-y-4 relative z-10">
            <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-tight">
              BuddyCraft Store
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Elevate your server presence. Unlock premium cosmetic titles, instant command packages, treasure crate keys, and valuable coin bundles.
            </p>
          </div>
        </div>
      </section>

      {/* Main Filter, Search and Category Rail */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#19110d]/55 border border-orange-500/10 backdrop-blur-sm">
          {/* Categories Tab Selector */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto" id="store-category-tabs">
            {[
              { id: 'ranks', label: 'SERVER RANKS', desc: 'Perm ranks with custom kits & titles' },
              { id: 'crates', label: 'CRATE KEYS', desc: 'Cosmic lootboxes & items' },
              { id: 'coins', label: 'COIN PACKAGES', desc: 'Server booster tokens' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-5 py-3 rounded-xl border text-left cursor-pointer transition-all duration-300 w-full sm:w-auto ${
                  selectedCategory === tab.id
                    ? 'bg-orange-500/15 border-orange-500 text-white shadow-lg shadow-orange-500/5'
                    : 'bg-black/20 border-orange-500/5 text-slate-400 hover:bg-orange-500/5 hover:text-slate-200'
                }`}
              >
                <span className="block text-xs font-black tracking-wider uppercase">{tab.label}</span>
                <span className="hidden sm:block text-[9px] text-slate-500 mt-0.5 font-semibold font-mono leading-none">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Search and Sorting controls */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-orange-500/15 focus:border-orange-500/40 outline-none rounded-xl pl-9 pr-4 py-2.5 text-xs font-semibold text-slate-200 placeholder-slate-600"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-black/40 border border-orange-500/15 focus:border-orange-500/40 outline-none rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-400 cursor-pointer"
              >
                <option value="default">Sort: Default Order</option>
                <option value="price-asc">Sort: Price (Low to High)</option>
                <option value="price-desc">Sort: Price (High to Low)</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Products Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {isLoadingProducts ? (
          /* Skeletons Loader */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="products-skeletons">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-[#19110d]/40 border border-orange-500/10 animate-pulse flex flex-col justify-between p-6">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/5 border border-orange-500/10"></div>
                  <div className="w-1/2 h-6 bg-orange-500/5 rounded"></div>
                  <div className="w-full h-16 bg-orange-500/5 rounded"></div>
                </div>
                <div className="w-full h-10 bg-orange-500/5 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-black/20 rounded-2xl border border-orange-500/10" id="no-products-state">
            <Filter className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-base font-semibold text-slate-300">No products found</p>
            <p className="text-xs text-slate-500 mt-1">Try refining your search keyword or switching product categories!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="products-container">
            {filteredProducts.map((p) => {
              const isRanks = p.category === 'ranks';
              const isCrates = p.category === 'crates';
              const isCoins = p.category === 'coins';

              return (
                <motion.div
                  layout
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="rounded-2xl bg-[#19110d]/65 border border-orange-500/10 hover:border-orange-500/50 flex flex-col justify-between overflow-hidden shadow-xl hover:shadow-[0_0_22px_rgba(249,115,22,0.18)] relative group cursor-pointer"
                  id={`product-card-${p.id}`}
                >
                  {/* Visual Category Gradients */}
                  <div className="p-6 text-left flex-1 flex flex-col justify-between space-y-5">
                    <div className="space-y-4.5">
                      {/* Product Heading representation */}
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${p.gradient} p-[1.5px] shadow-lg flex items-center justify-center`}>
                          <div className="w-full h-full bg-[#120c18] rounded-[10.5px] flex items-center justify-center">
                            {renderProductIcon(p.icon, p.category)}
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none">Price Single</span>
                          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">₹{p.price}</span>
                        </div>
                      </div>

                      {/* Info block */}
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-white uppercase group-hover:text-orange-400 transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1.5 min-h-[48px]">
                          {p.description}
                        </p>
                      </div>

                      {/* Display features / benefits */}
                      <div className="border-t border-orange-500/5 pt-4">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono mb-2">
                          {isRanks && 'RANK PERKS & COMMAND PRIVILEGES'}
                          {isCrates && 'CRATE REWARDS PREVIEW'}
                          {isCoins && 'BONUS TOKEN REWARDS'}
                        </span>
                        <ul className="space-y-1.5">
                          {p.features.slice(0, 6).map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <ChevronRight className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                              <span className="leading-tight">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart checkout button */}
                  <div className="p-6 pt-0">
                    <button
                      onClick={() => addToCart({ id: p.id, name: p.name, category: p.category, price: p.price, icon: p.icon, gradient: p.gradient })}
                      className="w-full py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-gradient-to-r hover:from-orange-600 hover:to-amber-500 hover:border-transparent text-orange-300 hover:text-white text-xs font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow shadow-orange-950/20"
                      id={`buy-btn-${p.id}`}
                    >
                      Add To Cart
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Frequently Asked Questions */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 border-t border-orange-500/5 mb-16">
        <div className="text-center mb-10">
          <h2 className="text-xl sm:text-3.5xl font-black text-white uppercase tracking-tight flex items-center justify-center gap-2">
            <HelpCircle className="w-7 h-7 text-orange-400" />
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            Have questions about server commands, billing refunds, or custom rewards packages?
          </p>
        </div>

        <div className="space-y-4" id="faq-accordion">
          {faqItems.map((faq, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-[#19110d]/45 border border-orange-500/5 text-left space-y-2 hover:border-orange-500/15 transition-all duration-300"
            >
              <h4 className="text-sm font-bold text-slate-200">
                {faq.q}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact block */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5 border border-orange-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-200">Still need transaction assistance?</h4>
              <p className="text-xs text-slate-500">Contact billing staff directly. Safe gaming guarantee.</p>
            </div>
          </div>
          <a
            href={`mailto:${settings.contactEmail}`}
            className="px-5 py-2.5 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs font-bold font-mono tracking-wide cursor-pointer hover:bg-orange-600 hover:text-white transition-all"
          >
            {settings.contactEmail}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[#0a0604] border-t border-orange-500/10 py-12 text-slate-500 text-xs">
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
            <a href={settings.discordInvite} className="hover:text-slate-300 transition-colors" target="_blank" rel="noreferrer">Help Support</a>
            <span className="text-slate-700">|</span>
            <span className="font-normal">&copy; 2026 BuddyCraft Server Network.</span>
          </div>
        </div>
      </footer>

      {/* Slide drawers */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onOpenAuth={openAuth} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} initialTab={authTab} />
    </div>
  );
}
