import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = `/admin/products?page=${page}&limit=15${statusFilter ? `&approvalStatus=${statusFilter}` : ''}`;
        const res = await api.get(q);
        if (res.success) { setProducts(res.data.products); setTotalPages(res.data.totalPages); }
      } catch (err) { console.warn(err.message); }
      finally { setLoading(false); }
    };
    load();
  }, [page, statusFilter]);

  const handleApproval = async (id, status) => {
    try {
      const res = await api.patch(`/admin/products/${id}/approval`, { status });
      if (res.success) setProducts(products.map(p => p._id === id ? { ...p, approvalStatus: status } : p));
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>All Products</h1>
        <select className="form-select" style={{ maxWidth: '200px' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div> : (
        <>
          <div className="table-wrap">
            <table className="custom-table">
              <thead><tr><th>Name</th><th>Vendor</th><th>Category</th><th>Price</th><th>Stock</th><th>Approval</th><th>Actions</th></tr></thead>
              <tbody>
                {products.map(p => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.vendorId?.businessName}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.category}</td>
                    <td>${p.price?.toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td><StatusBadge status={p.approvalStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {p.approvalStatus !== 'APPROVED' && <button onClick={() => handleApproval(p._id, 'APPROVED')} className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '0.75rem' }}>Approve</button>}
                        {p.approvalStatus !== 'REJECTED' && <button onClick={() => handleApproval(p._id, 'REJECTED')} className="btn btn-sm btn-danger" style={{ fontSize: '0.75rem' }}>Reject</button>}
                      </div>
                    </td>
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

export default AdminProducts;
