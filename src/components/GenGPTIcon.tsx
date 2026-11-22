import React from 'react';

interface GenGPTIconProps {
  size?: number;
  className?: string;
  withBadge?: boolean;
}

/**
 * OmniGPT Iconic Emblem:
 * Crisp geometric concentric "O" orbital ring with emerald focal core.
 * When `withBadge` is true, renders the clean "O" circular assistant avatar.
 */
export const GenGPTIcon: React.FC<GenGPTIconProps> = ({
  size = 24,
  className = '',
  withBadge = false,
}) => {
  if (withBadge) {
    return (
      <div
        className="w-8 h-8 rounded-full bg-[#171717] dark:bg-white text-white dark:text-[#0d0d0d] flex items-center justify-center shrink-0 text-sm font-bold select-none shadow-xs"
        aria-label="OmniGPT"
      >
        O
      </div>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="21"
        stroke="currentColor"
        strokeWidth="4.6"
      />
      <path
        d="M32 17L45 24.5V39.5L32 47L19 39.5V24.5L32 17Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeOpacity="0.4"
      />
      <circle cx="32" cy="32" r="4.6" fill="#10A37F" />
    </svg>
  );
};
