import React from 'react';

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}

export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label
        htmlFor={id}
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-secondary)',
        }}
      >
        {label}
      </label>

      {children}

      {/* Hint or error — error takes priority */}
      {(error || hint) && (
        <p
          role={error ? 'alert' : undefined}
          style={{
            fontSize: '12px',
            color: error ? 'var(--danger)' : 'var(--text-muted)',
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

// ─── Shared input styles (exported so CreateCommitment can apply them) ────────
export const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '44px',
  padding: '0 14px',
  fontSize: '14px',
  fontFamily: 'var(--font-sans)',
  fontWeight: 400,
  color: 'var(--text)',
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  outline: 'none',
  transition: 'border-color var(--transition)',
  boxSizing: 'border-box',
};

export const inputErrorStyle: React.CSSProperties = {
  borderColor: 'var(--danger)',
};

export const inputFocusStyle: React.CSSProperties = {
  borderColor: 'var(--accent)',
};
