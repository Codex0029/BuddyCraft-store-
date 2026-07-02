'use client';

import React, { useState } from 'react';
import { useApp, CartItem } from '@/context/AppContext';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, Tag, ArrowRight, ShieldCheck, CreditCard, Sparkles, CheckCircle, RefreshCw } from 'lucide-react';

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
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'paypal' | 'razorpay' | 'crypto'>('stripe');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any>(null);

  // Form states for fake checkout
  const [fakeCardName, setFakeCardName] = useState('');
  const [fakeCardNumber, setFakeCardNumber] = useState('');
  const [fakeCryptoAddress, setFakeCryptoAddress] = useState('0xBuddyCraftCryptoPaymentsAddressX719F');

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
    setCheckoutStep('payment');
  };

  const handleCompletePayment = async () => {
    if (paymentGateway === 'stripe' && (!fakeCardName || !fakeCardNumber)) {
      addToast('Please fill out card holder name and dummy card details.', 'error');
      return;
    }

    setIsProcessingPayment(true);
    addToast('Contacting safe gaming gateway...', 'info');

    // Simulate safe API wait
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
          }),
        });

        const data = await res.json();
        setIsProcessingPayment(false);

        if (res.ok && data.order) {
          setPlacedOrder(data.order);
          setCheckoutStep('success');
          clearCart();
          removeCoupon();
          addToast('Order placed successfully! Check your user dashboard.', 'success');
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
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-slate-400 font-bold font-mono mb-2.5">
                      Select Payment Gateway
                    </span>
                    <div className="grid grid-cols-2 gap-2.5">
                      {[
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

                  {/* Input details based on gateway */}
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
                    <h3 className="text-xl font-black text-white">Payment Confirmed!</h3>
                    <p className="text-xs text-cyan-400 font-bold font-mono mt-1">ORDER ID: {placedOrder.id}</p>
                  </div>
                  <p className="text-sm text-slate-400 max-w-[280px]">
                    Awesome, <strong>{user?.username}</strong>! Your purchase total of <strong>₹{placedOrder.total}</strong> was completed.
                    Your server rewards have been pushed and are currently queueing for delivery inside Minecraft!
                  </p>
                  <div className="p-4 rounded-xl bg-[#150f29] border border-purple-500/15 w-full text-left space-y-1">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold font-mono">Delivery Status</span>
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5 font-mono">
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" /> PUSHING IN-GAME...
                    </span>
                  </div>
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
