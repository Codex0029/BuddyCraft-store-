'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

export interface CartItem {
  productId: string;
  name: string;
  category: 'ranks' | 'crates' | 'coins';
  price: number;
  quantity: number;
  icon: string;
  gradient: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  isBanned: boolean;
  discordId?: string;
  discordUsername?: string;
  discordAvatar?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  serverIp: string;
  discordInvite: string;
  contactEmail: string;
  youtubeUrl: string;
  twitterUrl: string;
  currency: string;
  taxRate: number;
  themeColor: 'purple-cyan' | 'emerald-gold' | 'crimson-amber' | 'orange';
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  token: string | null;
  cart: CartItem[];
  appliedCoupon: { code: string; type: 'percentage' | 'fixed'; value: number } | null;
  settings: StoreSettings;
  toasts: Toast[];
  isLoading: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
  addToCart: (product: { id: string; name: string; category: 'ranks' | 'crates' | 'coins'; price: number; icon: string; gradient: string }, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, qty: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (id: string) => void;
  refreshSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'BuddyCraft',
  serverIp: 'play.buddycraft.net',
  discordInvite: 'https://discord.gg/buddycraft',
  contactEmail: 'support@buddycraft.net',
  youtubeUrl: 'https://youtube.com/buddycraft',
  twitterUrl: 'https://twitter.com/buddycraft',
  currency: 'USD',
  taxRate: 0.05,
  themeColor: 'orange',
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppContextType['appliedCoupon']>(null);
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (e) {
      console.error('Failed to load store settings:', e);
    }
  }

  // Load state on startup
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      const storedToken = localStorage.getItem('buddycraft_token');
      const storedCart = localStorage.getItem('buddycraft_cart');

      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (_) {}
      }

      await fetchSettings();

      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
          } else {
            // Token expired or invalid
            localStorage.removeItem('buddycraft_token');
            setToken(null);
          }
        } catch (_) {
          localStorage.removeItem('buddycraft_token');
          setToken(null);
        }
      }
      setIsLoading(false);
    }
    init();
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('buddycraft_cart', JSON.stringify(cart));
    }
  }, [cart, isLoading]);

  const login = (userData: User, userToken: string) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('buddycraft_token', userToken);
    addToast(`Welcome back, ${userData.username}!`, 'success');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('buddycraft_token');
    addToast('You have been logged out.', 'info');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Pure-safe static counter for unique toast IDs
  const toastCounterRef = useRef(0);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toastCounterRef.current += 1;
    const id = `toast-${toastCounterRef.current}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const addToCart = (product: { id: string; name: string; category: 'ranks' | 'crates' | 'coins'; price: number; icon: string; gradient: string }, qty = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.productId === product.id);

      // If category is "ranks", only allow a maximum quantity of 1 (ranks are non-stackable!)
      if (product.category === 'ranks' && existingIndex > -1) {
        addToast('You can only purchase one rank of each tier per transaction.', 'info');
        return prevCart;
      }

      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += qty;
        addToast(`Increased ${product.name} quantity in cart!`, 'success');
        return updated;
      } else {
        addToast(`${product.name} added to cart!`, 'success');
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            category: product.category,
            price: product.price,
            quantity: qty,
            icon: product.icon,
            gradient: product.gradient,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (item) {
        addToast(`Removed ${item.name} from cart.`, 'info');
      }
      return prev.filter((i) => i.productId !== productId);
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          // Ranks cannot exceed quantity of 1
          if (item.category === 'ranks') return { ...item, quantity: 1 };
          return { ...item, quantity: qty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data.coupon) {
        setAppliedCoupon({
          code: data.coupon.code,
          type: data.coupon.type,
          value: data.coupon.value,
        });
        addToast(`Coupon ${data.coupon.code} applied successfully!`, 'success');
        return true;
      } else {
        addToast(data.error || 'Invalid coupon code.', 'error');
        return false;
      }
    } catch (_) {
      addToast('Error verifying coupon.', 'error');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    addToast('Coupon removed.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        cart,
        appliedCoupon,
        settings,
        toasts,
        isLoading,
        login,
        logout,
        updateUser,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        applyCoupon,
        removeCoupon,
        addToast,
        removeToast,
        refreshSettings: fetchSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
