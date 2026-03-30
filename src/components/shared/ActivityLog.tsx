import { Sparkles, Upload, FileText, Instagram, RefreshCw, Pencil, UserPlus, Palette } from "lucide-react";
import { Link } from "react-router-dom";

export interface ActivityEntry {
  _id: string;
  type: "carousel_generated" | "carousel_published" | "images_uploaded" | "transcript_added" | "client_created" | "carousel_regenerated" | "slide_edited" | "lut_applied";
  client_id?: string;
  client_name?: string;
  carousel_id?: string;
  description: string;
  created_at: string;
  user_name?: string;
}

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  carousel_generated: Sparkles,
  carousel_published: Instagram,
  images_uploaded: Upload,
  transcript_added: FileText,
  client_created: UserPlus,
  carousel_regenerated: RefreshCw,
  slide_edited: Pencil,
  lut_applied: Palette,
};

const ACTIVITY_COLORS: Record<string, string> = {
  carousel_generated: "text-[#c9a84c] bg-[#c9a84c]/10",
  carousel_published: "text-pink-400 bg-pink-400/10",
  images_uploaded: "text-blue-400 bg-blue-400/10",
  transcript_added: "text-emerald-400 bg-emerald-400/10",
  client_created: "text-violet-400 bg-violet-400/10",
  carousel_regenerated: "text-amber-400 bg-amber-400/10",
  slide_edited: "text-cyan-400 bg-cyan-400/10",
  lut_applied: "text-orange-400 bg-orange-400/10",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface ActivityLogProps {
  entries: ActivityEntry[];
  compact?: boolean;
}

export function ActivityLog({ entries, compact }: ActivityLogProps) {
  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-[13px] text-[#555]">
        No recent activity
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {entries.map((entry) => {
        const Icon = ACTIVITY_ICONS[entry.type] || Sparkles;
        const colorClass = ACTIVITY_COLORS[entry.type] || "text-[#888] bg-[#1a1a1a]";
        const [textColor, bgColor] = colorClass.split(" ");

        return (
          <div
            key={entry._id}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-[#111] transition-colors"
          >
            <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
              <Icon className={`h-3.5 w-3.5 ${textColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#ccc] leading-snug">
                {entry.description}
                {entry.client_name && entry.client_id && (
                  <>
                    {" — "}
                    <Link
                      to={`/clients/${entry.client_id}`}
                      className="text-[#888] hover:text-white transition-colors"
                    >
                      {entry.client_name}
                    </Link>
                  </>
                )}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-[#444]">{timeAgo(entry.created_at)}</span>
                {entry.user_name && (
                  <span className="text-[11px] text-[#333]">by {entry.user_name}</span>
                )}
              </div>
            </div>
            {entry.carousel_id && entry.client_id && (
              <Link
                to={`/clients/${entry.client_id}/carousels/${entry.carousel_id}`}
                className="text-[10px] text-[#555] hover:text-[#c9a84c] transition-colors shrink-0 mt-1"
              >
                View
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
