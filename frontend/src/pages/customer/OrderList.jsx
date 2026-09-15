import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Eye, MapPin } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/orders?page=${page}&limit=10`);
        if (res.success) { setOrders(res.data.orders); setTotalPages(res.data.totalPages); }
      } catch (err) { console.warn(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [page]);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading orders...</div>;

  if (orders.length === 0) return (
    <div className="glass-card" style={{ textAlign: 'center', padding: '4rem', maxWidth: '500px', margin: '3rem auto' }}>
      <Package size={48} color="#64748b" style={{ marginBottom: '1rem' }} />
      <h2>No Orders Yet</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Start shopping to see your orders here</p>
      <Link to="/products" className="btn btn-primary">Browse Products</Link>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>My Orders</h1>
      <div className="table-wrap">
        <table className="custom-table">
          <thead><tr><th>Order #</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th><th>Payment</th><th>Actions</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id}>
                <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{o.orderNumber}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                <td>{o.items?.length || 0} items</td>
                <td style={{ fontWeight: 700 }}>${o.totalAmount?.toFixed(2)}</td>
                <td><StatusBadge status={o.orderStatus} /></td>
                <td><StatusBadge status={o.paymentStatus} /></td>
                <td>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/orders/${o._id}`} className="btn btn-secondary btn-sm"><Eye size={14} /> View</Link>
                    <Link to={`/orders/${o._id}/track`} className="btn btn-secondary btn-sm"><MapPin size={14} /> Track</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ color: 'var(--text-secondary)', alignSelf: 'center' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
};

export default OrderList;
