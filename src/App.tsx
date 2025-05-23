
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@/utils/analytics";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Suspense, lazy, useEffect } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";
import AppLayout from "@/components/layout/AppLayout";
import PublicAppLayout from "@/components/layout/PublicAppLayout";
import { enableRealtimeForConditions, checkRealtimeStatus } from "@/services/messages/whatsApp/realtimeHelper";

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Lazy-loaded pages
const HomePage = lazy(() => import("@/pages/Home"));
const LoginPage = lazy(() => import("@/pages/Login"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const MessagesPage = lazy(() => import("@/pages/Messages"));
const DashboardPage = lazy(() => import("@/pages/Dashboard"));
const CreateMessagePage = lazy(() => import("@/pages/CreateMessage"));
const MessageDetailPage = lazy(() => import("@/pages/MessageDetail"));
const MessageEdit = lazy(() => import("@/pages/MessageEdit"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const RecipientsPage = lazy(() => import("@/pages/Recipients"));
const AdminPage = lazy(() => import("@/pages/Admin"));
const PublicMessageAccess = lazy(() => import("@/pages/PublicMessageAccess"));
const DiagnosticAccess = lazy(() => import("@/pages/DiagnosticAccess"));

export default function App() {
  useErrorHandler();
  
  // Enable Realtime functionality for WhatsApp check-ins
  useEffect(() => {
    const initializeRealtime = async () => {
      // First check Realtime connectivity
      const realtimeStatus = await checkRealtimeStatus();
      console.log(`[App] Realtime connectivity status: ${realtimeStatus}`);
      
      if (realtimeStatus === 'SUBSCRIBED') {
        // If connectivity is good, enable Realtime for message_conditions table
        const success = await enableRealtimeForConditions();
        if (success) {
          console.log("[App] Realtime enabled for message_conditions table");
        } else {
          console.warn("[App] Could not enable Realtime for message_conditions table");
        }
      } else {
        console.error(`[App] Realtime connectivity check failed: ${realtimeStatus}`);
      }
    };
    
    initializeRealtime();
    
    // Set up a global listener for the conditions-updated event for debugging purposes
    const handleConditionsUpdated = (event: Event) => {
      if (event instanceof CustomEvent) {
        console.log('[App] Global conditions-updated event received:', event.detail);
      }
    };
    
    window.addEventListener('conditions-updated', handleConditionsUpdated);
    
    return () => {
      window.removeEventListener('conditions-updated', handleConditionsUpdated);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Analytics />
          <Toaster />
          <Sonner />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
              </Route>
              
              {/* Public message access route - using PublicAppLayout */}
              <Route path="/access/message/:id" element={<PublicAppLayout />}>
                <Route index element={<PublicMessageAccess />} />
              </Route>
              
              {/* Diagnostic route for troubleshooting */}
              <Route path="/diagnostic/message/:id" element={<AppLayout isLoggedIn={false} />}>
                <Route index element={<DiagnosticAccess />} />
              </Route>
              <Route path="/diagnostic" element={<AppLayout isLoggedIn={false} />}>
                <Route index element={<DiagnosticAccess />} />
              </Route>
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedLayout />}>
                <Route path="messages" element={<MessagesPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="create-message" element={<CreateMessagePage />} />
                <Route path="message/:id" element={<MessageDetailPage />} />
                <Route path="message/:id/edit" element={<MessageEdit />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="recipients" element={<RecipientsPage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>
              
              {/* Fallback route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
