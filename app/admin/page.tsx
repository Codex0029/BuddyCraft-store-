'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  LayoutDashboard,
  Tag,
  ShoppingBag,
  Users,
  Settings as SettingsIcon,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Percent,
  Search,
  Eye,
  EyeOff,
  Ban
} from 'lucide-react';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  completedOrders: number;
  totalUsers: number;
  averageOrderValue: number;
}

interface PopularProduct {
  name: string;
  category: string;
  count: number;
  revenue: number;
}

interface ChartDay {
  date: string;
  revenue: number;
  orders: number;
}

interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  createdAt: string;
}

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

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  expiryDate: string;
  usageLimit: number;
  usageCount: number;
  visible: boolean;
}

interface Order {
  id: string;
  userId: string;
  username: string;
  email: string;
  items: Array<{ productId: string; productName: string; price: number; quantity: number }>;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  paymentGateway: string;
  utr?: string;
  screenshot?: string;
  discordUsername?: string;
  createdAt: string;
}

interface UserRecord {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isBanned: boolean;
  discordUsername?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, token, settings, refreshSettings, addToast } = useApp();
  const router = useRouter();

  // Core loading guards
  const [isAdminChecking, setIsAdminChecking] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'coupons' | 'users' | 'settings'>('overview');

  // Sub-category state for products management
  const [selectedProductCategory, setSelectedProductCategory] = useState<'ranks' | 'crates' | 'coins'>('ranks');

  // Data States
  const [stats, setStats] = useState<Stats | null>(null);
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [chartData, setChartData] = useState<ChartDay[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);

  // Search queries
  const [searchOrdersQuery, setSearchOrdersQuery] = useState('');
  const [searchUsersQuery, setSearchUsersQuery] = useState('');

  // Form Modals states
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  // Product Form values
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<'ranks' | 'crates' | 'coins'>('ranks');
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodFeatures, setProdFeatures] = useState('');
  const [prodIcon, setProdIcon] = useState('Shield');
  const [prodGradient, setProdGradient] = useState('from-purple-500 to-indigo-600');
  const [prodBonus, setProdBonus] = useState('');
  const [prodOrder, setProdOrder] = useState('');
  const [prodVisible, setProdVisible] = useState(true);

  // Coupon Form values
  const [coupCode, setCoupCode] = useState('');
  const [coupType, setCoupType] = useState<'percentage' | 'fixed'>('percentage');
  const [coupValue, setCoupValue] = useState('');
  const [coupExpiry, setCoupExpiry] = useState('2028-12-31');
  const [coupLimit, setCoupLimit] = useState('100');
  const [coupVisible, setCoupVisible] = useState(true);

  // Settings values
  const [setStoreName, setSetStoreName] = useState('');
  const [setServerIp, setSetServerIp] = useState('');
  const [setDiscordInvite, setSetDiscordInvite] = useState('');
  const [setContactEmail, setSetContactEmail] = useState('');
  const [setYoutubeUrl, setSetYoutubeUrl] = useState('');
  const [setTwitterUrl, setSetTwitterUrl] = useState('');
  const [setTaxRate, setSetTaxRate] = useState('');
  const [setThemeColor, setSetThemeColor] = useState<'purple-cyan' | 'emerald-gold' | 'crimson-amber' | 'orange'>('orange');
  const [viewingReceiptOrder, setViewingReceiptOrder] = useState<any | null>(null);

  // Load Status
  const [isLoading, setIsLoading] = useState(true);

  // Admin Guard redirect
  useEffect(() => {
    if (!user || !user.isAdmin) {
      router.push('/store');
    } else {
      const timer = setTimeout(() => {
        setIsAdminChecking(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, router]);

  // Load Admin Data on Startup
  const loadAdminData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // 1. Analytics
      const resStats = await fetch('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataStats = await resStats.json();
      if (dataStats.stats) {
        setStats(dataStats.stats);
        setPopularProducts(dataStats.popularProducts || []);
        setChartData(dataStats.chartData || []);
        setAuditLogs(dataStats.auditLogs || []);
      }

      // 2. Products
      const resProd = await fetch('/api/products?adminMode=true', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataProd = await resProd.json();
      if (dataProd.products) {
        setProducts(dataProd.products);
      }

      // 3. Orders
      const resOrd = await fetch(`/api/orders?search=${encodeURIComponent(searchOrdersQuery)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataOrd = await resOrd.json();
      if (dataOrd.orders) {
        setOrders(dataOrd.orders);
      }

      // 4. Coupons
      const resCoup = await fetch('/api/coupons', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataCoup = await resCoup.json();
      if (dataCoup.coupons) {
        setCoupons(dataCoup.coupons);
      }

      // 5. Users
      const resUsers = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const dataUsers = await resUsers.json();
      if (dataUsers.users) {
        setUsers(dataUsers.users);
      }
    } catch (e) {
      console.error('Failed to load admin management databases:', e);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isAdminChecking && token) {
      const timer = setTimeout(() => {
        loadAdminData();

        // Seed settings form values
        setSetStoreName(settings.storeName);
        setSetServerIp(settings.serverIp);
        setSetDiscordInvite(settings.discordInvite);
        setSetContactEmail(settings.contactEmail);
        setSetYoutubeUrl(settings.youtubeUrl);
        setSetTwitterUrl(settings.twitterUrl);
        setSetTaxRate(settings.taxRate.toString());
        setSetThemeColor(settings.themeColor);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isAdminChecking, token]);

  // Load orders when search triggers
  useEffect(() => {
    if (!isAdminChecking && token) {
      const delayDebounce = setTimeout(() => {
        async function fetchFilteredOrders() {
          try {
            const res = await fetch(`/api/orders?search=${encodeURIComponent(searchOrdersQuery)}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.orders) setOrders(data.orders);
          } catch (_) {}
        }
        fetchFilteredOrders();
      }, 300);
      return () => clearTimeout(delayDebounce);
    }
  }, [searchOrdersQuery]);

  // MODALS SAVE TRIGGERS
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodPrice) {
      addToast('Product name and price are required.', 'error');
      return;
    }

    const payload = {
      id: editingProduct?.id,
      name: prodName,
      category: prodCategory,
      price: Number(prodPrice),
      description: prodDesc,
      features: prodFeatures.split('\n').filter((f) => f.trim() !== ''),
      icon: prodIcon,
      gradient: prodGradient,
      bonusCoins: prodBonus ? Number(prodBonus) : undefined,
      order: prodOrder ? Number(prodOrder) : undefined,
      visible: prodVisible,
    };

    try {
      const url = '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(data.message || 'Product saved successfully!', 'success');
        setProductModalOpen(false);
        resetProductForm();
        loadAdminData();
      } else {
        addToast(data.error || 'Failed to save product.', 'error');
      }
    } catch (_) {
      addToast('Error saving product.', 'error');
    }
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupCode || !coupValue) {
      addToast('Coupon code and value are required.', 'error');
      return;
    }

    const payload = {
      id: editingCoupon?.id,
      code: coupCode,
      type: coupType,
      value: Number(coupValue),
      expiryDate: coupExpiry,
      usageLimit: Number(coupLimit),
      visible: coupVisible,
    };

    try {
      const url = '/api/coupons';
      const method = editingCoupon ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(data.message || 'Coupon code saved!', 'success');
        setCouponModalOpen(false);
        resetCouponForm();
        loadAdminData();
      } else {
        addToast(data.error || 'Failed to save coupon.', 'error');
      }
    } catch (_) {
      addToast('Error saving coupon.', 'error');
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          storeName: setStoreName,
          serverIp: setServerIp,
          discordInvite: setDiscordInvite,
          contactEmail: setContactEmail,
          youtubeUrl: setYoutubeUrl,
          twitterUrl: setTwitterUrl,
          taxRate: Number(setTaxRate),
          themeColor: setThemeColor,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast('Global Store Settings saved successfully!', 'success');
        await refreshSettings();
        loadAdminData();
      } else {
        addToast(data.error || 'Failed to update settings.', 'error');
      }
    } catch (_) {
      addToast('Settings update network error.', 'error');
    }
  };

  // ACTIONS (DELETE, BAN, REFUND, CANCEL)
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently delete this product? This action is irreversible.')) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        addToast('Product successfully removed.', 'success');
        loadAdminData();
      } else {
        const d = await res.json();
        addToast(d.error || 'Delete failed.', 'error');
      }
    } catch (_) {
      addToast('Product delete network error.', 'error');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Permanently delete this coupon?')) return;

    try {
      const res = await fetch(`/api/coupons?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        addToast('Coupon code permanently deleted.', 'success');
        loadAdminData();
      } else {
        const d = await res.json();
        addToast(d.error || 'Delete failed.', 'error');
      }
    } catch (_) {
      addToast('Coupon delete error.', 'error');
    }
  };

  const handleOrderAction = async (orderId: string, status: 'CANCELLED' | 'REFUNDED' | 'COMPLETED') => {
    const actionLabel: string = status === 'COMPLETED' ? 'COMPLETED (VERIFIED)' : status;
    if (!confirm(`Are you sure you want to set order ${orderId} to ${actionLabel}?`)) return;

    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      });

      if (res.ok) {
        addToast(`Order ${orderId} successfully marked as ${status}!`, 'success');
        loadAdminData();
      } else {
        const d = await res.json();
        addToast(d.error || 'Action failed.', 'error');
      }
    } catch (_) {
      addToast('Order update network error.', 'error');
    }
  };

  const handleUserAction = async (targetUserId: string, action: 'toggle-ban' | 'toggle-admin' | 'reset-password', value: any) => {
    let msg = 'Apply this administrative action?';
    if (action === 'toggle-ban') msg = `Do you want to ${value ? 'BAN' : 'UNBAN'} this user account?`;
    if (action === 'toggle-admin') msg = `Do you want to ${value ? 'PROMOTE' : 'DEMOTE'} this user?`;
    if (action === 'reset-password') msg = `Reset password of this account to "${value}"?`;

    if (!confirm(msg)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUserId, action, value }),
      });

      const data = await res.json();

      if (res.ok) {
        addToast(data.message || 'Action completed successfully!', 'success');
        loadAdminData();
      } else {
        addToast(data.error || 'Action failed.', 'error');
      }
    } catch (_) {
      addToast('User action network error.', 'error');
    }
  };

  const handleDeleteUserAccount = async (id: string) => {
    if (!confirm('Permanently wipe this registered user account and delete all associated transaction histories from the logs? This is irreversible.')) return;

    try {
      const res = await fetch(`/api/admin/users?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        addToast('Registered user account permanently deleted.', 'success');
        loadAdminData();
      } else {
        const d = await res.json();
        addToast(d.error || 'Delete failed.', 'error');
      }
    } catch (_) {
      addToast('User delete network error.', 'error');
    }
  };

  // Open Edit forms
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdCategory(p.category);
    setProdPrice(p.price.toString());
    setProdDesc(p.description);
    setProdFeatures(p.features.join('\n'));
    setProdIcon(p.icon);
    setProdGradient(p.gradient);
    setProdBonus(p.bonusCoins ? p.bonusCoins.toString() : '');
    setProdOrder(p.order.toString());
    setProdVisible(p.visible);
    setProductModalOpen(true);
  };

  const openEditCoupon = (c: Coupon) => {
    setEditingCoupon(c);
    setCoupCode(c.code);
    setCoupType(c.type);
    setCoupValue(c.value.toString());
    setCoupExpiry(c.expiryDate);
    setCoupLimit(c.usageLimit.toString());
    setCoupVisible(c.visible);
    setCouponModalOpen(true);
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setProdName('');
    setProdCategory('ranks');
    setProdPrice('');
    setProdDesc('');
    setProdFeatures('');
    setProdIcon('Shield');
    setProdGradient('from-purple-500 to-indigo-600');
    setProdBonus('');
    setProdOrder('');
    setProdVisible(true);
  };

  const resetCouponForm = () => {
    setEditingCoupon(null);
    setCoupCode('');
    setCoupType('percentage');
    setCoupValue('');
    setCoupExpiry('2028-12-31');
    setCoupLimit('100');
    setCoupVisible(true);
  };

  // Filters
  const filteredProductList = products.filter((p) => p.category === selectedProductCategory);
  const filteredUsersList = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchUsersQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsersQuery.toLowerCase())
  );

  // SVG Chart Computations
  const chartHeight = 120;
  const chartWidth = 500;
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.revenue), 10) : 10;

  if (isAdminChecking) {
    return (
      <div className="h-screen bg-[#0f0a1c] flex flex-col items-center justify-center text-center p-6 space-y-4">
        <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-sm text-slate-400">Verifying administrative credentials...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0d081a] text-slate-100" id="admin-dashboard-view">
      {/* Header */}
      <Header />

      {/* Main Admin Frame Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full flex flex-col md:flex-row gap-8">
        {/* SIDEBAR NAVIGATION NAV RAIL */}
        <aside className="w-full md:w-64 flex-shrink-0 text-left">
          <div className="rounded-2xl bg-[#140e2a] border border-purple-500/10 p-3 space-y-1">
            <div className="px-4 py-3 mb-2 border-b border-purple-500/5">
              <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono">Administration Console</span>
              <span className="text-xs font-semibold text-cyan-400 font-mono select-all truncate block">{user?.email}</span>
            </div>

            {[
              { id: 'overview', label: 'Dashboard & Analytics', icon: LayoutDashboard },
              { id: 'products', label: 'Ranks & Products', icon: ShoppingBag },
              { id: 'orders', label: 'Order History Logs', icon: FileText },
              { id: 'coupons', label: 'Promo Coupons', icon: Tag },
              { id: 'users', label: 'User & Bans Controls', icon: Users },
              { id: 'settings', label: 'Global Configurations', icon: SettingsIcon },
            ].map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveTab(section.id as any);
                  loadAdminData();
                }}
                className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  activeTab === section.id
                    ? 'bg-purple-500/10 text-purple-400 border-l-2 border-purple-500'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
                id={`admin-tab-btn-${section.id}`}
              >
                <section.icon className="w-4.5 h-4.5" />
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        {/* CORE WORKSPACE SCREEN */}
        <main className="flex-1 min-w-0">
          {isLoading ? (
            <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 rounded-2xl bg-[#140e2a] border border-purple-500/10">
              <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-sm text-slate-400">Pumping secure management logs...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECTION 1: OVERVIEW DASHBOARD */}
              {activeTab === 'overview' && stats && (
                <div className="space-y-6 text-left" id="admin-panel-overview">
                  {/* Stats card grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10">
                      <div className="flex items-center justify-between">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Gross Revenue</span>
                        <DollarSign className="w-4.5 h-4.5 text-emerald-400" />
                      </div>
                      <span className="block text-2xl font-black text-white mt-1.5">${stats.totalRevenue}</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">Completed checkout sums</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10">
                      <div className="flex items-center justify-between">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Total Orders</span>
                        <ShoppingBag className="w-4.5 h-4.5 text-purple-400" />
                      </div>
                      <span className="block text-2xl font-black text-white mt-1.5">{stats.totalOrders}</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">{stats.completedOrders} successful delivers</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10">
                      <div className="flex items-center justify-between">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Registered Users</span>
                        <Users className="w-4.5 h-4.5 text-cyan-400" />
                      </div>
                      <span className="block text-2xl font-black text-white mt-1.5">{stats.totalUsers}</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">Player registry entries</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10">
                      <div className="flex items-center justify-between">
                        <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Average Checkouts</span>
                        <TrendingUp className="w-4.5 h-4.5 text-rose-400" />
                      </div>
                      <span className="block text-2xl font-black text-white mt-1.5">${stats.averageOrderValue}</span>
                      <span className="block text-[9px] text-slate-500 mt-0.5">Per-transaction averages</span>
                    </div>
                  </div>

                  {/* SVG Chart representation */}
                  <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10">
                    <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono mb-6">Revenue Growth Chart (Past 7 Days)</span>
                    <div className="w-full flex items-end justify-between h-44 gap-2 pt-4 border-b border-purple-500/10 pb-2 font-mono">
                      {chartData.map((day, idx) => {
                        const hPercentage = (day.revenue / maxRevenue) * 100;
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Hover Details Card */}
                            <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-black border border-purple-500/20 rounded-lg px-2 py-1 text-[9px] text-cyan-300 font-bold text-center z-20 pointer-events-none">
                              ${day.revenue.toFixed(2)} ({day.orders} ords)
                            </div>
                            {/* Visual Bar */}
                            <div
                              style={{ height: `${Math.max(hPercentage, 4)}%` }}
                              className="w-full rounded-t-lg bg-gradient-to-t from-purple-600 to-cyan-400 group-hover:from-purple-500 group-hover:to-cyan-300 transition-colors cursor-pointer"
                            />
                            <span className="text-[9px] text-slate-500 mt-2 font-bold select-none">{day.date}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Audit Logs and popular list */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Popular products list */}
                    <div className="lg:col-span-1 p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 flex flex-col justify-between">
                      <div>
                        <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono mb-4">Top Selling Game Perks</span>
                        <div className="space-y-3">
                          {popularProducts.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between border-b border-purple-500/5 pb-2.5">
                              <div>
                                <span className="block text-xs font-black text-slate-200 uppercase truncate max-w-[120px]">{p.name}</span>
                                <span className="block text-[9px] text-slate-500 font-mono uppercase">{p.category}</span>
                              </div>
                              <div className="text-right font-mono text-xs">
                                <span className="block font-bold text-cyan-300">{p.count} units</span>
                                <span className="block text-[9px] text-slate-500">₹{p.revenue.toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* System Audit logs */}
                    <div className="lg:col-span-2 p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-500 font-bold font-mono mb-4">Administrative Action Audit Logs</span>
                      <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
                        {auditLogs.map((log) => (
                          <div key={log.id} className="p-3 bg-black/30 rounded-xl border border-purple-500/5 text-xs font-mono">
                            <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                              <span>{log.adminEmail}</span>
                              <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                            </div>
                            <div className="text-purple-400 font-bold uppercase mt-1">{log.action}</div>
                            <p className="text-slate-300 font-sans text-[11px] leading-relaxed mt-0.5">{log.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: PRODUCTS CRUD */}
              {activeTab === 'products' && (
                <div className="space-y-6 text-left" id="admin-panel-products">
                  {/* Category tabs and ADD Button */}
                  <div className="flex items-center justify-between">
                    <div className="flex bg-black/40 border border-purple-500/10 p-1 rounded-xl">
                      {[
                        { id: 'ranks', label: 'Ranks' },
                        { id: 'crates', label: 'Crates' },
                        { id: 'coins', label: 'Coins' },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedProductCategory(t.id as any)}
                          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider cursor-pointer ${
                            selectedProductCategory === t.id ? 'bg-purple-500/10 text-purple-400' : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        resetProductForm();
                        setProdCategory(selectedProductCategory);
                        setProductModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow cursor-pointer"
                      id="add-product-btn"
                    >
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>

                  {/* List of filtered products */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProductList.map((p) => (
                      <div
                        key={p.id}
                        className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10 flex items-start justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${p.gradient} flex items-center justify-center flex-shrink-0 text-white font-bold`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-100 uppercase">{p.name}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                p.visible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                              }`}>
                                {p.visible ? 'Visible' : 'Hidden'}
                              </span>
                            </div>
                            <span className="block text-[10px] font-mono font-bold text-cyan-400 mt-0.5">₹{p.price}</span>
                            <p className="text-[11px] text-slate-400 leading-normal mt-2 max-w-[250px] truncate">{p.description}</p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditProduct(p)}
                            className="p-2 rounded-lg bg-purple-500/5 hover:bg-purple-500/15 text-slate-300 hover:text-white transition-all cursor-pointer border border-purple-500/10"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-2 rounded-lg bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 transition-all cursor-pointer border border-rose-500/10"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 3: ORDERS */}
              {activeTab === 'orders' && (
                <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 text-left space-y-6" id="admin-panel-orders">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="block text-sm font-black text-white uppercase tracking-wider">Server billing Orders logs</span>
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search order ID, username..."
                        value={searchOrdersQuery}
                        onChange={(e) => setSearchOrdersQuery(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-semibold">
                      <thead>
                        <tr className="border-b border-purple-500/5 text-slate-500 text-[10px] uppercase font-bold tracking-wider text-left">
                          <th className="pb-3 pr-4">Order ID</th>
                          <th className="pb-3 pr-4">User (IGN)</th>
                          <th className="pb-3 pr-4">Items / Rank</th>
                          <th className="pb-3 pr-4">UTR / Ref</th>
                          <th className="pb-3 pr-4">Screenshot</th>
                          <th className="pb-3 pr-4">Date Placed</th>
                          <th className="pb-3 pr-4">Amount</th>
                          <th className="pb-3 pr-4 text-center">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/5 font-mono text-slate-300">
                        {orders.map((o) => (
                          <tr key={o.id} className="hover:bg-purple-500/5">
                            <td className="py-4.5 pr-4 text-cyan-400 font-bold">{o.id}</td>
                            <td className="py-4.5 pr-4 font-sans text-slate-200">
                              <div>{o.username}</div>
                              {o.discordUsername && (
                                <span className="block text-[10px] text-indigo-400 font-mono">@{o.discordUsername}</span>
                              )}
                            </td>
                            <td className="py-4.5 pr-4 font-sans text-slate-300 max-w-[150px] truncate" title={o.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}>
                              {o.items.map(i => `${i.productName}`).join(', ')}
                            </td>
                            <td className="py-4.5 pr-4 text-slate-300 font-mono">
                              {o.utr ? (
                                <span className="text-cyan-300 font-bold">{o.utr}</span>
                              ) : (
                                <span className="text-slate-600 italic">Gateway Direct</span>
                              )}
                            </td>
                            <td className="py-4.5 pr-4 font-sans">
                              {o.screenshot ? (
                                <button
                                  onClick={() => setViewingReceiptOrder(o)}
                                  className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                                >
                                  👁️ View Proof
                                </button>
                              ) : (
                                <span className="text-slate-600 italic text-[11px]">N/A (Auto-Pay)</span>
                              )}
                            </td>
                            <td className="py-4.5 pr-4 text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                            <td className="py-4.5 pr-4 font-bold text-slate-200">₹{o.total}</td>
                            <td className="py-4.5 text-center font-sans">
                              <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                o.status === 'COMPLETED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : o.status === 'PENDING'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                                  : o.status === 'REFUNDED'
                                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {o.status === 'COMPLETED' ? 'Verified' : o.status === 'CANCELLED' ? 'Rejected' : o.status === 'PENDING' ? 'Pending' : o.status}
                              </span>
                            </td>
                            <td className="py-4.5 text-right font-sans space-x-1">
                              {o.status === 'PENDING' && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOrderAction(o.id, 'COMPLETED')}
                                    className="px-2 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500 hover:text-black border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-0.5"
                                    title="Verify & Execute Server Commands"
                                  >
                                    ✅ Verify
                                  </button>
                                  <button
                                    onClick={() => handleOrderAction(o.id, 'CANCELLED')}
                                    className="px-2 py-1 rounded bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-500/30 text-rose-400 text-[10px] font-black uppercase transition-all cursor-pointer flex items-center gap-0.5"
                                    title="Reject & Deny Order"
                                  >
                                    ❌ Reject
                                  </button>
                                </div>
                              )}
                              {o.status === 'COMPLETED' && (
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    onClick={() => handleOrderAction(o.id, 'REFUNDED')}
                                    className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500 hover:text-white border border-amber-500/15 text-amber-400 text-[10px] font-black uppercase transition-colors cursor-pointer"
                                  >
                                    Refund
                                  </button>
                                  <button
                                    onClick={() => handleOrderAction(o.id, 'CANCELLED')}
                                    className="px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500 hover:text-white border border-rose-500/15 text-rose-400 text-[10px] font-black uppercase transition-colors cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 4: COUPONS CRUD */}
              {activeTab === 'coupons' && (
                <div className="space-y-6 text-left" id="admin-panel-coupons">
                  <div className="flex justify-between items-center">
                    <span className="block text-sm font-black text-white uppercase tracking-wider">Promotion Discount Coupons</span>
                    <button
                      onClick={() => {
                        resetCouponForm();
                        setCouponModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow cursor-pointer"
                      id="add-coupon-btn"
                    >
                      <Plus className="w-4 h-4" /> Create Coupon
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {coupons.map((c) => (
                      <div key={c.id} className="p-5 rounded-2xl bg-[#140e2a] border border-purple-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/15">
                            <Tag className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-100 font-mono tracking-wider">{c.code}</span>
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                c.visible ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                              }`}>
                                {c.visible ? 'Active' : 'Hidden'}
                              </span>
                            </div>
                            <span className="block text-[10px] text-slate-400 mt-1 font-mono font-bold leading-none">
                             Value: {c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`} | Uses: {c.usageCount}/{c.usageLimit}
                            </span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openEditCoupon(c)}
                            className="p-2 rounded-lg bg-purple-500/5 hover:bg-purple-500/15 text-slate-300 hover:text-white border border-purple-500/10 transition-all cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCoupon(c.id)}
                            className="p-2 rounded-lg bg-rose-500/5 hover:bg-rose-500/15 text-rose-400 border border-rose-500/10 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 5: USER CONTROLS */}
              {activeTab === 'users' && (
                <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 text-left space-y-6" id="admin-panel-users">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="block text-sm font-black text-white uppercase tracking-wider">Registered Player Registry</span>
                    {/* Search */}
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search email, username..."
                        value={searchUsersQuery}
                        onChange={(e) => setSearchUsersQuery(e.target.value)}
                        className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-600 font-semibold"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs font-semibold">
                      <thead>
                        <tr className="border-b border-purple-500/5 text-slate-500 text-[10px] uppercase font-bold tracking-wider text-left">
                          <th className="pb-3 pr-4">Username</th>
                          <th className="pb-3 pr-4">Email</th>
                          <th className="pb-3 pr-4">Discord Acc</th>
                          <th className="pb-3 pr-4 text-center">Admin</th>
                          <th className="pb-3 pr-4 text-center">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-500/5 text-slate-300 font-mono">
                        {filteredUsersList.map((u) => (
                          <tr key={u.id} className="hover:bg-purple-500/5">
                            <td className="py-4 pr-4 font-sans font-bold text-slate-200">{u.username}</td>
                            <td className="py-4 pr-4 text-slate-400">{u.email}</td>
                            <td className="py-4 pr-4 text-indigo-400 font-semibold text-[11px] truncate max-w-[120px]" title={u.discordUsername}>
                              {u.discordUsername || 'None'}
                            </td>
                            <td className="py-4 pr-4 text-center font-sans">
                              <button
                                onClick={() => handleUserAction(u.id, 'toggle-admin', !u.isAdmin)}
                                disabled={u.id === user?.id}
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer disabled:opacity-50 ${
                                  u.isAdmin ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                }`}
                              >
                                {u.isAdmin ? 'Yes' : 'No'}
                              </button>
                            </td>
                            <td className="py-4 pr-4 text-center font-sans">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                                u.isBanned ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}>
                                {u.isBanned ? 'Banned' : 'Normal'}
                              </span>
                            </td>
                            <td className="py-4 text-right font-sans space-x-1.5">
                              <button
                                onClick={() => handleUserAction(u.id, 'toggle-ban', !u.isBanned)}
                                disabled={u.id === user?.id}
                                className="p-1.5 rounded-lg bg-rose-500/5 hover:bg-rose-500/15 border border-rose-500/10 text-rose-400 cursor-pointer"
                                title={u.isBanned ? 'Unban' : 'Ban'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  const pass = prompt('Enter new custom password (at least 6 characters):');
                                  if (pass) handleUserAction(u.id, 'reset-password', pass);
                                }}
                                className="p-1.5 rounded-lg bg-purple-500/5 hover:bg-purple-500/15 border border-purple-500/10 text-slate-300 hover:text-white cursor-pointer"
                                title="Reset Password"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUserAccount(u.id)}
                                disabled={u.id === user?.id}
                                className="p-1.5 rounded-lg bg-rose-950/20 hover:bg-rose-600 hover:text-white text-rose-400 border border-rose-500/10 cursor-pointer disabled:opacity-50"
                                title="Permanently Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SECTION 6: CONFIGS AND GLOBAL SETTINGS */}
              {activeTab === 'settings' && (
                <div className="p-6 rounded-2xl bg-[#140e2a] border border-purple-500/10 text-left" id="admin-panel-settings">
                  <div className="flex items-center gap-2 border-b border-purple-500/5 pb-4 mb-6">
                    <SettingsIcon className="w-5 h-5 text-purple-400" />
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Global Server Configurations</h3>
                  </div>

                  <form onSubmit={handleSettingsSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Store Name</label>
                        <input
                          type="text"
                          required
                          value={setStoreName}
                          onChange={(e) => setSetStoreName(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Minecraft server Connection IP</label>
                        <input
                          type="text"
                          required
                          value={setServerIp}
                          onChange={(e) => setSetServerIp(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono font-bold text-cyan-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Discord Invite Link</label>
                        <input
                          type="text"
                          required
                          value={setDiscordInvite}
                          onChange={(e) => setSetDiscordInvite(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Billing Contact Email</label>
                        <input
                          type="email"
                          required
                          value={setContactEmail}
                          onChange={(e) => setSetContactEmail(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Store Tax Rate (e.g. 0.05 for 5%)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={setTaxRate}
                          onChange={(e) => setSetTaxRate(e.target.value)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Theme Color Layout</label>
                        <select
                          value={setThemeColor}
                          onChange={(e) => setSetThemeColor(e.target.value as any)}
                          className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-400 cursor-pointer"
                        >
                          <option value="orange">Epic Orange & Amber (Active)</option>
                          <option value="purple-cyan">Default Gaming Purple & Cyan</option>
                          <option value="emerald-gold">Cosmic Survival Emerald & Gold</option>
                          <option value="crimson-amber">Factions Crimson & Amber</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider shadow cursor-pointer"
                    >
                      Save Configuration Settings
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* CRUD 1: PRODUCT MODAL DIALOG */}
      <AnimatePresence>
        {productModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductModalOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg p-6 bg-[#110b21] border border-purple-500/10 rounded-2xl shadow-2xl z-50 max-h-[90vh] overflow-y-auto text-left"
              id="product-crud-modal"
            >
              <div className="flex justify-between items-center pb-4 border-b border-purple-500/5 mb-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {editingProduct ? `Edit ${editingProduct.name}` : 'Create New Store Product'}
                </h3>
                <button
                  onClick={() => setProductModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Product Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LEGEND"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Category ID</label>
                    <select
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value as any)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-400 cursor-pointer"
                    >
                      <option value="ranks">Ranks Store</option>
                      <option value="crates">Crate Keys</option>
                      <option value="coins">Coin Packages</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Pricing (₹ INR)</label>
                    <input
                      type="number"
                      step="1"
                      required
                      placeholder="e.g. 499"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Sorting Order</label>
                    <input
                      type="number"
                      placeholder="e.g. 1, 2, 3"
                      value={prodOrder}
                      onChange={(e) => setProdOrder(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Brief Description</label>
                  <input
                    type="text"
                    required
                    placeholder="Wield legendary server capability features."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Command Perks & Benefits (One line per perk)</label>
                  <textarea
                    rows={4}
                    placeholder="Unlocks flying capability (/fly)&#10;Access exclusive /kit Legend once a day"
                    value={prodFeatures}
                    onChange={(e) => setProdFeatures(e.target.value)}
                    className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Icon Design name</label>
                    <select
                      value={prodIcon}
                      onChange={(e) => setProdIcon(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-400 cursor-pointer"
                    >
                      <option value="Shield">Shield</option>
                      <option value="Crown">Crown</option>
                      <option value="Zap">Zap</option>
                      <option value="Flame">Flame</option>
                      <option value="Sparkles">Sparkles</option>
                      <option value="Coins">Coins</option>
                      <option value="Orbit">Orbit</option>
                      <option value="Heart">Heart</option>
                      <option value="Rocket">Rocket</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Bonus Coins (For Coins packs only)</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={prodBonus}
                      onChange={(e) => setProdBonus(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 border-t border-purple-500/5 mt-4">
                  <input
                    type="checkbox"
                    id="prod_visible_checkbox"
                    checked={prodVisible}
                    onChange={(e) => setProdVisible(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/15 bg-black/40 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="prod_visible_checkbox" className="text-xs font-bold text-slate-300 cursor-pointer">
                    Toggle visibility on the store catalog pages
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Store Product
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CRUD 2: COUPON MODAL DIALOG */}
      <AnimatePresence>
        {couponModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setCouponModalOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md p-6 bg-[#110b21] border border-purple-500/10 rounded-2xl shadow-2xl z-50 text-left"
              id="coupon-crud-modal"
            >
              <div className="flex justify-between items-center pb-4 border-b border-purple-500/5 mb-4">
                <h3 className="text-base font-black text-white uppercase tracking-wider">
                  {editingCoupon ? `Edit Coupon ${editingCoupon.code}` : 'Create Discount Coupon'}
                </h3>
                <button
                  onClick={() => setCouponModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCouponSubmit} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Coupon Code (Uppercase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUMMER25"
                    value={coupCode}
                    onChange={(e) => setCoupCode(e.target.value)}
                    className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 uppercase font-mono tracking-wider font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Discount Type</label>
                    <select
                      value={coupType}
                      onChange={(e) => setCoupType(e.target.value as any)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-400 cursor-pointer"
                    >
                      <option value="percentage">Percentage Off (%)</option>
                      <option value="fixed">Fixed Rupees Off (₹)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Discount Value</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 20"
                      value={coupValue}
                      onChange={(e) => setCoupValue(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Expiry Date</label>
                    <input
                      type="date"
                      required
                      value={coupExpiry}
                      onChange={(e) => setCoupExpiry(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">Total Usage Limit</label>
                    <input
                      type="number"
                      required
                      value={coupLimit}
                      onChange={(e) => setCoupLimit(e.target.value)}
                      className="w-full bg-black/40 border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-4 py-2.5 text-slate-200 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2 border-t border-purple-500/5 mt-4">
                  <input
                    type="checkbox"
                    id="coup_visible_checkbox"
                    checked={coupVisible}
                    onChange={(e) => setCoupVisible(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-500/15 bg-black/40 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="coup_visible_checkbox" className="text-xs font-bold text-slate-300 cursor-pointer">
                    Toggle coupon availability
                  </label>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Save Coupon Code
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* UPI Receipt Proof Screenshot Modal */}
      <AnimatePresence>
        {viewingReceiptOrder && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingReceiptOrder(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-[#110a24] border border-purple-500/20 rounded-3xl overflow-hidden shadow-2xl shadow-black cursor-default text-left"
              >
                {/* Header bar simulated phone */}
                <div className="bg-[#181132] px-6 py-4 border-b border-purple-500/10 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold font-mono">UPI Digital Receipt Verifier</span>
                  </div>
                  <button
                    onClick={() => setViewingReceiptOrder(null)}
                    className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Receipt content wrapper */}
                <div className="p-6 space-y-6">
                  {/* Visual Bank Slip mockup */}
                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#191136] to-[#0f0a21] border border-emerald-500/20 text-center space-y-4 relative overflow-hidden">
                    {/* Watermark/grid background */}
                    <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-5 pointer-events-none" />
                    
                    {/* Successful status */}
                    <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                    
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">Transaction Successful</span>
                      <h4 className="text-2xl font-black text-white mt-1">₹{viewingReceiptOrder.total.toFixed(2)}</h4>
                    </div>

                    <div className="border-t border-purple-500/10 pt-4 space-y-2.5 text-xs text-left">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono uppercase text-[10px]">Order ID</span>
                        <span className="text-cyan-400 font-bold font-mono">{viewingReceiptOrder.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono uppercase text-[10px]">UTR Ref No.</span>
                        <span className="text-white font-bold font-mono text-[13px]">{viewingReceiptOrder.utr}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono uppercase text-[10px]">Minecraft IGN</span>
                        <span className="text-indigo-300 font-bold">{viewingReceiptOrder.username}</span>
                      </div>
                      {viewingReceiptOrder.discordUsername && (
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-mono uppercase text-[10px]">Discord</span>
                          <span className="text-slate-300 font-semibold font-mono">@{viewingReceiptOrder.discordUsername}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono uppercase text-[10px]">Recipient UPI ID</span>
                        <span className="text-slate-300 font-semibold font-mono">buddycraft@upi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-mono uppercase text-[10px]">Timestamp</span>
                        <span className="text-slate-400 font-mono text-[11px]">{new Date(viewingReceiptOrder.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Screenshot representation */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-slate-500 font-mono">Submitted Image Attachment</label>
                    <div className="p-3 rounded-xl bg-black/40 border border-purple-500/10 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 truncate max-w-[250px]">{viewingReceiptOrder.screenshot || 'screenshot_proof.png'}</span>
                      <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded font-bold uppercase font-sans">PNG Image</span>
                    </div>
                  </div>

                  {/* Quick Verification Actions */}
                  <div className="space-y-3 pt-2">
                    {viewingReceiptOrder.status === 'PENDING' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={async () => {
                            await handleOrderAction(viewingReceiptOrder.id, 'COMPLETED');
                            setViewingReceiptOrder(null);
                          }}
                          className="py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all shadow-lg shadow-emerald-950/40"
                        >
                          Verify Payment
                        </button>
                        <button
                          onClick={async () => {
                            await handleOrderAction(viewingReceiptOrder.id, 'CANCELLED');
                            setViewingReceiptOrder(null);
                          }}
                          className="py-3 rounded-xl bg-black/40 border border-rose-500/20 hover:bg-rose-500/10 text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all"
                        >
                          Reject / Deny
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setViewingReceiptOrder(null)}
                        className="w-full py-3 rounded-xl bg-black/40 border border-purple-500/15 text-slate-300 text-xs font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Dismiss Viewer
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
