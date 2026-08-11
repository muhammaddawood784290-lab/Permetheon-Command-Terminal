// =====================================================================
// SidebarContext — tracks sidebar collapsed/expanded state and the
// mobile drawer.
// =====================================================================

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SidebarContext = createContext(null);

const STORAGE_KEY = 'pct_sidebar_collapsed';

function readInitial() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function SidebarProvider({ children }) {
  const [collapsed, setCollapsed] = useState(readInitial);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile drawer on resize to desktop width.
  useEffect(() => {
    const onResize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const value = useMemo(
    () => ({ collapsed, toggle, mobileOpen, openMobile, closeMobile }),
    [collapsed, toggle, mobileOpen, openMobile, closeMobile],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used inside <SidebarProvider>.');
  return ctx;
}

export default SidebarContext;
