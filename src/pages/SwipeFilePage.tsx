import { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@quddify/ui/dialog";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Badge } from "@quddify/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import { Plus, Bookmark } from "lucide-react";
import { useSwipeFiles, useCreateSwipeFile } from "@/hooks/useSwipeFiles";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";

export default function SwipeFilePage() {
  const { id: clientId } = useParams<{ id: string }>();
  const { data: swipeFiles = [], isLoading } = useSwipeFiles(clientId);
  const createSwipeFile = useCreateSwipeFile();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceType, setSourceType] = useState("inspiration");

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    createSwipeFile.mutate(
      { client_id: clientId, title, source_url: sourceUrl || undefined, source_type: sourceType },
      {
        onSuccess: () => {
          setOpen(false);
          setTitle("");
          setSourceUrl("");
        },
      },
    );
  }

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Swipe File</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Save competitor and inspiration carousels to guide AI generation</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Add Reference</Button>} />
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Reference Carousel</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground -mt-2">
              Paste an Instagram URL, competitor post, or describe a style you want to reference.
            </p>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bold authority style from @coach_x" required />
              </div>
              <div className="space-y-2">
                <Label>Source URL (optional)</Label>
                <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://instagram.com/p/..." />
                <p className="text-xs text-muted-foreground">Instagram post URL, competitor carousel link, or any visual reference</p>
              </div>
              <div className="space-y-2">
                <Label>Source Type</Label>
                <Select value={sourceType} onValueChange={(v) => { if (v) setSourceType(v); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="own_post">Own Post</SelectItem>
                    <SelectItem value="competitor">Competitor</SelectItem>
                    <SelectItem value="inspiration">Inspiration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={createSwipeFile.isPending}>
                {createSwipeFile.isPending ? "Saving..." : "Save Reference"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {swipeFiles.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="h-10 w-10" />}
          title="No references yet"
          description="Save competitor and inspiration carousels to generate better content"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {swipeFiles.map((sf) => (
            <Card key={sf._id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{sf.title}</CardTitle>
                  <StatusBadge status={sf.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Badge variant="outline">{sf.source_type.replace(/_/g, " ")}</Badge>
                  {sf.style_profile.style_name && (
                    <Badge variant="secondary">{sf.style_profile.style_name}</Badge>
                  )}
                </div>
                {sf.style_profile.hook_style && (
                  <p className="text-xs text-muted-foreground">Hook: {sf.style_profile.hook_style}</p>
                )}
                {sf.style_profile.slide_count > 0 && (
                  <p className="text-xs text-muted-foreground">{sf.style_profile.slide_count} slides | {sf.style_profile.text_density} text</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
