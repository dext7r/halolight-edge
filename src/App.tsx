import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeSettingsProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Roles from "./pages/Roles";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import NotFound from "./pages/NotFound";
import Forbidden from "./pages/Forbidden";
import ServerError from "./pages/ServerError";
import Unauthorized from "./pages/Unauthorized";
import Maintenance from "./pages/Maintenance";
import NetworkError from "./pages/NetworkError";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <ThemeSettingsProvider>
          <TooltipProvider>
            <AuthProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<Users />} />
                  <Route path="/roles" element={<Roles />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/audit-logs" element={<AuditLogs />} />
                  <Route path="/403" element={<Forbidden />} />
                  <Route path="/401" element={<Unauthorized />} />
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/503" element={<Maintenance />} />
                  <Route path="/offline" element={<NetworkError />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </TooltipProvider>
        </ThemeSettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
