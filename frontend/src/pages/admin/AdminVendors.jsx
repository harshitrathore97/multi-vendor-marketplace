import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const AdminVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/vendors?page=${page}&limit=15`);
      if (res.success) { setVendors(res.data.vendors); setTotalPages(res.data.totalPages); }
    } catch (err) { console.warn(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVendors(); }, [page]);

  const handleApproval = async (id, status) => {
    try {
      const res = await api.patch(`/admin/vendors/${id}/approval`, { status });
      if (res.success) setVendors(vendors.map(v => v._id === id ? { ...v, approvalStatus: status } : v));
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Manage Vendors</h1>
      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div> : (
        <>
          <div className="table-wrap">
            <table className="custom-table">
              <thead><tr><th>Business</th><th>Owner</th><th>Category</th><th>Phone</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v._id}>
                    <td style={{ fontWeight: 700 }}>{v.businessName}</td>
                    <td style={{ fontSize: '0.85rem' }}>{v.userId?.name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.businessCategory}</td>
                    <td style={{ fontSize: '0.85rem' }}>{v.phone}</td>
                    <td>{v.productCount || 0}</td>
                    <td><StatusBadge status={v.approvalStatus} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {v.approvalStatus !== 'APPROVED' && (
                          <button onClick={() => handleApproval(v._id, 'APPROVED')} className="btn btn-sm" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success)', fontSize: '0.75rem' }}>Approve</button>
                        )}
                        {v.approvalStatus !== 'REJECTED' && (
                          <button onClick={() => handleApproval(v._id, 'REJECTED')} className="btn btn-sm btn-danger" style={{ fontSize: '0.75rem' }}>Reject</button>
                        )}
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

export default AdminVendors;
