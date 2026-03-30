import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@quddify/ui/sonner";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ConnectionStatus } from "@/components/shared/ConnectionStatus";
import { DashboardSkeleton, GenerateFormSkeleton, CarouselResultSkeleton, ImageGridSkeleton, TableSkeleton } from "@/components/shared/LoadingSkeleton";

// Lazy-loaded pages for route-based code splitting
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Clients = lazy(() => import("@/pages/Clients"));
const ClientDetail = lazy(() => import("@/pages/ClientDetail"));
const ImageLibrary = lazy(() => import("@/pages/ImageLibrary"));
const TranscriptLibrary = lazy(() => import("@/pages/TranscriptLibrary"));
const SwipeFilePage = lazy(() => import("@/pages/SwipeFilePage"));
const Templates = lazy(() => import("@/pages/Templates"));
const GenerateCarousel = lazy(() => import("@/pages/GenerateCarousel"));
const GenerateStory = lazy(() => import("@/pages/GenerateStory"));
const CarouselResult = lazy(() => import("@/pages/CarouselResult"));
const HistoryPage = lazy(() => import("@/pages/HistoryPage"));
const LutLibrary = lazy(() => import("@/pages/LutLibrary"));
const CarouselStyles = lazy(() => import("@/pages/CarouselStyles"));
const ContentResearch = lazy(() => import("@/pages/ContentResearch"));
const PostInsights = lazy(() => import("@/pages/PostInsights"));
const ReelsGenerator = lazy(() => import("@/pages/ReelsGenerator"));
const ContentCalendar = lazy(() => import("@/pages/ContentCalendar"));
const OnboardClient = lazy(() => import("@/pages/OnboardClient"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Integrations = lazy(() => import("@/pages/Integrations"));
const GenerateThumbnails = lazy(() => import("@/pages/GenerateThumbnails"));
const OAuthCallback = lazy(() => import("@/pages/OAuthCallback"));

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

function isAuthenticated() {
  return !!localStorage.getItem("token");
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PageFallback({ skeleton }: { skeleton?: React.ReactNode }) {
  return (
    <div className="animate-in fade-in duration-300">
      {skeleton || <DashboardSkeleton />}
    </div>
  );
}

export default function App() {
  return (
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
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Dashboard /></Suspense></ErrorBoundary>} />
            <Route path="/clients" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<TableSkeleton rows={8} />} />}><Clients /></Suspense></ErrorBoundary>} />
            <Route path="/onboard" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<GenerateFormSkeleton />} />}><OnboardClient /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ClientDetail /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/images" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<ImageGridSkeleton />} />}><ImageLibrary /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/luts" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><LutLibrary /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/transcripts" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<TableSkeleton />} />}><TranscriptLibrary /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/swipe-file" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><SwipeFilePage /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/content-research" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ContentResearch /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/post-insights" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><PostInsights /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/generate" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<GenerateFormSkeleton />} />}><GenerateCarousel /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/stories" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<GenerateFormSkeleton />} />}><GenerateStory /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/thumbnails" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><GenerateThumbnails /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/carousels/:carouselId" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<CarouselResultSkeleton />} />}><CarouselResult /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/history" element={<ErrorBoundary><Suspense fallback={<PageFallback skeleton={<TableSkeleton />} />}><HistoryPage /></Suspense></ErrorBoundary>} />
            <Route path="/clients/:id/integrations" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Integrations /></Suspense></ErrorBoundary>} />
            <Route path="/calendar" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ContentCalendar /></Suspense></ErrorBoundary>} />
            <Route path="/reels" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><ReelsGenerator /></Suspense></ErrorBoundary>} />
            <Route path="/styles" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><CarouselStyles /></Suspense></ErrorBoundary>} />
            <Route path="/templates" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Templates /></Suspense></ErrorBoundary>} />
            <Route path="/analytics" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><Analytics /></Suspense></ErrorBoundary>} />
            <Route path="/settings/integrations" element={<ErrorBoundary><Suspense fallback={<PageFallback />}><OAuthCallback /></Suspense></ErrorBoundary>} />
          </Route>
        </Routes>
        <Toaster />
        <ConnectionStatus />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
