import React from 'react';
import type { SignalStatus } from '../../types/lagrange';

interface SignalLightProps {
  status: SignalStatus;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showText?: boolean;
}

const STATUS_STYLE: Record<
  SignalStatus,
  { core: string; ring: string; glow: string; text: string; textColor: string }
> = {
  connected: {
    core: 'bg-[#2F855A]',
    ring: 'bg-[#34D399]',
    glow: 'shadow-[0_0_10px_rgba(47,133,90,0.55)]',
    text: '已接入',
    textColor: 'text-[#246A47]',
  },
  degraded: {
    core: 'bg-[#C07A28]',
    ring: 'bg-[#FBBF24]',
    glow: 'shadow-[0_0_10px_rgba(192,122,40,0.55)]',
    text: '降级延迟',
    textColor: 'text-[#9C611B]',
  },
  syncing: {
    core: 'bg-[#D97757]',
    ring: 'bg-[#F29B7B]',
    glow: 'shadow-[0_0_10px_rgba(217,119,87,0.55)]',
    text: '探测中',
    textColor: 'text-[#B85B3B]',
  },
  disconnected: {
    core: 'bg-[#9E9A90]',
    ring: 'bg-[#C2BEB5]',
    glow: 'shadow-none',
    text: '未接入',
    textColor: 'text-[#747068]',
  },
};

const SIZE_MAP = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

export const SignalLight: React.FC<SignalLightProps> = ({
  status,
  size = 'md',
  label,
  showText = false,
}) => {
  const cfg = STATUS_STYLE[status];
  const dim = SIZE_MAP[size];

  return (
    <span className="inline-flex items-center gap-2 select-none">
      <span className={`relative inline-flex items-center justify-center ${dim}`}>
        {status === 'connected' && (
          <span
            className={`absolute inset-0 rounded-full ${cfg.ring} animate-signal-ripple`}
          />
        )}
        {(status === 'degraded' || status === 'syncing') && (
          <span
            className={`absolute -inset-0.5 rounded-full ${cfg.ring} opacity-50 animate-signal-amber`}
          />
        )}
        <span
          className={`relative rounded-full ${dim} ${cfg.core} ${cfg.glow} transition-colors duration-300`}
        />
      </span>
      {(showText || label) && (
        <span className={`text-xs font-medium tracking-tight ${cfg.textColor}`}>
          {label ?? cfg.text}
        </span>
      )}
    </span>
  );
};
