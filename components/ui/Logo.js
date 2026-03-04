'use client';

export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: { w: 120, h: 28 },
    md: { w: 150, h: 34 },
    lg: { w: 180, h: 40 },
  };
  const { w, h } = sizes[size] || sizes.md;

  return (
    <svg width={w} height={h} viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield icon */}
      <rect x="2" y="4" width="32" height="32" rx="8" fill="#00B7AF" />
      <path
        d="M18 10L10 14V20C10 25.5 13.4 30.7 18 32C22.6 30.7 26 25.5 26 20V14L18 10Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M16.5 23.5L13.5 20.5L14.9 19.1L16.5 20.7L21.1 16.1L22.5 17.5L16.5 23.5Z"
        fill="#00B7AF"
      />

      {/* SAFE text */}
      <text x="42" y="20" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" fill="#1E293B" letterSpacing="0.5">
        SAFE
      </text>

      {/* BUDDY text */}
      <text x="88" y="20" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" fill="#00B7AF" letterSpacing="0.5">
        BUDDY
      </text>

      {/* Subtitle */}
      <text x="42" y="33" fontFamily="system-ui, -apple-system, sans-serif" fontSize="8" fontWeight="500" fill="#94A3B8" letterSpacing="1.5">
        SAFETY BUDGET SYSTEM
      </text>
    </svg>
  );
}

export function LogoWhite({ size = 'md' }) {
  const sizes = {
    sm: { w: 120, h: 28 },
    md: { w: 150, h: 34 },
    lg: { w: 180, h: 40 },
  };
  const { w, h } = sizes[size] || sizes.md;

  return (
    <svg width={w} height={h} viewBox="0 0 180 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shield icon */}
      <rect x="2" y="4" width="32" height="32" rx="8" fill="#00B7AF" />
      <path
        d="M18 10L10 14V20C10 25.5 13.4 30.7 18 32C22.6 30.7 26 25.5 26 20V14L18 10Z"
        fill="white"
        fillOpacity="0.9"
      />
      <path
        d="M16.5 23.5L13.5 20.5L14.9 19.1L16.5 20.7L21.1 16.1L22.5 17.5L16.5 23.5Z"
        fill="#00B7AF"
      />

      {/* SAFE text */}
      <text x="42" y="20" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" fill="#FFFFFF" letterSpacing="0.5">
        SAFE
      </text>

      {/* BUDDY text */}
      <text x="88" y="20" fontFamily="system-ui, -apple-system, sans-serif" fontSize="16" fontWeight="800" fill="#00B7AF" letterSpacing="0.5">
        BUDDY
      </text>

      {/* Subtitle */}
      <text x="42" y="33" fontFamily="system-ui, -apple-system, sans-serif" fontSize="8" fontWeight="500" fill="#64748B" letterSpacing="1.5">
        SAFETY BUDGET SYSTEM
      </text>
    </svg>
  );
}
