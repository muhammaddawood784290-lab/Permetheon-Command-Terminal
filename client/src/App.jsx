// =====================================================================
// App — composes providers and router.
// =====================================================================

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SidebarProvider } from './context/SidebarContext';
import { ToastProvider } from './context/ToastContext';
import { NotificationProvider } from './context/NotificationContext';
import { ActivityProvider } from './context/ActivityContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <ActivityProvider>
              <SidebarProvider>
                <AppRoutes />
              </SidebarProvider>
            </ActivityProvider>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
