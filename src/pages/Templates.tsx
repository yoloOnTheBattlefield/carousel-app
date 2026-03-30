import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Badge } from "@quddify/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quddify/ui/tabs";
import { Button } from "@quddify/ui/button";
import { LayoutTemplate, Copy } from "lucide-react";
import { useTemplates, useCloneTemplate } from "@/hooks/useTemplates";
import { EmptyState } from "@/components/shared/EmptyState";

export default function Templates() {
  const { data: templates = [], isLoading } = useTemplates();
  const cloneTemplate = useCloneTemplate();

  const contentTemplates = templates.filter((t) => t.type === "content_structure");
  const visualTemplates = templates.filter((t) => t.type === "visual");
  const derivedTemplates = templates.filter((t) => t.type === "reference_derived");

  if (isLoading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  function TemplateGrid({ items }: { items: typeof templates }) {
    if (items.length === 0) {
      return <EmptyState icon={<LayoutTemplate className="h-10 w-10" />} title="No templates" description="Templates will appear here as you create them or derive them from swipe files" />;
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Card key={t._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{t.name}</CardTitle>
                {t.is_default && <Badge>Default</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                {t.content_structure?.slide_count && (
                  <p>{t.content_structure.slide_count} slides</p>
                )}
                {t.content_structure?.slides && (
                  <div className="flex flex-wrap gap-1">
                    {t.content_structure.slides.map((s, i) => (
                      <Badge key={i} variant="outline" className="text-[10px]">{s.role}</Badge>
                    ))}
                  </div>
                )}
                {t.visual_structure?.background_style && (
                  <p>Style: {t.visual_structure.background_style.replace(/_/g, " ")}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() => cloneTemplate.mutate({ id: t._id })}
                disabled={cloneTemplate.isPending}
              >
                <Copy className="mr-1 h-3 w-3" /> Duplicate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Templates</h1>
        <Button disabled>Create Template</Button>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Content Structure ({contentTemplates.length})</TabsTrigger>
          <TabsTrigger value="visual">Visual ({visualTemplates.length})</TabsTrigger>
          <TabsTrigger value="derived">Reference-Derived ({derivedTemplates.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="mt-4"><TemplateGrid items={contentTemplates} /></TabsContent>
        <TabsContent value="visual" className="mt-4"><TemplateGrid items={visualTemplates} /></TabsContent>
        <TabsContent value="derived" className="mt-4"><TemplateGrid items={derivedTemplates} /></TabsContent>
      </Tabs>
    </div>
  );
}
