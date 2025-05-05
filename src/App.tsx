
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@/utils/analytics";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { Suspense, lazy } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import ProtectedLayout from "@/components/layout/ProtectedLayout";
import { MainLayout } from "@/components/layout/MainLayout";

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
const ProfilePage = lazy(() => import("@/pages/Profile"));
const RecipientsPage = lazy(() => import("@/pages/Recipients"));
const CheckInPage = lazy(() => import("@/pages/CheckIn"));
const AdminPage = lazy(() => import("@/pages/Admin"));
const PublicMessageAccess = lazy(() => import("@/pages/PublicMessageAccess"));

export default function App() {
  useErrorHandler();
  
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
                <Route path="access/message/:id" element={<PublicMessageAccess />} />
              </Route>
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedLayout />}>
                <Route path="messages" element={<MessagesPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="create-message" element={<CreateMessagePage />} />
                <Route path="message/:id" element={<MessageDetailPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="recipients" element={<RecipientsPage />} />
                <Route path="check-in" element={<CheckInPage />} />
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
