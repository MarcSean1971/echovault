
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./contexts/AuthContext";
import { useEffect } from "react";

import AppLayout from "./components/layout/AppLayout";
import ProtectedLayout from "./components/layout/ProtectedLayout";
import AdminGuard from "./components/guards/AdminGuard";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import CreateMessage from "./pages/CreateMessage";
import Messages from "./pages/Messages";
import MessageDetail from "./pages/MessageDetail";
import MessageEdit from "./pages/MessageEdit";
import Recipients from "./pages/Recipients";
import CheckIn from "./pages/CheckIn";
import CheckIns from "./pages/CheckIns";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import SecureMessage from "./pages/SecureMessage";

// Create a new query client with error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      meta: {
        onError: (error: Error) => {
          console.error("Query error:", error);
        }
      }
    },
    mutations: {
      retry: 1,
      meta: {
        onError: (error: Error) => {
          console.error("Mutation error:", error);
        }
      }
    }
  }
});

const App = () => {
  // Clear any stale auth state on app load
  useEffect(() => {
    // This is a good place to handle any initialization logic
    console.log("App initialized");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<AppLayout />}>
                <Route index element={<Home />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="secure-message" element={<SecureMessage />} />
              </Route>
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedLayout />}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="create-message" element={<CreateMessage />} />
                <Route path="messages" element={<Messages />} />
                <Route path="message/:id" element={<MessageDetail />} />
                <Route path="message/:id/edit" element={<MessageEdit />} />
                <Route path="recipients" element={<Recipients />} />
                <Route path="check-in" element={<CheckIn />} />
                <Route path="check-ins" element={<CheckIns />} />
                <Route path="profile" element={<Profile />} />
                
                {/* Admin routes - protected by AdminGuard */}
                <Route element={<AdminGuard />}>
                  <Route path="admin" element={<Admin />} />
                </Route>
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
