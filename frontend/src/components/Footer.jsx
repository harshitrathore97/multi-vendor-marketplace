import React from 'react';
import { ShoppingBag, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

const Footer = () => {
  return (
    <footer style={{ borderTop: '1px solid var(--border-color)', background: 'rgba(15, 23, 42, 0.6)', marginTop: '4rem', padding: '3rem 2rem 1.5rem' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        {/* Marketplace Guarantees */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '2rem', marginBottom: '3rem', paddingBottom: '2.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <Truck size={24} color="#6366f1" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Fast Delivery</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Free shipping on orders over $100</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <ShieldCheck size={24} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Verified Vendors</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Strictly vetted merchants & reviews</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem', borderRadius: '12px' }}>
              <RefreshCw size={24} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Instant Refunds</div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Automated inventory & payment return</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', fontSize: '0.85rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={18} color="#6366f1" />
            <span style={{ fontWeight: 700, color: '#f8fafc' }}>OmniMarket Platform</span>
            <span>&copy; {new Date().getFullYear()} All rights reserved.</span>
          </div>
          <div>Built with React, Node.js, Express & Socket.IO</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
