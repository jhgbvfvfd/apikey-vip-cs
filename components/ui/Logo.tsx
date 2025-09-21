import React from 'react';

const LOGO_URL = 'https://img2.pic.in.th/pic/received_1477586920220219.jpeg';

const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <div
    aria-label="CSCODE"
    className={[
      'relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-3xl',
      'bg-transparent shadow-xl ring-2 ring-blue-400/40',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <img
      src={LOGO_URL}
      alt="CSCODE Logo"
      className="relative h-full w-full object-cover"
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  </div>
);

export default Logo;
