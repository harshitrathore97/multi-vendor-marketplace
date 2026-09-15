import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, numReviews = null, size = 16, interactive = false, onSelect = null }) => {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <div style={{ display: 'flex', gap: '2px' }}>
        {stars.map((s) => {
          const filled = s <= Math.round(rating);
          return (
            <Star
              key={s}
              size={size}
              fill={filled ? '#f59e0b' : 'transparent'}
              color={filled ? '#f59e0b' : '#64748b'}
              style={{ cursor: interactive ? 'pointer' : 'default', transition: 'transform 0.1s ease' }}
              onClick={() => interactive && onSelect && onSelect(s)}
            />
          );
        })}
      </div>
      {numReviews !== null && (
        <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '0.25rem' }}>
          {rating.toFixed(1)} ({numReviews})
        </span>
      )}
    </div>
  );
};

export default RatingStars;
