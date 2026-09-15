import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, XCircle } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((res) => { if (res.success) setOrder(res.data.order); }).catch(console.warn).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true); setCancelError(null);
    try {
      const res = await api.patch(`/orders/${id}/cancel`);
      if (res.success) setOrder(res.data.order);
    } catch (err) { setCancelError(err.message); }
    finally { setCancelling(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading order...</div>;
  if (!order) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Order not found</div>;

  const canCancel = ['PLACED', 'CONFIRMED'].includes(order.orderStatus);

  return (
    <div>
      <Link to="/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}><ArrowLeft size={16} /> Back to Orders</Link>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem' }}>Order #{order.orderNumber}</h1>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Placed on {new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <StatusBadge status={order.orderStatus} />
          <StatusBadge status={order.paymentStatus} />
          <Link to={`/orders/${id}/track`} className="btn btn-secondary btn-sm"><MapPin size={14} /> Track</Link>
          {canCancel && <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelling}><XCircle size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}</button>}
        </div>
      </div>
      {cancelError && <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.85rem' }}>{cancelError}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', alignItems: 'start' }}>
        <div>
          {/* Items */}
          <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Order Items</h3>
            {order.items?.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: i < order.items.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: '#0f172a', flexShrink: 0 }}>
                  <img src={item.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150&auto=format&fit=crop&q=80'} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{item.productName}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {item.vendorId?.businessName || 'Vendor'}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>${item.priceAtPurchase?.toFixed(2)} × {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700 }}>${item.subtotal?.toFixed(2)}</div>
                <StatusBadge status={item.vendorStatus} />
              </div>
            ))}
          </div>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <div className="glass-card">
              <h3 style={{ marginBottom: '1rem' }}>Status Timeline</h3>
              {order.statusHistory.map((sh, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: i === order.statusHistory.length - 1 ? 'var(--primary)' : 'var(--text-muted)', marginTop: '4px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sh.status?.replace(/_/g, ' ')}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(sh.timestamp).toLocaleString()}</div>
                    {sh.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{sh.note}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div className="glass-card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Price Breakdown</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span></div>
              {order.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--success)' }}>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span><span style={{ color: 'var(--success)' }}>-${order.discount.toFixed(2)}</span></div>}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Delivery</span><span>{order.deliveryFee === 0 ? 'FREE' : `$${order.deliveryFee?.toFixed(2)}`}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-secondary)' }}>Tax</span><span>${order.tax?.toFixed(2)}</span></div>
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}><span>Total</span><span>${order.totalAmount?.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="glass-card">
            <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>Shipping To</h3>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              <div>{order.shippingAddress?.street}</div>
              <div>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</div>
              <div>{order.shippingAddress?.country}</div>
              <div style={{ marginTop: '0.25rem' }}>📞 {order.shippingAddress?.phone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
