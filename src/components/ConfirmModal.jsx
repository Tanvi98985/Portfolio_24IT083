import { useEffect } from 'react';

/**
 * Confirmation Dialog Component
 * Shown before destructive actions like deleting a task.
 */
function ConfirmModal({ isOpen, title = 'Confirm Deletion', message, onConfirm, onCancel, isDeleting = false }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        style={{
          backgroundColor: 'var(--white)',
          borderRadius: '10px',
          padding: '1.75rem',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          borderTop: '4px solid #d32f2f',
        }}
      >
        <h3 id="confirm-modal-title" style={{ color: 'var(--navy-dark)', marginTop: 0, marginBottom: '0.6rem', fontSize: '1.25rem' }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-gray)', fontSize: '0.95rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          {message || 'Are you sure you want to delete this task? This action cannot be undone.'}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="toggle-btn"
            style={{
              marginBottom: 0,
              backgroundColor: 'var(--light-gray)',
              color: 'var(--navy-dark)',
              border: '1px solid #ccc',
              padding: '0.5rem 1.1rem',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="submit-btn"
            style={{
              marginTop: 0,
              backgroundColor: '#d32f2f',
              padding: '0.5rem 1.2rem',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.7 : 1,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
