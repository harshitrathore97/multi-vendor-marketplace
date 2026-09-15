import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../../api/client';
import { useSocket } from '../../context/SocketContext';

const STEPS = ['PLACED', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STEP_LABELS = ['Order Placed', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const OrderTrack = () => {
  const { id } = useParams();
  const { socket } = useSocket();
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTracking = async () => {
    try {
      const res = await api.get(`/orders/${id}/track`);
      if (res.success) setTracking(res.data);
    } catch (err) { console.warn(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTracking(); }, [id]);

  // Real-time socket updates
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      if (data.orderId === id) {
        fetchTracking(); // Re-fetch to update stepper in real time
      }
    };
    socket.on('order:status_updated', handler);
    return () => socket.off('order:status_updated', handler);
  }, [socket, id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading tracking...</div>;
  if (!tracking) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Tracking info unavailable</div>;

  const isCancelled = tracking.isCancelled;
  const currentIdx = tracking.currentStepIndex;
  const progressWidth = isCancelled ? 0 : `${Math.max(0, (currentIdx / (STEPS.length - 1)) * 100)}%`;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Link to={`/orders/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}><ArrowLeft size={16} /> Order Details</Link>

      <div className="glass-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <h2 style={{ marginBottom: '0.5rem' }}>Track Order #{tracking.orderNumber}</h2>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
          Last updated: {new Date(tracking.lastUpdated).toLocaleString()}
        </div>

        {isCancelled ? (
          <div style={{ marginTop: '2rem', padding: '2rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>❌</div>
            <h3 style={{ color: 'var(--danger)' }}>Order Cancelled</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>This order has been cancelled. Inventory has been restored.</p>
          </div>
        ) : (
          <div>
            {/* Visual Stepper */}
            <div className="stepper" style={{ marginTop: '3rem' }}>
              <div className="stepper-line">
                <div className="stepper-line-progress" style={{ width: progressWidth }} />
              </div>
              {STEPS.map((step, i) => {
                const isCompleted = i < currentIdx;
                const isActive = i === currentIdx;
                return (
                  <div key={step} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="step-circle">
                      {isCompleted ? <Check size={18} /> : i + 1}
                    </div>
                    <div className="step-label">{STEP_LABELS[i]}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '2rem', fontSize: '1.1rem', fontWeight: 700 }}>
              Current Status: <span style={{ color: 'var(--primary)' }}>{tracking.currentStatus.replace(/_/g, ' ')}</span>
            </div>
          </div>
        )}

        {/* History */}
        {tracking.statusHistory?.length > 0 && (
          <div style={{ marginTop: '2.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Timeline</h3>
            {tracking.statusHistory.map((sh, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.6rem 0', borderLeft: '2px solid var(--border-color)', paddingLeft: '1.25rem', marginLeft: '0.5rem' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sh.status?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(sh.timestamp).toLocaleString()}</div>
                  {sh.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{sh.note}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTrack;
