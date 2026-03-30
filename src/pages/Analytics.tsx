import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@quddify/ui/table";
import { Download, FileText } from "lucide-react";
import { useAnalytics } from "@/hooks/useDashboard";
import { ConfidenceBadge } from "@/components/carousel/ConfidenceBadge";
import { DashboardSkeleton } from "@/components/shared/LoadingSkeleton";

const GOAL_LABELS: Record<string, string> = {
  saveable_educational: "Saveable Educational",
  polarizing_authority: "Polarizing Authority",
  emotional_story: "Emotional Story",
  conversion_focused: "Conversion Focused",
};

function StatBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${value >= 70 ? "bg-emerald-500" : value >= 40 ? "bg-amber-500" : "bg-red-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data, isLoading } = useAnalytics();

  const exportCSV = useCallback(() => {
    if (!data) return;
    const rows = [
      ["Metric", "Value"],
      ["Total Carousels", String(data.total_carousels)],
      ["Avg Confidence", String(data.confidence_breakdown.avg_overall)],
      ["Avg Hook Strength", String(data.confidence_breakdown.avg_hook_strength)],
      ["Avg Image-Copy Fit", String(data.confidence_breakdown.avg_image_copy_fit)],
      ["Avg Brand Fit", String(data.confidence_breakdown.avg_brand_fit)],
      ["Avg Style Fit", String(data.confidence_breakdown.avg_style_fit)],
      ["Avg CTA Fit", String(data.confidence_breakdown.avg_cta_fit)],
      ["Avg Save Potential", String(data.confidence_breakdown.avg_save_potential)],
      ["Avg DM Potential", String(data.confidence_breakdown.avg_dm_potential)],
      [""],
      ["Goal", "Count"],
      ...Object.entries(data.goal_distribution).map(([goal, count]) => [goal, String(count)]),
      [""],
      ["Month", "Count", "Avg Confidence"],
      ...data.monthly_trend.map((m) => [m.month, String(m.count), String(m.avg_confidence)]),
      [""],
      ["Client", "Total Carousels", "Avg Confidence"],
      ...data.client_breakdown.map((c) => [c.name, String(c.total), String(c.avg_confidence)]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  const { confidence_breakdown: cb, goal_distribution, monthly_trend, client_breakdown, top_carousels } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Analytics & Reporting</h1>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-[#111] border border-[#222] rounded-xl px-4 py-2 text-[13px] font-medium text-[#888] hover:border-[#333] hover:text-white transition-all cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Carousels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_carousels}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cb.avg_overall}<span className="text-sm text-muted-foreground">/100</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold capitalize">
              {Object.entries(goal_distribution).sort(([, a], [, b]) => b - a)[0]?.[0]?.replace(/_/g, " ") || "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Confidence Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatBar label="Overall" value={cb.avg_overall} />
            <StatBar label="Hook Strength" value={cb.avg_hook_strength} />
            <StatBar label="Image-Copy Fit" value={cb.avg_image_copy_fit} />
            <StatBar label="Brand Fit" value={cb.avg_brand_fit} />
            <StatBar label="Style Fit" value={cb.avg_style_fit} />
            <StatBar label="CTA Fit" value={cb.avg_cta_fit} />
            <StatBar label="Save Potential" value={cb.avg_save_potential} />
            <StatBar label="DM Potential" value={cb.avg_dm_potential} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Goal Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(goal_distribution).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(goal_distribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([goal, count]) => {
                    const pct = Math.round((count / data.total_carousels) * 100);
                    return (
                      <div key={goal} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>{GOAL_LABELS[goal] || goal}</span>
                          <span className="font-medium">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Trend</CardTitle>
            <span className="text-xs text-muted-foreground">Carousels generated per month</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2" style={{ height: 160 }}>
            {monthly_trend.map((m) => {
              const maxCount = Math.max(...monthly_trend.map((t) => t.count), 1);
              const height = m.count === 0 ? 4 : Math.max(8, (m.count / maxCount) * 140);
              return (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-medium">{m.count}</span>
                  <div
                    className={`w-full rounded-t transition-all ${m.count === 0 ? "bg-muted" : "bg-primary"}`}
                    style={{ height }}
                    title={`${m.count} carousels, avg confidence: ${m.avg_confidence}`}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(`${m.month}-01`).toLocaleDateString("en-US", { month: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Per-Client Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {client_breakdown.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Carousels</TableHead>
                    <TableHead className="text-center">Avg Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {client_breakdown.map((c) => (
                    <TableRow key={c._id}>
                      <TableCell>
                        <Link to={`/clients/${c._id}`} className="hover:underline">{c.name}</Link>
                      </TableCell>
                      <TableCell className="text-center">{c.total}</TableCell>
                      <TableCell className="text-center"><ConfidenceBadge score={c.avg_confidence} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Carousels</CardTitle>
          </CardHeader>
          <CardContent>
            {top_carousels.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {top_carousels.map((c, i) => (
                  <div key={c._id} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/clients/${c.client_id}/carousels/${c._id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {c.client_name}
                      </Link>
                      <p className="text-xs capitalize text-muted-foreground">{c.goal.replace(/_/g, " ")}</p>
                    </div>
                    <ConfidenceBadge score={c.confidence} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
