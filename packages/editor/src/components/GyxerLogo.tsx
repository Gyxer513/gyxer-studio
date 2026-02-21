import React from 'react';

interface GyxerLogoProps {
  size?: number;
  className?: string;
}

/**
 * Gyxer brand logo — three curved blades (red, dark, grey)
 */
export function GyxerLogo({ size = 28, className = '' }: GyxerLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Red blade — top right */}
      <path
        d="M50 50 C50 30, 55 10, 75 5 C65 25, 62 40, 50 50Z"
        fill="#C8232C"
      />
      <path
        d="M50 50 C60 42, 78 35, 92 40 C75 38, 60 42, 50 50Z"
        fill="#C8232C"
      />
      <path
        d="M50 50 C55 30, 70 15, 92 40 C78 20, 58 22, 50 50Z"
        fill="#C8232C"
        opacity="0.9"
      />

      {/* Dark blade — bottom right */}
      <path
        d="M50 50 C60 55, 75 70, 75 92 C68 75, 58 62, 50 50Z"
        fill="#1A1A1A"
      />
      <path
        d="M50 50 C55 60, 55 80, 42 95 C50 78, 52 62, 50 50Z"
        fill="#1A1A1A"
      />
      <path
        d="M50 50 C65 62, 75 82, 42 95 C70 85, 60 65, 50 50Z"
        fill="#1A1A1A"
        opacity="0.9"
      />

      {/* Grey blade — left */}
      <path
        d="M50 50 C40 48, 22 42, 8 50 C22 44, 38 46, 50 50Z"
        fill="#999999"
      />
      <path
        d="M50 50 C42 42, 28 25, 15 18 C25 32, 38 42, 50 50Z"
        fill="#999999"
      />
      <path
        d="M50 50 C30 38, 12 25, 8 50 C10 30, 32 30, 50 50Z"
        fill="#999999"
        opacity="0.9"
      />

      {/* Center circle */}
      <circle cx="50" cy="50" r="6" fill="#C8232C" />
      <circle cx="50" cy="50" r="3" fill="white" />
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
