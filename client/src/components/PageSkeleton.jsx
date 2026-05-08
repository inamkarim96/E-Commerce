
import React from 'react';

const shimmer = {
  background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
};

// Inject the keyframe once (idempotent)
if (typeof document !== 'undefined' && !document.getElementById('skeleton-shimmer-style')) {
  const style = document.createElement('style');
  style.id = 'skeleton-shimmer-style';
  style.textContent = `
    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

// Generic skeleton block
const SkeletonBlock = ({ width = '100%', height = 16, radius = 8, style = {} }) => (
  <div
    style={{
      ...shimmer,
      width,
      height,
      borderRadius: radius,
      ...style,
    }}
  />
);

// Product card skeleton
const ProductCardSkeleton = () => (
  <div style={{ borderRadius: 16, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
    <SkeletonBlock height={240} radius={0} />
    <div style={{ padding: '16px' }}>
      <SkeletonBlock width="40%" height={12} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="80%" height={18} style={{ marginBottom: 8 }} />
      <SkeletonBlock width="50%" height={14} style={{ marginBottom: 16 }} />
      <SkeletonBlock width="60%" height={20} />
    </div>
  </div>
);

// Product grid skeleton (shown on shop/landing pages)
export const ProductGridSkeleton = ({ count = 8 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
      gap: 24,
      padding: '16px 0',
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

// Full-page skeleton for route-level loading
const PageSkeleton = () => (
  <div style={{ minHeight: '100vh', background: '#fafafa', padding: '24px' }}>
    {/* Navbar placeholder */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 40,
      padding: '0 16px',
    }}>
      <SkeletonBlock width={140} height={32} />
      <div style={{ display: 'flex', gap: 24 }}>
        {[120, 80, 80, 80].map((w, i) => <SkeletonBlock key={i} width={w} height={14} />)}
      </div>
      <SkeletonBlock width={80} height={36} radius={20} />
    </div>

    {/* Hero/banner placeholder */}
    <SkeletonBlock height={320} radius={20} style={{ marginBottom: 48 }} />

    {/* Products grid */}
    <ProductGridSkeleton count={8} />
  </div>
);

export default PageSkeleton;
