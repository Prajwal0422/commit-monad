import React from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'accent';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'rgba(136, 136, 160, 0.12)',
    color: 'var(--text-secondary)',
  },
  accent: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
  },
  success: {
    background: 'var(--success-dim)',
    color: 'var(--success)',
  },
  warning: {
    background: 'var(--warning-dim)',
    color: 'var(--warning)',
  },
  danger: {
    background: 'var(--danger-dim)',
    color: 'var(--danger)',
  },
};

export function Badge({ variant = 'default', children, style }: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        lineHeight: 1.4,
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
