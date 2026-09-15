import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = `/admin/orders?page=${page}&limit=15${statusFilter ? `&status=${statusFilter}` : ''}`;
        const res = await api.get(q);
        if (res.success) { setOrders(res.data.orders); setTotalPages(res.data.totalPages); }
      } catch (err) { console.warn(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [page, statusFilter]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>All Orders</h1>
        <select className="form-select" style={{ maxWidth: '200px' }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          {['PLACED','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div> : (
        <>
          <div className="table-wrap">
            <table className="custom-table">
              <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Order Status</th><th>Payment</th><th>Date</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{o.orderNumber}</td>
                    <td style={{ fontSize: '0.85rem' }}>{o.customer?.name || 'N/A'}</td>
                    <td>{o.items?.length || 0}</td>
                    <td style={{ fontWeight: 700 }}>${o.totalAmount?.toFixed(2)}</td>
                    <td><StatusBadge status={o.orderStatus} /></td>
                    <td><StatusBadge status={o.paymentStatus} /></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span style={{ alignSelf: 'center', color: 'var(--text-secondary)' }}>{page} / {totalPages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminOrders;
