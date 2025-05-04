
import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { MessageListProvider } from "@/contexts/MessageListContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { PageLoader } from "@/components/ui/page-loader";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Analytics } from "@/utils/analytics";
import { LocationProvider } from "@/contexts/LocationContext";
import { useErrorHandler } from "@/hooks/useErrorHandler";

// Lazy-loaded pages
const HomePage = lazy(() => import("@/pages/Home"));
const MessagesPage = lazy(() => import("@/pages/Messages"));
const MessageDetailPage = lazy(() => import("@/pages/MessageDetail"));
const MessageEditPage = lazy(() => import("@/pages/MessageEdit"));
const MessageCreate = lazy(() => import("@/pages/MessageCreate"));
const ProfilePage = lazy(() => import("@/pages/Profile"));
const LoginPage = lazy(() => import("@/pages/Login"));
const RegisterPage = lazy(() => import("@/pages/Register"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPassword"));
const CheckInPage = lazy(() => import("@/pages/CheckIn"));
const NotFoundPage = lazy(() => import("@/pages/NotFound"));
const PanicButtonPage = lazy(() => import("@/pages/PanicButton"));
const DangerPage = lazy(() => import("@/pages/Danger"));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

function MainApp() {
  useErrorHandler();

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/message/:id" element={<MessageDetailPage />} />
        <Route path="/message/:id/edit" element={<MessageEditPage />} />
        <Route path="/create-message" element={<MessageCreate />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/check-in" element={<CheckInPage />} />
        <Route path="/panic-button" element={<PanicButtonPage />} />
        <Route path="/danger" element={<DangerPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MessageListProvider>
            <LocationProvider>
              <Toaster />
              <Sonner />
              <Analytics />
              <Suspense fallback={<PageLoader />}>
                <MainApp />
              </Suspense>
            </LocationProvider>
          </MessageListProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
