'use client';

import React, { useState, useEffect } from 'react';
import { useApp, CartItem } from '@/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Tag, ArrowRight, ShieldCheck, CreditCard, Sparkles, CheckCircle, RefreshCw, Copy, Check, Clock, Upload, Sparkle, AlertCircle, AlertTriangle } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAuth: (tab?: 'login' | 'register') => void;
}

export default function CartDrawer({ isOpen, onClose, onOpenAuth }: CartDrawerProps) {
  const { user, token, cart, removeFromCart, updateCartQty, appliedCoupon, applyCoupon, removeCoupon, clearCart, settings, addToast } = useApp();
  const [couponInput, setCouponInput] = useState('');
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'payment' | 'success'>('cart');
  const [paymentGateway, setPaymentGateway] = useState<'upi' | 'stripe' | 'paypal' | 'razorpay' | 'crypto'>('upi');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Form states for manual UPI payment
  const [upiStep, setUpiStep] = useState<'pay' | 'form'>('pay');
  const [generatedOrderId, setGeneratedOrderId] = useState('');
  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [utr, setUtr] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [screenshotName, setScreenshotName] = useState('');
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Form states for fake stripe checkout
  const [fakeCardName, setFakeCardName] = useState('');
  const [fakeCardNumber, setFakeCardNumber] = useState('');
  const [fakeCryptoAddress, setFakeCryptoAddress] = useState('0xBuddyCraftCryptoPaymentsAddressX719F');

  // Countdown timer effect
  useEffect(() => {
    if (checkoutStep === 'payment' && paymentGateway === 'upi' && upiStep === 'pay' && isOpen) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkoutStep, paymentGateway, upiStep, isOpen]);

  // Format countdown mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Copy UPI ID helper
  const handleCopyUpi = () => {
    navigator.clipboard.writeText('buddycraft@ybl');
    setCopiedUpi(true);
    addToast('UPI ID buddycraft@ybl copied to clipboard!', 'success');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  // Calculation values
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discount = Number(((subtotal * appliedCoupon.value) / 100).toFixed(2));
    } else {
      discount = Math.min(appliedCoupon.value, subtotal);
    }
  }

  const taxRate = settings.taxRate || 0.05;
  const tax = Number(((subtotal - discount) * taxRate).toFixed(2));
  const total = Number((subtotal - discount + tax).toFixed(2));

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsVerifyingCoupon(true);
    await applyCoupon(couponInput);
    setIsVerifyingCoupon(false);
    setCouponInput('');
  };

  const handleStartCheckout = () => {
    if (cart.length === 0) return;
    if (!user) {
      addToast('Please login or register to complete your purchase!', 'info');
      onOpenAuth('login');
      return;
    }

    // Generate static Order ID
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setGeneratedOrderId(`BC-${yyyy}${mm}${dd}-${rand}`);

    // Pre-fill form fields
    setMinecraftUsername(user.username || '');
    setDiscordUsername(user.discordUsername || '');
    setUtr('');
    setScreenshotName('');
    setUpiStep('pay');
    setTimeLeft(600);

    setCheckoutStep('payment');
  };

  const handleCompletePayment = async () => {
    if (paymentGateway === 'stripe' && (!fakeCardName || !fakeCardNumber)) {
      addToast('Please fill out card holder name and dummy card details.', 'error');
      return;
    }

    if (paymentGateway === 'upi') {
      if (!minecraftUsername.trim()) {
        addToast('Minecraft Username is required.', 'error');
        return;
      }
      if (!utr.trim()) {
        addToast('Please enter your 12-digit UPI UTR number.', 'error');
        return;
      }
      if (!/^\d{12}$/.test(utr.trim())) {
        addToast('Invalid UTR format. Please enter exactly 12 numeric digits.', 'error');
        return;
      }
    }

    setIsProcessingPayment(true);
    addToast(paymentGateway === 'upi' ? 'Submitting UPI transaction proof...' : 'Contacting safe gaming gateway...', 'info');

    // Simulate server POST
    setTimeout(async () => {
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            couponCode: appliedCoupon?.code,
            paymentGateway,
            orderId: paymentGateway === 'upi' ? generatedOrderId : undefined,
            utr: paymentGateway === 'upi' ? utr.trim() : undefined,
            screenshot: paymentGateway === 'upi' ? screenshotName : undefined,
            minecraftUsername: paymentGateway === 'upi' ? minecraftUsername.trim() : undefined,
            discordUsername: paymentGateway === 'upi' ? (discordUsername.trim() || undefined) : undefined,
          }),
        });

        const data = await res.json();
        setIsProcessingPayment(false);

        if (res.ok && data.order) {
          setPlacedOrder(data.order);
          setCheckoutStep('success');
          clearCart();
          removeCoupon();
          addToast(paymentGateway === 'upi' ? 'Payment submitted for verification!' : 'Order placed successfully! Check your user dashboard.', 'success');
        } else {
          addToast(data.error || 'Checkout failed.', 'error');
        }
      } catch (_) {
        setIsProcessingPayment(false);
        addToast('Payment gateway error.', 'error');
      }
    }, 2000);
  };

  const resetCheckout = () => {
    setCheckoutStep('cart');
    setPlacedOrder(null);
    setFakeCardName('');
    setFakeCardNumber('');
    setMinecraftUsername('');
    setUtr('');
    setDiscordUsername('');
    setScreenshotName('');
    setUpiStep('pay');
    onClose();
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
            id="cart-backdrop"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full max-w-md w-full bg-[#110b21] border-l border-purple-500/10 shadow-2xl z-50 flex flex-col"
            id="cart-drawer"
          >
            {/* Header */}
            <div className="p-6 border-b border-purple-500/10 flex items-center justify-between bg-[#150e2a]">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <h2 className="text-lg font-bold tracking-tight text-white">
                  {checkoutStep === 'cart' && 'Shopping Cart'}
                  {checkoutStep === 'payment' && 'Secure Checkout'}
                  {checkoutStep === 'success' && 'Purchase Completed!'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
                id="close-cart-drawer-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Switcher */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* STEP 1: CART LIST */}
              {checkoutStep === 'cart' && (
                <>
                  {cart.length === 0 ? (
                    <div className="h-96 flex flex-col items-center justify-center text-center space-y-4" id="empty-cart-state">
                      <div className="w-16 h-16 rounded-full bg-purple-500/5 border border-purple-500/10 flex items-center justify-center text-slate-500">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-300">Your shopping cart is empty</p>
                        <p className="text-xs text-slate-500 max-w-[250px] mt-1">Explore our ranks, keys, and packages to populate it!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4" id="cart-items-container">
                      {cart.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center gap-4 p-4 rounded-xl bg-[#17102e] border border-purple-500/10"
                        >
                          {/* Colored representation */}
                          <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.gradient} flex items-center justify-center flex-shrink-0 text-white font-bold`}>
                            <Sparkles className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            <h4 className="text-sm font-bold text-slate-100 truncate">{item.name}</h4>
                            <p className="text-xs text-cyan-400 font-semibold font-mono">₹{item.price}</p>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center border border-purple-500/15 rounded-lg bg-black/30">
                              <button
                                onClick={() => updateCartQty(item.productId, item.quantity - 1)}
                                className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer font-bold"
                              >
                                -
                              </button>
                              <span className="text-xs font-mono font-bold px-1 text-slate-200">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateCartQty(item.productId, item.quantity + 1)}
                                className="px-2.5 py-1 text-slate-400 hover:text-white transition-colors cursor-pointer font-bold"
                                disabled={item.category === 'ranks'}
                              >
                                +
                              </button>
                            </div>

                            <button
                              onClick={() => removeFromCart(item.productId)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Coupon System */}
                  {cart.length > 0 && (
                    <div className="border-t border-purple-500/10 pt-5 space-y-3 text-left">
                      <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold font-mono">
                        Promotion Coupon
                      </span>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-emerald-300">
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <Tag className="w-4 h-4 text-emerald-400" />
                            <span>
                              Code <strong>{appliedCoupon.code}</strong> applied ({appliedCoupon.type === 'percentage' ? `${appliedCoupon.value}%` : `$${appliedCoupon.value}`} discount)
                            </span>
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="text-[10px] uppercase font-bold text-rose-400 hover:text-rose-300 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter Code (e.g. BUDDY20)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="flex-1 bg-[#150f29] border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-xl px-3 py-2 text-sm font-semibold uppercase text-slate-200 placeholder-slate-500 font-mono"
                          />
                          <button
                            type="submit"
                            disabled={isVerifyingCoupon || !couponInput}
                            className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600 hover:text-white transition-all text-xs font-bold font-mono text-purple-300 disabled:opacity-50 cursor-pointer"
                          >
                            {isVerifyingCoupon ? 'Checking...' : 'Apply'}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: PAYMENT GATEWAY */}
              {checkoutStep === 'payment' && (
                <div className="space-y-6 text-left" id="payment-gateways-container">
                  {/* Gateway selector - Hide when in form step for distraction-free form filling */}
                  {!(paymentGateway === 'upi' && upiStep === 'form') && (
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold font-mono mb-2.5">
                        Select Payment Gateway
                      </span>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { id: 'upi', label: 'UPI / QR Code', desc: 'Zero Fees Manual Verify' },
                          { id: 'stripe', label: 'Credit Card', desc: 'Secure Stripe Checkout' },
                          { id: 'paypal', label: 'PayPal', desc: 'Instant Wallet Pay' },
                          { id: 'razorpay', label: 'Razorpay', desc: 'All Card Systems' },
                          { id: 'crypto', label: 'Crypto', desc: 'BTC, ETH, LTC' },
                        ].map((gw) => (
                          <button
                            key={gw.id}
                            onClick={() => setPaymentGateway(gw.id as any)}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              paymentGateway === gw.id
                                ? 'bg-purple-500/10 border-purple-500 text-white shadow-lg'
                                : 'bg-[#150f29] border-purple-500/10 text-slate-400 hover:bg-[#1a1233] hover:text-slate-200'
                            }`}
                          >
                            <span className="block text-sm font-bold">{gw.label}</span>
                            <span className="block text-[10px] text-slate-500 font-mono mt-0.5">{gw.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input details based on gateway */}
                  {paymentGateway === 'upi' && upiStep === 'pay' && (
                    <div className="space-y-4">
                      {/* Step Title */}
                      <div className="flex justify-between items-center bg-purple-500/5 border border-purple-500/10 rounded-xl p-3">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Step 1 of 2: Scan & Pay</span>
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-mono font-bold ${
                          timeLeft < 180 ? 'bg-rose-500/15 text-rose-400 animate-pulse' : 'bg-cyan-500/10 text-cyan-400'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(timeLeft)}</span>
                        </div>
                      </div>

                      {/* Display Order ID */}
                      <div className="flex justify-between items-center text-xs font-semibold bg-black/30 border border-purple-500/5 rounded-xl px-4 py-3">
                        <span className="text-slate-400 font-mono">PRE-ASSIGNED ORDER ID:</span>
                        <span className="text-cyan-400 font-mono font-bold select-all">{generatedOrderId}</span>
                      </div>

                      {/* QR Code Container */}
                      <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-[#140e29] border border-purple-500/10 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none" />
                        
                        {/* Interactive Scanner laser simulation */}
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-cyan-500/40 animate-bounce pointer-events-none" />

                        {/* QR Code SVG */}
                        <div className="w-44 h-44 bg-white p-2 rounded-2xl shadow-xl shadow-purple-950/20 flex items-center justify-center relative">
                          <svg viewBox="0 0 100 100" className="w-full h-full text-[#110b21]">
                            {/* Outer Corners */}
                            <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                            <rect x="3" y="3" width="19" height="19" fill="white" />
                            <rect x="7" y="7" width="11" height="11" fill="currentColor" />

                            <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                            <rect x="78" y="3" width="19" height="19" fill="white" />
                            <rect x="82" y="7" width="11" height="11" fill="currentColor" />

                            <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                            <rect x="3" y="78" width="19" height="19" fill="white" />
                            <rect x="7" y="82" width="11" height="11" fill="currentColor" />

                            {/* Stylized Matrix dots simulating a real QR code */}
                            <rect x="35" y="5" width="5" height="10" fill="currentColor" />
                            <rect x="45" y="0" width="10" height="5" fill="currentColor" />
                            <rect x="60" y="10" width="5" height="15" fill="currentColor" />
                            
                            <rect x="5" y="35" width="10" height="5" fill="currentColor" />
                            <rect x="0" y="45" width="5" height="10" fill="currentColor" />
                            <rect x="10" y="60" width="15" height="5" fill="currentColor" />

                            <rect x="30" y="30" width="40" height="40" fill="currentColor" opacity="0.1" />

                            {/* Minecraft Sword styled pixels in the center */}
                            <path d="M48,32 L52,32 L52,36 L48,36 Z M44,36 L48,36 L48,40 L44,40 Z M48,40 L52,40 L52,44 L48,44 Z M52,44 L56,44 L56,48 L52,48 Z" fill="#8b5cf6" />
                            <path d="M52,40 L56,40 L56,44 L52,44 Z M56,44 L60,44 L60,48 L56,48 Z M60,48 L64,48 L64,52 L60,52 Z" fill="#06b6d4" />
                            <rect x="38" y="48" width="8" height="8" fill="currentColor" />
                            <rect x="54" y="62" width="8" height="8" fill="currentColor" />

                            {/* Random bits */}
                            <rect x="35" y="80" width="10" height="5" fill="currentColor" />
                            <rect x="40" y="85" width="5" height="10" fill="currentColor" />
                            <rect x="55" y="75" width="10" height="10" fill="currentColor" />
                            <rect x="70" y="35" width="15" height="10" fill="currentColor" />
                            <rect x="80" y="50" width="10" height="15" fill="currentColor" />
                            <rect x="85" y="85" width="10" height="10" fill="currentColor" />
                          </svg>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono font-bold mt-3 uppercase tracking-wider">
                          QR Code for Instant Scan
                        </span>
                      </div>

                      {/* Payment Instructions */}
                      <div className="space-y-3 bg-black/20 rounded-2xl border border-purple-500/10 p-4">
                        <div className="flex justify-between items-center border-b border-purple-500/5 pb-2.5">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">PAYABLE AMOUNT:</span>
                          <span className="text-sm font-black font-sans text-cyan-400">₹{total}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-mono">UPI ID:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-200 font-mono select-all">buddycraft@ybl</span>
                            <button
                              type="button"
                              onClick={handleCopyUpi}
                              className="p-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 transition-colors cursor-pointer"
                              title="Copy UPI ID"
                            >
                              {copiedUpi ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed font-semibold pt-1 border-t border-purple-500/5">
                          ⚠️ Scan QR or pay to UPI ID using any UPI App (GPay, PhonePe, Paytm). Pay exactly <span className="text-cyan-400">₹{total}</span> to avoid verification delays. Once paid, click the button below to fill out proof.
                        </p>
                      </div>
                    </div>
                  )}

                  {paymentGateway === 'upi' && upiStep === 'form' && (
                    <div className="space-y-4 bg-[#17102e] border border-purple-500/10 rounded-2xl p-5">
                      <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold font-mono uppercase mb-2">
                        <Sparkle className="w-4 h-4 text-purple-400" />
                        Verification Proof Details
                      </div>

                      <div className="space-y-3.5">
                        {/* Pre-assigned Order ID (Disabled) */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Order ID (Auto-Generated)</label>
                          <input
                            type="text"
                            disabled
                            value={generatedOrderId}
                            className="w-full bg-[#120c24] border border-purple-500/10 rounded-lg px-3 py-2 text-xs font-bold text-slate-500 font-mono"
                          />
                        </div>

                        {/* Minecraft Username */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 font-mono">Minecraft IGN</label>
                            <span className="text-[9px] text-purple-400 font-mono">Will receive rewards</span>
                          </div>
                          <input
                            type="text"
                            required
                            placeholder="Steve"
                            value={minecraftUsername}
                            onChange={(e) => setMinecraftUsername(e.target.value)}
                            className="w-full bg-[#120c24] border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-lg px-3 py-2 text-xs font-semibold text-slate-100"
                          />
                        </div>

                        {/* UTR Number */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="block text-[10px] uppercase font-bold text-slate-400 font-mono">UTR / Ref Number (12 Digits)</label>
                            <span className="text-[9px] text-cyan-400 font-mono font-bold">REQUIRED</span>
                          </div>
                          <input
                            type="text"
                            required
                            maxLength={12}
                            placeholder="604218937402"
                            value={utr}
                            onChange={(e) => setUtr(e.target.value.replace(/\D/g, ''))}
                            className="w-full bg-[#120c24] border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-lg px-3 py-2 text-xs font-semibold text-slate-100 font-mono"
                          />
                        </div>

                        {/* Discord Account */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Discord Username (Optional)</label>
                          <input
                            type="text"
                            placeholder="gamer_steve#1234"
                            value={discordUsername}
                            onChange={(e) => setDiscordUsername(e.target.value)}
                            className="w-full bg-[#120c24] border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-lg px-3 py-2 text-xs font-semibold text-slate-100"
                          />
                        </div>

                        {/* Drag and Drop Screenshot Simulation */}
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1.5 font-mono">Receipt Screenshot (Optional)</label>
                          <div 
                            onClick={() => {
                              if (isUploadingScreenshot) return;
                              setIsUploadingScreenshot(true);
                              addToast('Simulating screenshot upload...', 'info');
                              setTimeout(() => {
                                setIsUploadingScreenshot(false);
                                setScreenshotName('screenshot_receipt_' + Math.floor(1000 + Math.random() * 9000) + '.png');
                                addToast('Payment receipt screenshot attached!', 'success');
                              }, 1200);
                            }}
                            className="border border-dashed border-purple-500/20 hover:border-purple-500/40 bg-black/20 hover:bg-black/30 rounded-xl p-4.5 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-1.5"
                          >
                            {isUploadingScreenshot ? (
                              <>
                                <RefreshCw className="w-5 h-5 text-purple-400 animate-spin" />
                                <span className="text-[10px] font-mono text-slate-400">Uploading to ledger nodes...</span>
                              </>
                            ) : screenshotName ? (
                              <>
                                <CheckCircle className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-mono text-emerald-400 font-bold">{screenshotName} (142 KB)</span>
                                <span className="text-[9px] text-slate-500">Click to replace screenshot</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-5 h-5 text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-300">Drag & Drop or Click to Upload</span>
                                <span className="text-[9px] text-slate-500">Supports PNG, JPG, JPEG</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentGateway === 'stripe' && (
                    <div className="p-4 rounded-xl bg-[#17102e] border border-purple-500/10 space-y-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-bold font-mono uppercase mb-1">
                        <CreditCard className="w-4.5 h-4.5" />
                        Card Credentials (SIMULATED)
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Card Holder Name</label>
                        <input
                          type="text"
                          required
                          placeholder="Your Name (e.g. Steve Miner)"
                          value={fakeCardName}
                          onChange={(e) => setFakeCardName(e.target.value)}
                          className="w-full bg-[#120c24] border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-lg px-3 py-2 text-sm font-semibold text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1 font-mono">Card Details</label>
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          value={fakeCardNumber}
                          onChange={(e) => setFakeCardNumber(e.target.value)}
                          className="w-full bg-[#120c24] border border-purple-500/15 focus:border-purple-500/40 outline-none rounded-lg px-3 py-2 text-sm font-semibold text-slate-100 font-mono"
                        />
                      </div>
                    </div>
                  )}

                  {paymentGateway === 'crypto' && (
                    <div className="p-4 rounded-xl bg-[#17102e] border border-purple-500/10 space-y-3 text-sm">
                      <p className="text-xs font-semibold text-slate-300">
                        Complete your purchase by sending direct funds to our secure server wallet address:
                      </p>
                      <div className="p-3 bg-black/40 rounded-lg border border-purple-500/10 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-cyan-300 select-all block break-all">{fakeCryptoAddress}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Our gateway listens for decentralized confirmation block chains. Delivery of ranks occurs within minutes of ledger broadcast.
                      </p>
                    </div>
                  )}

                  {paymentGateway === 'paypal' && (
                    <div className="p-4 rounded-xl bg-[#17102e] border border-purple-500/10 text-center text-sm py-8 space-y-3">
                      <p className="text-slate-300 font-medium">Click checkout below to authorize via PayPal gateway proxy.</p>
                      <p className="text-[11px] text-slate-500">Includes secure bank debit channels.</p>
                    </div>
                  )}

                  {paymentGateway === 'razorpay' && (
                    <div className="p-4 rounded-xl bg-[#17102e] border border-purple-500/10 text-center text-sm py-8 space-y-3">
                      <p className="text-slate-300 font-medium">Allows UPI, Indian Debit Cards, NetBanking, and Wallets.</p>
                      <p className="text-[11px] text-slate-500">Secure transaction routing via Razorpay sandbox.</p>
                    </div>
                  )}

                  {/* Safety Notice */}
                  <div className="flex items-center gap-2.5 text-xs text-slate-500">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    <span>BuddyCraft uses end-to-end encrypted sandboxes. Your game assets are delivered securely.</span>
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS ANIMATION */}
              {checkoutStep === 'success' && placedOrder && (
                <div className="h-96 flex flex-col items-center justify-center text-center space-y-5" id="purchase-success-container">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400"
                  >
                    <CheckCircle className="w-8 h-8" />
                  </motion.div>
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {placedOrder.paymentGateway === 'upi' ? 'Proof Submitted!' : 'Payment Confirmed!'}
                    </h3>
                    <p className="text-xs text-cyan-400 font-bold font-mono mt-1 font-sans">ORDER ID: {placedOrder.id}</p>
                  </div>
                  <p className="text-sm text-slate-400 max-w-[280px]">
                    {placedOrder.paymentGateway === 'upi' ? (
                      <>
                        Awesome, <strong>{placedOrder.username}</strong>! Your UPI payment details for <strong>₹{placedOrder.total}</strong> have been uploaded. Our admin staff is validating your UTR.
                      </>
                    ) : (
                      <>
                        Awesome, <strong>{user?.username}</strong>! Your purchase total of <strong>₹{placedOrder.total}</strong> was completed. Your rewards are now queueing for in-game delivery!
                      </>
                    )}
                  </p>
                  {placedOrder.paymentGateway === 'upi' ? (
                    <div className="p-4 rounded-xl bg-[#1c152e] border border-yellow-500/20 w-full text-left space-y-1">
                      <span className="block text-[9px] uppercase tracking-wider text-yellow-500 font-bold font-mono">Verification Status</span>
                      <span className="text-xs font-black text-yellow-400 flex items-center gap-1.5 font-sans uppercase">
                        <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" /> PENDING VERIFICATION
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-1 leading-normal">
                        Our ledger is awaiting staff manual approval for UTR: <span className="text-cyan-400 font-bold">{placedOrder.paymentId}</span>. Check your user dashboard for live tracking updates!
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-[#150f29] border border-purple-500/15 w-full text-left space-y-1">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Delivery Status</span>
                      <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> PUSHING IN-GAME...
                      </span>
                    </div>
                  )}
                  <button
                    onClick={resetCheckout}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wider cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>

            {/* Sticky Summary / Action Footer */}
            {checkoutStep !== 'success' && cart.length > 0 && (
              <div className="p-6 border-t border-purple-500/10 bg-[#140e29] space-y-4">
                <div className="space-y-2.5 text-sm font-mono text-left">
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-400 text-xs">
                      <span>Discount</span>
                      <span>-₹{discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>Tax ({(taxRate * 100).toFixed(0)}%)</span>
                    <span>₹{tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white font-bold text-base border-t border-purple-500/5 pt-2.5 font-sans">
                    <span>Grand Total</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {checkoutStep === 'cart' ? (
                  <button
                    onClick={handleStartCheckout}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-purple-950/40 hover:shadow-purple-500/20 transition-all cursor-pointer"
                    id="checkout-next-btn"
                  >
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {paymentGateway === 'upi' ? (
                      upiStep === 'pay' ? (
                        <>
                          <button
                            onClick={() => setCheckoutStep('cart')}
                            className="py-3 rounded-xl bg-black/40 border border-purple-500/15 text-slate-300 text-xs font-bold cursor-pointer"
                          >
                            Back to Cart
                          </button>
                          <button
                            onClick={() => setUpiStep('form')}
                            className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5"
                            id="checkout-complete-btn"
                          >
                            {"I've Paid (Next)"}
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => setUpiStep('pay')}
                            disabled={isProcessingPayment}
                            className="py-3 rounded-xl bg-black/40 border border-purple-500/15 text-slate-300 text-xs font-bold cursor-pointer disabled:opacity-50"
                          >
                            Back to Scan
                          </button>
                          <button
                            onClick={handleCompletePayment}
                            disabled={isProcessingPayment}
                            className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 animate-pulse"
                            id="checkout-complete-btn"
                          >
                            {isProcessingPayment ? 'Submitting...' : 'Confirm Submit'}
                          </button>
                        </>
                      )
                    ) : (
                      <>
                        <button
                          onClick={() => setCheckoutStep('cart')}
                          disabled={isProcessingPayment}
                          className="py-3 rounded-xl bg-black/40 border border-purple-500/15 text-slate-300 text-xs font-bold cursor-pointer disabled:opacity-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleCompletePayment}
                          disabled={isProcessingPayment}
                          className="py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                          id="checkout-complete-btn"
                        >
                          {isProcessingPayment ? 'Processing...' : `Pay ₹${total}`}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
