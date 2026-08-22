import { useEffect } from 'react';

/**
 * Toast Notification Component
 * Displays success or error feedback for CRUD operations.
 */
function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  return (
    <div
      className="toast-container"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 1000,
        backgroundColor: 'var(--navy-dark)',
        color: 'var(--white)',
        padding: '0.85rem 1.25rem',
        borderRadius: '8px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
        borderLeft: `5px solid ${isSuccess ? '#2e7d32' : '#d32f2f'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        maxWidth: '380px',
        animation: 'slideUp 0.3s ease-out',
      }}
    >
      <span style={{ fontSize: '1.1rem' }}>
        {isSuccess ? '✓' : '⚠'}
      </span>
      <p style={{ margin: 0, fontSize: '0.95rem', flex: 1, color: 'var(--white)' }}>
        {toast.message}
      </p>
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--white)',
          cursor: 'pointer',
          fontSize: '1.1rem',
          padding: '0 0.2rem',
          opacity: 0.8,
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export default Toast;
