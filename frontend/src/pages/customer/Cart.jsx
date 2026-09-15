import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, Tag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';

const Cart = () => {
  const { cart, loading, error, updateQuantity, removeItem, applyCoupon, removeCoupon } = useCart();
  const { isAuthenticated } = useAuth();
  const [couponCode, setCouponCode] = React.useState('');
  const [couponMsg, setCouponMsg] = React.useState(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    const result = await applyCoupon(couponCode.trim());
    setCouponMsg(result);
    if (result?.success) setCouponCode('');
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px', margin: '3rem auto' }}>
        <ShoppingBag size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
        <h2>Sign in to view your cart</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Your shopping bag is waiting for you</p>
        <Link to="/login" className="btn btn-primary">Sign In</Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px', margin: '3rem auto' }}>
        <ShoppingBag size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
        <h2>Your Cart is Empty</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>Explore the marketplace and add items</p>
        <Link to="/products" className="btn btn-primary">Browse Products</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Shopping Cart ({cart.itemCount} items)</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        {/* Cart Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {cart.items.map((item) => (
            <div key={item._id} className="glass-card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
              <Link to={`/products/${item.productId}`}>
                <div style={{ width: '90px', height: '90px', borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: '#0f172a' }}>
                  <img src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </Link>
              <div style={{ flex: 1 }}>
                <Link to={`/products/${item.productId}`} style={{ fontWeight: 700, fontSize: '1rem' }}>{item.name}</Link>
                {item.vendor && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>by {item.vendor.businessName}</div>}
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>${item.price.toFixed(2)} each</div>
                {item.isOutOfStock && <span className="badge badge-danger" style={{ marginTop: '0.25rem' }}>Exceeds stock</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                <button onClick={() => updateQuantity(item.productId, Math.max(1, item.quantity - 1))} style={{ padding: '0.4rem 0.6rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><Minus size={14} /></button>
                <span style={{ padding: '0.4rem 0.75rem', fontWeight: 700, fontSize: '0.9rem' }}>{item.quantity}</span>
                <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} style={{ padding: '0.4rem 0.6rem', background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}><Plus size={14} /></button>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', minWidth: '80px', textAlign: 'right' }}>${item.subtotal.toFixed(2)}</div>
              <button onClick={() => removeItem(item.productId)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.4rem' }}><Trash2 size={18} color="#ef4444" /></button>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="glass-card" style={{ position: 'sticky', top: '5rem' }}>
          <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem' }}>Order Summary</h3>

          {/* Coupon */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <input className="form-input" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} style={{ flex: 1 }} />
            <button className="btn btn-secondary btn-sm" onClick={handleApplyCoupon}><Tag size={14} /> Apply</button>
          </div>
          {couponMsg && <div style={{ fontSize: '0.8rem', marginBottom: '0.75rem', color: couponMsg.success ? 'var(--success)' : 'var(--danger)' }}>{couponMsg.message}</div>}
          {cart.coupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', background: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>🏷️ {cart.coupon.code}</span>
              <button onClick={removeCoupon} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Remove</button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
            {cart.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--success)' }}>Discount</span><span style={{ color: 'var(--success)' }}>-${cart.discount.toFixed(2)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Delivery</span><span>{cart.deliveryFee === 0 ? <span style={{ color: 'var(--success)' }}>FREE</span> : `$${cart.deliveryFee.toFixed(2)}`}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Tax (5%)</span><span>${cart.tax.toFixed(2)}</span></div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.2rem' }}><span>Total</span><span>${cart.finalAmount.toFixed(2)}</span></div>
          </div>

          <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.85rem' }}>
            Proceed to Checkout <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
