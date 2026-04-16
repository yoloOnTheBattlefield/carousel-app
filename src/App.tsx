import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@quddify/ui/sonner";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ClientProvider } from "@/contexts/ClientContext";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ImageGridSkeleton } from "@/components/shared/LoadingSkeleton";

const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const CreateCarousel = lazy(() => import("@/pages/CreateCarousel"));
const CarouselEditor = lazy(() => import("@/pages/CarouselEditor"));
const ImageLibrary = lazy(() => import("@/pages/ImageLibrary"));
const ClientSettings = lazy(() => import("@/pages/ClientSettings"));
const OutreachCreate = lazy(() => import("@/pages/OutreachCreate"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageFallback({ skeleton }: { skeleton?: React.ReactNode }) {
  return (
    <div className="animate-in fade-in duration-300">
      {skeleton || <div />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <Suspense fallback={<div className="flex items-center justify-center min-h-screen" />}>
                  <Login />
                </Suspense>
              }
            />
            <Route
              element={
                <ProtectedRoute>
                  <ClientProvider>
                    <AppShell />
                  </ClientProvider>
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Dashboard /></Suspense></ErrorBoundary>} />
              <Route path="/create" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><CreateCarousel /></Suspense></ErrorBoundary>} />
              <Route path="/carousels/:id" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><CarouselEditor /></Suspense></ErrorBoundary>} />
              <Route path="/images" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<ImageGridSkeleton />} />}><ImageLibrary /></Suspense></ErrorBoundary>} />
              <Route path="/outreach" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><OutreachCreate /></Suspense></ErrorBoundary>} />
              <Route path="/settings" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ClientSettings /></Suspense></ErrorBoundary>} />
            </Route>
          </Routes>
          <Toaster />
        </BrowserRouter>
      </QueryClientProvider>
    </AuthProvider>
  );
}
