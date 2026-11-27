import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  sheen?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const PAD_MAP = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  interactive = false,
  sheen = false,
  padding = 'md',
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={[
        'glass-card rounded-2xl',
        interactive ? 'glass-card-interactive cursor-pointer' : '',
        sheen ? 'glass-sheen' : '',
        PAD_MAP[padding],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
};
