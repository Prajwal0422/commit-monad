import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const styles: Record<string, React.CSSProperties> = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    borderRadius: 'var(--radius)',
    border: '1px solid transparent',
    cursor: 'pointer',
    transition: 'background var(--transition), color var(--transition), border-color var(--transition), opacity var(--transition)',
    whiteSpace: 'nowrap',
    textDecoration: 'none',
    lineHeight: 1,
  },
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    borderColor: 'var(--accent)',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text)',
    borderColor: 'var(--border-hover)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    borderColor: 'transparent',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { fontSize: '13px', padding: '6px 14px', height: '32px' },
  md: { fontSize: '14px', padding: '10px 20px', height: '40px' },
  lg: { fontSize: '15px', padding: '13px 28px', height: '48px' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  style,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={{
        ...styles.base,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...(fullWidth ? { width: '100%' } : {}),
        ...(disabled ? { opacity: 0.45, cursor: 'not-allowed' } : {}),
        ...style,
      }}
    >
      {children}
    </button>
  );
}
