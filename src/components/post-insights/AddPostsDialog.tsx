import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@quddify/ui/dialog";
import { Button } from "@quddify/ui/button";
import { Label } from "@quddify/ui/label";
import { Plus } from "lucide-react";
import { useAddTrackedPostsBulk } from "@/hooks/usePostInsights";
import { toast } from "sonner";

interface AddPostsDialogProps {
  clientId: string;
}

export function AddPostsDialog({ clientId }: AddPostsDialogProps) {
  const [open, setOpen] = useState(false);
  const [urlText, setUrlText] = useState("");
  const addPosts = useAddTrackedPostsBulk();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const urls = urlText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.length > 0);

    if (urls.length === 0) return;

    addPosts.mutate(
      { client_id: clientId, ig_urls: urls },
      {
        onSuccess: (data) => {
          const count = data?.added ?? urls.length;
          toast.success(`${count} post${count !== 1 ? "s" : ""} added for analysis`);
          setOpen(false);
          setUrlText("");
        },
        onError: () => {
          toast.error("Failed to add posts");
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button><Plus className="mr-2 h-4 w-4" /> Add Posts</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Posts to Analyze</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">
          Paste Instagram post URLs (one per line). Each post will be scraped and analyzed by AI.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Instagram URLs</Label>
            <textarea
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              placeholder={"https://instagram.com/p/ABC123\nhttps://instagram.com/p/DEF456\nhttps://instagram.com/p/GHI789"}
              rows={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              {urlText.split("\n").filter((u) => u.trim()).length} URL{urlText.split("\n").filter((u) => u.trim()).length !== 1 ? "s" : ""} detected
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={addPosts.isPending}>
            {addPosts.isPending ? "Adding..." : "Analyze Posts"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
