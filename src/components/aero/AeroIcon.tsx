import React from 'react';

interface AeroIconProps {
  className?: string;
}

const AeroIcon: React.FC<AeroIconProps> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" />
    <path d="M35 45 Q50 40 65 45 L62 50 Q50 48 38 50 Z" />
    <rect x="46" y="50" width="8" height="8" rx="1" />
    <path d="M35 45 L25 42 M65 45 L75 42" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <ellipse cx="25" cy="42" rx="12" ry="2" />
    <ellipse cx="75" cy="42" rx="12" ry="2" />
    <path d="M42 50 L38 65 M58 50 L62 65" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

export default AeroIcon;
