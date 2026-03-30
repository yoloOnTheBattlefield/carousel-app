import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface ClientSummary {
  _id: string;
  name: string;
  slug: string;
  niche: string;
  total_carousels: number;
  ready_carousels: number;
  pending_carousels: number;
  failed_carousels: number;
  total_transcripts: number;
  total_images: number;
  last_carousel_date: string | null;
  avg_confidence: number | null;
  has_brand_kit: boolean;
  has_voice_profile: boolean;
}

export interface RecentCarousel {
  _id: string;
  client_id: string;
  client_name: string;
  goal: string;
  slides_count: number;
  confidence: number;
  status: string;
  created_at: string;
}

export interface DashboardOverview {
  totals: {
    clients: number;
    carousels: number;
    ready_carousels: number;
    pending_carousels: number;
  };
  clients: ClientSummary[];
  recent_carousels: RecentCarousel[];
}

export function useDashboardOverview() {
  return useQuery<DashboardOverview>({
    queryKey: ["dashboard-overview"],
    queryFn: () => api.get("/dashboard/overview").then((r) => r.data),
  });
}

export interface CalendarEvent {
  _id: string;
  client_id: string;
  client_name: string;
  goal: string;
  status: string;
  confidence: number;
  slides_count: number;
  scheduled_date: string | null;
  created_at: string;
  date: string;
}

export interface CalendarData {
  events: CalendarEvent[];
  month: string;
}

export function useCalendar(month: string) {
  return useQuery<CalendarData>({
    queryKey: ["calendar", month],
    queryFn: () => api.get("/dashboard/calendar", { params: { month } }).then((r) => r.data),
  });
}

export interface AnalyticsData {
  total_carousels: number;
  goal_distribution: Record<string, number>;
  confidence_breakdown: {
    avg_overall: number;
    avg_hook_strength: number;
    avg_image_copy_fit: number;
    avg_brand_fit: number;
    avg_style_fit: number;
    avg_cta_fit: number;
    avg_save_potential: number;
    avg_dm_potential: number;
  };
  monthly_trend: Array<{ month: string; count: number; avg_confidence: number }>;
  client_breakdown: Array<{ _id: string; name: string; total: number; avg_confidence: number }>;
  top_carousels: Array<{
    _id: string;
    client_id: string;
    client_name: string;
    goal: string;
    confidence: number;
    created_at: string;
  }>;
}

export function useAnalytics(clientId?: string) {
  return useQuery<AnalyticsData>({
    queryKey: ["analytics", clientId],
    queryFn: () => api.get("/dashboard/analytics", { params: clientId ? { client_id: clientId } : {} }).then((r) => r.data),
  });
}

export function useScheduleCarousel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduled_date }: { id: string; scheduled_date: string | null }) =>
      api.patch(`/dashboard/schedule/${id}`, { scheduled_date }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["calendar"] });
      qc.invalidateQueries({ queryKey: ["dashboard-overview"] });
    },
  });
}
