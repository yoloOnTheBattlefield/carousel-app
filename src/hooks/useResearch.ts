import { useQuery } from "@tanstack/react-query";
import type { ResearchPostsResponse, ResearchCompetitor, ResearchKpis } from "@/types";
import api from "@/lib/api";

interface PostsParams {
  competitor?: string;
  post_type?: string;
  search?: string;
  sort_by?: string;
  page?: number;
  limit?: number;
}

export function useResearchPosts(params: PostsParams) {
  return useQuery<ResearchPostsResponse>({
    queryKey: ["research-posts", params],
    queryFn: () => api.get("/research/posts", { params }).then((r) => r.data),
  });
}

export function useResearchCompetitors() {
  return useQuery<ResearchCompetitor[]>({
    queryKey: ["research-competitors"],
    queryFn: () => api.get("/research/competitors").then((r) => r.data),
  });
}

export function useResearchKpis() {
  return useQuery<ResearchKpis>({
    queryKey: ["research-kpis"],
    queryFn: () => api.get("/research/overview-kpis").then((r) => r.data),
  });
}
