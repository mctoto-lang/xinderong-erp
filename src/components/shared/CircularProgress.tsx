'use client';

import { cn } from '@/lib/utils';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercent?: boolean;
}

export function CircularProgress({
  value,
  size = 36,
  strokeWidth = 3,
  className,
  showPercent = true,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  // Color based on progress
  const getColor = () => {
    if (value >= 100) return 'text-green-500';
    if (value >= 60) return 'text-blue-500';
    if (value > 0) return 'text-orange-500';
    return 'text-gray-300';
  };

  const color = getColor();
  const isFull = value >= 100;
  const fontSize = size < 30 ? 8 : size < 40 ? 10 : 12;
  // Slight downward offset for visual centering of Latin numerals
  const textY = size / 2 + fontSize * 0.35;

  return (
    <div className={cn('inline-flex items-center', className)}>
      <svg width={size} height={size} className={color} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="opacity-20"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 -rotate-90 origin-center"
        />
        {/* Center content: checkmark when 100%, number otherwise */}
        {showPercent && !isFull && (
          <text
            x={size / 2}
            y={textY}
            textAnchor="middle"
            className="fill-current"
            style={{ fontSize, fontWeight: 600 }}
          >
            {Math.round(value)}
          </text>
        )}
        {showPercent && isFull && (
          <path
            d={`M ${size * 0.3} ${size * 0.52} L ${size * 0.44} ${size * 0.66} L ${size * 0.7} ${size * 0.36}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth * 1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-300"
          />
        )}
      </svg>
    </div>
  );
}
