import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Banknote, ShieldCheck, Loader } from 'lucide-react';
import api from '../../api/client';
import { useCart } from '../../context/CartContext';
import { v4 as uuidv4 } from 'uuid';

const Checkout = () => {
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '', phone: '', country: 'United States' });

  const handleChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!address.street || !address.city || !address.zipCode || !address.phone) {
      setError('Please complete all required address fields.');
      return;
    }
    try {
      setError(null);
      setLoading(true);

      // Step 1: Checkout (create order)
      const checkoutRes = await api.post('/checkout', { shippingAddress: address, paymentMethod });
      if (!checkoutRes.success) throw new Error(checkoutRes.message || 'Checkout failed');

      const order = checkoutRes.data.order;

      // Step 2: Process payment with idempotency key
      if (paymentMethod !== 'COD') {
        const idempotencyKey = `pay-${order._id}-${uuidv4().substring(0, 8)}`;
        const payRes = await api.post('/payments/create', {
          orderId: order._id,
          paymentMethod,
          idempotencyKey,
          paymentDetails: paymentMethod === 'CARD' ? { cardNumber: '4111111111111111', expiry: '12/28', cvv: '123' } : { upiId: 'user@upi' },
        });
        if (!payRes.success) {
          // Order was created but payment failed - navigate to order anyway
          setError('Order placed but payment failed. You can retry payment from your order page.');
        }
      }

      await fetchCart();
      navigate(`/orders/${order._id}`);
    } catch (err) {
      setError(err.message || 'Checkout error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  const methods = [
    { key: 'CARD', label: 'Credit/Debit Card', icon: <CreditCard size={20} /> },
    { key: 'UPI', label: 'UPI Payment', icon: <Smartphone size={20} /> },
    { key: 'COD', label: 'Cash on Delivery', icon: <Banknote size={20} /> },
  ];

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Checkout</h1>

      <form onSubmit={handlePlaceOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
        <div>
          {/* Shipping Address */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1.25rem' }}>Shipping Address</h3>
            <div className="form-group"><label className="form-label">Street Address *</label><input name="street" className="form-input" value={address.street} onChange={handleChange} required placeholder="742 Evergreen Terrace" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">City *</label><input name="city" className="form-input" value={address.city} onChange={handleChange} required placeholder="Springfield" /></div>
              <div className="form-group"><label className="form-label">State</label><input name="state" className="form-input" value={address.state} onChange={handleChange} placeholder="Oregon" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group"><label className="form-label">ZIP Code *</label><input name="zipCode" className="form-input" value={address.zipCode} onChange={handleChange} required placeholder="97477" /></div>
              <div className="form-group"><label className="form-label">Phone *</label><input name="phone" className="form-input" value={address.phone} onChange={handleChange} required placeholder="+1 555-0123" /></div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.25rem' }}>Payment Method</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {methods.map((m) => (
                <label key={m.key} onClick={() => setPaymentMethod(m.key)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', borderRadius: 'var(--radius-md)', border: `1px solid ${paymentMethod === m.key ? 'var(--primary)' : 'var(--border-color)'}`, background: paymentMethod === m.key ? 'rgba(99,102,241,0.1)' : 'var(--bg-input)', cursor: 'pointer', transition: 'var(--transition)' }}>
                  <input type="radio" name="payment" checked={paymentMethod === m.key} onChange={() => {}} style={{ display: 'none' }} />
                  <div style={{ background: paymentMethod === m.key ? 'var(--primary)' : 'var(--bg-card)', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: paymentMethod === m.key ? 'none' : '2px solid var(--border-color)' }}>{paymentMethod === m.key && <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '50%' }} />}</div>
                  {m.icon}
                  <span style={{ fontWeight: 600 }}>{m.label}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={14} color="#10b981" /> Simulated sandbox payment — no real money will be charged
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="glass-card" style={{ position: 'sticky', top: '5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Order Summary</h3>
          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
            {cart.items.map((item) => (
              <div key={item._id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity}</span>
                <span>${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>${cart.subtotal.toFixed(2)}</span></div>
            {cart.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--success)' }}>Discount</span><span style={{ color: 'var(--success)' }}>-${cart.discount.toFixed(2)}</span></div>}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Delivery</span><span>{cart.deliveryFee === 0 ? 'FREE' : `$${cart.deliveryFee.toFixed(2)}`}</span></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Tax</span><span>${cart.tax.toFixed(2)}</span></div>
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.3rem' }}><span>Total</span><span>${cart.finalAmount.toFixed(2)}</span></div>
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '1rem' }}>{error}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem', padding: '0.9rem', fontSize: '1rem' }} disabled={loading}>
            {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...</> : `Pay $${cart.finalAmount.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
