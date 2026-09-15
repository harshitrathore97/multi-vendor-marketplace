import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/users?page=${page}&limit=15${search ? `&search=${search}` : ''}`);
      if (res.success) { setUsers(res.data.users); setTotalPages(res.data.totalPages); }
    } catch (err) { console.warn(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const handleBan = async (id, isActive) => {
    if (!confirm(`${isActive ? 'Ban' : 'Unban'} this user?`)) return;
    try {
      await api.patch(`/admin/users/${id}`, { isActive: !isActive });
      setUsers(users.map(u => u._id === id ? { ...u, isActive: !isActive } : u));
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem' }}>
        <h1 style={{ fontSize: '2rem' }}>Manage Users</h1>
        <input className="form-input" style={{ maxWidth: '280px' }} placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Loading...</div> : (
        <>
          <div className="table-wrap">
            <table className="custom-table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600 }}>{u.name}</td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-warning' : u.role === 'vendor' ? 'badge-info' : 'badge-secondary'}`}>{u.role}</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>{u.isActive ? 'Active' : 'Banned'}</span></td>
                    <td>
                      {u.role !== 'admin' && (
                        <button onClick={() => handleBan(u._id, u.isActive)} className={`btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-secondary'}`}>
                          {u.isActive ? 'Ban' : 'Unban'}
                        </button>
                      )}
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

export default AdminUsers;
