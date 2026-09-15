import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const VENDOR_TRANSITIONS = {
  PENDING: ['PROCESSING', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
};

const VendorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/vendor/orders?page=${page}&limit=15`);
        if (res.success) { setOrders(res.data.orders); setTotalPages(res.data.totalPages); }
      } catch (err) { console.warn(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [page]);

  const handleUpdateStatus = async (orderItemId, newStatus) => {
    setUpdating(orderItemId);
    try {
      const res = await api.patch(`/vendor/orders/${orderItemId}/status`, { status: newStatus });
      if (res.success) {
        setOrders(orders.map(o => o._id === orderItemId ? { ...o, vendorStatus: newStatus } : o));
      }
    } catch (err) { alert(err.message); }
    finally { setUpdating(null); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Manage Orders</h1>
      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading orders...</div> : (
        <>
          {orders.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>No orders yet</div>
          ) : (
            <div className="table-wrap">
              <table className="custom-table">
                <thead><tr><th>Order #</th><th>Customer</th><th>Product</th><th>Qty</th><th>Amount</th><th>Status</th><th>Date</th><th>Update Status</th></tr></thead>
                <tbody>
                  {orders.map(o => {
                    const nextStatuses = VENDOR_TRANSITIONS[o.vendorStatus] || [];
                    return (
                      <tr key={o._id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{o.orderNumber}</td>
                        <td style={{ fontSize: '0.85rem' }}>{o.customerName}</td>
                        <td style={{ fontSize: '0.85rem' }}>{o.productName}</td>
                        <td>{o.quantity}</td>
                        <td>${o.amount?.toFixed(2)}</td>
                        <td><StatusBadge status={o.vendorStatus} /></td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                        <td>
                          {nextStatuses.length > 0 ? (
                            <select
                              className="form-select"
                              style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
                              disabled={updating === o._id}
                              value=""
                              onChange={(e) => { if (e.target.value) handleUpdateStatus(o._id, e.target.value); }}
                            >
                              <option value="">Move to...</option>
                              {nextStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Final</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
              <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VendorOrders;
