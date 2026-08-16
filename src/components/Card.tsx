import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
  padding?: string;
}

export function Card({
  children,
  style,
  onClick,
  hoverable = false,
  padding = 'var(--space-6)',
}: CardProps) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border-hover)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-lg)',
        padding,
        transition: 'border-color var(--transition), box-shadow var(--transition)',
        ...(hoverable ? {
          cursor: 'pointer',
          boxShadow: hovered ? 'var(--shadow)' : 'none',
        } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  );
}
