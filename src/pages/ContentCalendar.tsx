import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Badge } from "@quddify/ui/badge";
import { ChevronLeft, ChevronRight, Calendar, Instagram, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useCalendar, useScheduleCarousel, type CalendarEvent } from "@/hooks/useDashboard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { WorkflowPipeline } from "@/components/shared/WorkflowPipeline";
import type { CarouselStatus } from "@/types";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthString(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthStr: string): string {
  const [year, month] = monthStr.split("-").map(Number);
  return new Date(year, month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(() => getMonthString(new Date()));
  const [activeTab, setActiveTab] = useState<"calendar" | "queue">("calendar");
  const { data, isLoading } = useCalendar(currentMonth);
  const scheduleCarousel = useScheduleCarousel();

  const [year, month] = currentMonth.split("-").map(Number);

  function prevMonth() {
    const d = new Date(year, month - 2, 1);
    setCurrentMonth(getMonthString(d));
  }

  function nextMonth() {
    const d = new Date(year, month, 1);
    setCurrentMonth(getMonthString(d));
  }

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days: Array<{ day: number | null; events: CalendarEvent[] }> = [];

    // Leading blanks
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, events: [] });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEvents = (data?.events || []).filter((e) => {
        const eventDate = new Date(e.date);
        const eventDateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;
        return eventDateStr === dateStr;
      });
      days.push({ day: d, events: dayEvents });
    }

    return days;
  }, [year, month, data]);

  const today = new Date();
  const todayDay = today.getFullYear() === year && today.getMonth() + 1 === month ? today.getDate() : null;

  // Client color map for visual distinction
  const clientNames = [...new Set((data?.events || []).map((e) => e.client_name))];
  const clientColors: Record<string, string> = {};
  const colorPalette = [
    "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-amber-500",
    "bg-rose-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
    "bg-teal-500", "bg-orange-500",
  ];
  clientNames.forEach((name, i) => {
    clientColors[name] = colorPalette[i % colorPalette.length];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Content Calendar</h1>
          {/* Tab Switcher */}
          <div className="flex bg-[#111] border border-[#222] rounded-xl overflow-hidden">
            <button
              onClick={() => setActiveTab("calendar")}
              className={`px-4 py-1.5 text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "calendar" ? "bg-white text-black" : "text-[#555] hover:text-[#888]"
              }`}
            >
              <Calendar className="h-3.5 w-3.5" /> Calendar
            </button>
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-1.5 text-[12px] font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "queue" ? "bg-white text-black" : "text-[#555] hover:text-[#888]"
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> Queue
            </button>
          </div>
        </div>
        {activeTab === "calendar" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-40 text-center font-medium">{getMonthLabel(currentMonth)}</span>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {activeTab === "queue" && (
        <Card>
          <CardHeader>
            <CardTitle>Publishing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            {(data?.events || []).length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground mb-2">No scheduled carousels</p>
                <p className="text-xs text-[#444]">Schedule carousels from the carousel result page</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(data?.events || [])
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((event) => {
                    const eventDate = new Date(event.date);
                    const isPast = eventDate < new Date();
                    return (
                      <div
                        key={event._id}
                        className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                          isPast ? "border-[#222] bg-[#0a0a0a]" : "border-[#222] bg-[#111]"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            clientColors[event.client_name] || "bg-gray-500"
                          }`}>
                            <span className="text-white text-[12px] font-bold">
                              {eventDate.getDate()}
                            </span>
                          </div>
                          <div>
                            <Link
                              to={`/clients/${event.client_id}/carousels/${event._id}`}
                              className="text-[14px] font-medium text-white hover:underline"
                            >
                              {event.client_name}
                            </Link>
                            <p className="text-[12px] text-[#555] capitalize">
                              {event.goal.replace(/_/g, " ")} — {event.slides_count} slides
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <WorkflowPipeline status={event.status as CarouselStatus} compact />
                          <span className="text-[12px] text-[#555]">
                            {eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          {event.status === "ready" && (
                            <button
                              onClick={() => {
                                scheduleCarousel.mutate({ id: event._id, scheduled_date: null });
                              }}
                              className="text-[11px] text-[#555] hover:text-[#e84057] transition-colors cursor-pointer"
                              title="Unschedule"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "calendar" && clientNames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {clientNames.map((name) => (
            <div key={name} className="flex items-center gap-1.5 text-xs">
              <div className={`h-2.5 w-2.5 rounded-full ${clientColors[name]}`} />
              <span>{name}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === "calendar" && isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7">
              {DAYS.map((day) => (
                <div key={day} className="border-b px-2 py-2 text-center text-xs font-medium text-muted-foreground">
                  {day}
                </div>
              ))}
              {calendarDays.map((cell, i) => (
                <div
                  key={i}
                  className={`min-h-[100px] border-b border-r p-1.5 ${
                    cell.day === null ? "bg-muted/30" : ""
                  } ${cell.day === todayDay ? "bg-primary/5" : ""}`}
                >
                  {cell.day !== null && (
                    <>
                      <div className={`mb-1 text-xs ${cell.day === todayDay ? "font-bold text-primary" : "text-muted-foreground"}`}>
                        {cell.day}
                      </div>
                      <div className="space-y-0.5">
                        {cell.events.slice(0, 3).map((event) => (
                          <Link
                            key={event._id}
                            to={`/clients/${event.client_id}/carousels/${event._id}`}
                            className="block"
                          >
                            <div
                              className={`rounded px-1.5 py-0.5 text-[10px] text-white truncate hover:opacity-80 transition-opacity ${clientColors[event.client_name] || "bg-gray-500"}`}
                              title={`${event.client_name} — ${event.goal.replace(/_/g, " ")} — ${event.slides_count} slides`}
                            >
                              {event.client_name} · {event.goal.replace(/_/g, " ").split(" ")[0]}
                            </div>
                          </Link>
                        ))}
                        {cell.events.length > 3 && (
                          <div className="text-[10px] text-muted-foreground px-1.5 cursor-default" title={cell.events.slice(3).map((e) => e.client_name).join(", ")}>
                            +{cell.events.length - 3} more
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "calendar" && (data?.events || []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scheduled This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(data?.events || []).map((event) => (
                <div key={event._id} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${clientColors[event.client_name] || "bg-gray-500"}`} />
                    <div>
                      <Link to={`/clients/${event.client_id}/carousels/${event._id}`} className="text-sm font-medium hover:underline">
                        {event.client_name}
                      </Link>
                      <p className="text-xs capitalize text-muted-foreground">{event.goal.replace(/_/g, " ")} — {event.slides_count} slides</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <StatusBadge status={event.status} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
