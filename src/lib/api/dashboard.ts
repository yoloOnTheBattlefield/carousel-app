import api from "../api";
import type { DashboardOverview, CalendarData, AnalyticsData } from "@/hooks/useDashboard";

export const dashboardApi = {
  overview: () => api.get<DashboardOverview>("/dashboard/overview").then((r) => r.data),
  calendar: (month: string) =>
    api.get<CalendarData>("/dashboard/calendar", { params: { month } }).then((r) => r.data),
  analytics: (clientId?: string) =>
    api.get<AnalyticsData>("/dashboard/analytics", { params: clientId ? { client_id: clientId } : {} }).then((r) => r.data),
  scheduleCarousel: (id: string, scheduledDate: string | null) =>
    api.patch(`/dashboard/schedule/${id}`, { scheduled_date: scheduledDate }).then((r) => r.data),
};
