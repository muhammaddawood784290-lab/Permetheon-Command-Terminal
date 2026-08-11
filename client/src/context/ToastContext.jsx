// =====================================================================
// ToastContext — minimal toast manager used across the app.
// =====================================================================

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const push = useCallback(
    (toast) => {
      const id = ++_id;
      const item = {
        id,
        type: 'info',
        duration: 4500,
        ...toast,
      };
      setToasts((current) => [...current, item]);
      if (item.duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), item.duration);
      }
      return id;
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      toasts,
      dismiss,
      info: (message, opts) => push({ type: 'info', message, ...opts }),
      success: (message, opts) => push({ type: 'success', message, ...opts }),
      warning: (message, opts) => push({ type: 'warning', message, ...opts }),
      error: (message, opts) => push({ type: 'error', message, ...opts }),
      push,
    }),
    [toasts, dismiss, push],
  );

  return <ToastContext.Provider value={api}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>.');
  return ctx;
}

export default ToastContext;
