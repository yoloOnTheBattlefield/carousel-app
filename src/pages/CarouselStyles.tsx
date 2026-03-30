import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Input } from "@quddify/ui/input";
import { Textarea } from "@quddify/ui/textarea";
import { Paintbrush, Plus, Trash2, Save, X, Copy } from "lucide-react";
import {
  useCarouselStyles,
  useCreateCarouselStyle,
  useUpdateCarouselStyle,
  useDeleteCarouselStyle,
  useCloneCarouselStyle,
} from "@/hooks/useCarouselStyles";
import { EmptyState } from "@/components/shared/EmptyState";

export default function CarouselStyles() {
  const { data: styles = [], isLoading } = useCarouselStyles();
  const createStyle = useCreateCarouselStyle();
  const updateStyle = useUpdateCarouselStyle();
  const deleteStyle = useDeleteCarouselStyle();
  const cloneStyle = useCloneCarouselStyle();

  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [stylePrompt, setStylePrompt] = useState("");

  function handleCreate() {
    if (!name.trim() || !stylePrompt.trim()) return;
    createStyle.mutate(
      { name: name.trim(), style_prompt: stylePrompt.trim() },
      {
        onSuccess: () => {
          setIsCreating(false);
          setName("");
          setStylePrompt("");
        },
      },
    );
  }

  function startEdit(style: { _id: string; name: string; style_prompt: string }) {
    setEditingId(style._id);
    setName(style.name);
    setStylePrompt(style.style_prompt);
    setIsCreating(false);
  }

  function handleUpdate() {
    if (!editingId || !name.trim() || !stylePrompt.trim()) return;
    updateStyle.mutate(
      { id: editingId, name: name.trim(), style_prompt: stylePrompt.trim() },
      {
        onSuccess: () => {
          setEditingId(null);
          setName("");
          setStylePrompt("");
        },
      },
    );
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setName("");
    setStylePrompt("");
  }

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Carousel Styles</h1>
        {!isCreating && !editingId && (
          <Button onClick={() => { setIsCreating(true); setName(""); setStylePrompt(""); }}>
            <Plus className="mr-2 h-4 w-4" /> New Style
          </Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "Edit Style" : "New Style"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Style name (e.g. Dark Cinematic Fitness)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Paste the full carousel style description here — format, photography style, text system, pacing, brand signals..."
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
              rows={16}
              className="text-xs font-mono"
            />
            <div className="flex gap-2">
              <Button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={!name.trim() || !stylePrompt.trim() || createStyle.isPending || updateStyle.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {editingId ? "Update" : "Save"}
              </Button>
              <Button variant="ghost" onClick={cancelEdit}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {styles.length === 0 && !isCreating ? (
        <EmptyState
          icon={<Paintbrush className="h-10 w-10" />}
          title="No styles yet"
          description="Create a carousel style to define the visual and narrative direction"
        />
      ) : (
        <div className="space-y-3">
          {styles.map((style) => (
            <Card key={style._id} className={editingId === style._id ? "ring-2 ring-primary" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{style.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
                      {style.style_prompt}
                    </p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Created {new Date(style.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(style)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cloneStyle.mutate({ id: style._id })}
                      disabled={cloneStyle.isPending}
                      title="Duplicate style"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteStyle.mutate(style._id)}
                      disabled={deleteStyle.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
