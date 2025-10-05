import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div
    aria-label="CSCODE"
    className={[
      'relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-3xl',
      'bg-[radial-gradient(circle_at_top,#7b5bff,#251848)] shadow-[0_18px_40px_rgba(45,0,95,0.55)] ring-2 ring-[rgba(130,160,255,0.45)]',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25),transparent_55%)]" />
    <svg viewBox="0 0 120 120" className="relative h-full w-full text-white">
      <defs>
        <radialGradient id="nebula" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#e6f0ff" stopOpacity="0.95" />
          <stop offset="45%" stopColor="#8ec5ff" stopOpacity="0.55" />
          <stop offset="85%" stopColor="#6a36ff" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#1b0f3f" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="trail" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4ef2ff" />
          <stop offset="45%" stopColor="#7e6dff" />
          <stop offset="100%" stopColor="#ff78db" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r="46" fill="url(#nebula)" opacity="0.9" />
      <path
        d="M26 68c9-4 20-7 34-7s25 2 34 7c-2 14-16 28-34 28S28 82 26 68z"
        fill="rgba(12,18,52,0.45)"
        stroke="rgba(158,196,255,0.5)"
        strokeWidth="2"
      />
      <path
        d="M60 22c14 0 26 12 26 27 0 12-8 24-20 26l-6 13-6-13c-12-2-20-14-20-26 0-15 12-27 26-27z"
        fill="url(#trail)"
        stroke="rgba(240,248,255,0.7)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <circle cx="60" cy="48" r="12" fill="rgba(8,11,28,0.65)" stroke="rgba(236,242,255,0.8)" strokeWidth="2.5" />
      <circle cx="55" cy="45" r="4" fill="#ffffff" opacity="0.85" />
      <path
        d="M16 46c12-7 30-12 44-12s32 5 44 12"
        stroke="rgba(112,158,255,0.45)"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <circle cx="28" cy="42" r="3" fill="#ffffff" opacity="0.75" />
      <circle cx="95" cy="50" r="2.5" fill="#b9f1ff" opacity="0.7" />
      <circle cx="72" cy="32" r="2.5" fill="#ff94e6" opacity="0.8" />
    </svg>
  </div>
);

export default Logo;
