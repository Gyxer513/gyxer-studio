import React from 'react';

interface GyxerLogoProps {
  size?: number;
  className?: string;
}

/**
 * Gyxer brand logo — three curved petals (red, grey, dark)
 * Adapts fills for dark mode so petals remain visible.
 */
export function GyxerLogo({ size = 28, className = '' }: GyxerLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M16 4 C22 4 28 9 27 16 C26 11 21 8 16 8 Z" fill="#E53935" />
      <path d="M27 16 C28 23 22 29 15 27 C20 27 24 23 24 18 Z" fill="#757575" />
      <path
        d="M15 27 C8 28 3 22 5 15 C5 20 9 25 15 27 Z"
        fill="#1a1a1a"
        stroke="#555"
        strokeWidth="0.5"
      />
    </svg>
  );
}

/**
 * Full Gyxer logo with text
 */
export function GyxerLogoFull({ size = 28, className = '' }: GyxerLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <GyxerLogo size={size} />
      <span
        className="font-bold tracking-wide"
        style={{
          fontSize: size * 0.5,
          color: '#C8232C',
          letterSpacing: '0.08em',
        }}
      >
        GYXER
      </span>
    </div>
  );
}
