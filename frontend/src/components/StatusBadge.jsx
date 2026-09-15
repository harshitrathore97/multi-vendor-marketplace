import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  let badgeClass = 'badge-muted';

  switch (status) {
    case 'DELIVERED':
    case 'APPROVED':
    case 'SUCCESS':
      badgeClass = 'badge-success';
      break;
    case 'SHIPPED':
    case 'OUT_FOR_DELIVERY':
    case 'PROCESSING':
    case 'CONFIRMED':
    case 'PENDING':
      badgeClass = 'badge-warning';
      break;
    case 'CANCELLED':
    case 'REJECTED':
    case 'SUSPENDED':
    case 'FAILED':
      badgeClass = 'badge-danger';
      break;
    case 'REFUNDED':
    case 'PLACED':
      badgeClass = 'badge-primary';
      break;
    default:
      badgeClass = 'badge-muted';
  }

  const formatted = status.replace(/_/g, ' ');

  return <span className={`badge ${badgeClass}`}>{formatted}</span>;
};

export default StatusBadge;
