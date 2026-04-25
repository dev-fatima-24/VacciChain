import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = ++_id;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastList toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastList({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', right: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', zIndex: 9999 }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            borderRadius: 8,
            color: '#fff',
            fontSize: '0.9rem',
            maxWidth: 320,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '0.75rem',
            background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#0ea5e9',
          }}
        >
          <span>{t.message}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
