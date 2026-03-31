import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@quddify/ui/card";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Button } from "@quddify/ui/button";
import { Textarea } from "@quddify/ui/textarea";
import { Switch } from "@quddify/ui/switch";
import { Separator } from "@quddify/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quddify/ui/tabs";
import { Loader2, Eye, EyeOff, Check, Palette, MessageSquare, MousePointerClick, Key, Sparkles, FileText, Instagram, StickyNote, Upload, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useClient, useUpdateClient, useGenerateVoiceProfile, useUploadProfilePicture } from "@/hooks/useClients";
import { useSelectedClient } from "@/contexts/ClientContext";
import type { BrandKit, VoiceProfile, CtaDefaults } from "@/types";

export default function ClientSettings() {
  const { selectedClientId: id } = useSelectedClient();
  const { data: client, isLoading } = useClient(id ?? undefined);
  const updateClient = useUpdateClient();
  const generateVoice = useGenerateVoiceProfile();
  const uploadPfp = useUploadProfilePicture();

  // Transcript input
  const [transcript, setTranscript] = useState("");

  // AI integrations
  const [claudeKey, setClaudeKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showClaude, setShowClaude] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);

  // Brand kit
  const [brandKit, setBrandKit] = useState<BrandKit>({
    primary_color: "#000000",
    secondary_color: "#ffffff",
    accent_color: "#3b82f6",
    font_heading: "",
    font_body: "",
    text_color_light: "#ffffff",
    text_color_dark: "#000000",
    logo_url: null,
    style_notes: "",
  });

  // Voice profile
  const [voiceProfile, setVoiceProfile] = useState<VoiceProfile>({ raw_text: "" });

  // Special instructions
  const [specialInstructions, setSpecialInstructions] = useState("");

  // Instagram profile
  const [igUsername, setIgUsername] = useState("");
  const [igBio, setIgBio] = useState("");
  const [pfpUrl, setPfpUrl] = useState("");

  // CTA defaults
  const [ctaDefaults, setCtaDefaults] = useState<CtaDefaults>({
    primary_cta: "",
    secondary_cta: "",
    cta_enabled: true,
    cta_image_id: null,
  });

  useEffect(() => {
    if (!client) return;
    if (client.ai_integrations) {
      setClaudeKey(client.ai_integrations.claude_token ?? "");
      setOpenaiKey(client.ai_integrations.openai_token ?? "");
    }
    if (client.brand_kit) setBrandKit(client.brand_kit);
    if (client.voice_profile) setVoiceProfile(client.voice_profile);
    if (client.cta_defaults) setCtaDefaults(client.cta_defaults);
    setSpecialInstructions(client.special_instructions ?? "");
    setIgUsername(client.ig_username ?? "");
    setIgBio(client.ig_bio ?? "");
  }, [client]);

  function saveBrand() {
    if (!id) return;
    updateClient.mutate(
      {
        id,
        data: {
          brand_kit: brandKit,
          voice_profile: voiceProfile,
          cta_defaults: ctaDefaults,
          special_instructions: specialInstructions,
          ig_username: igUsername || null,
          ig_bio: igBio || null,
        },
      },
      {
        onSuccess: () => toast.success("Brand settings saved"),
        onError: () => toast.error("Failed to save brand settings"),
      },
    );
  }

  function saveIntegrations() {
    if (!id) return;
    updateClient.mutate(
      {
        id,
        data: {
          ai_integrations: {
            claude_token: claudeKey || null,
            openai_token: openaiKey || null,
            gemini_token: null,
          },
        },
      },
      {
        onSuccess: () => toast.success("Integrations saved"),
        onError: () => toast.error("Failed to save integrations"),
      },
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
        <p className="text-muted-foreground">Brand settings and integrations</p>
      </div>

      <Tabs defaultValue="brand">
        <TabsList>
          <TabsTrigger value="brand">
            <Palette className="mr-2 size-4" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="mr-2 size-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* ── Brand Tab ── */}
        <TabsContent value="brand" className="space-y-6 pt-4">
          {/* Instagram Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="size-5" />
                Instagram Profile
              </CardTitle>
              <CardDescription>Profile info shown on carousel slides and used for branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="relative flex size-16 shrink-0 items-center justify-center rounded-full border bg-muted overflow-hidden">
                  {client.ig_profile_picture_url ? (
                    <img
                      src={client.ig_profile_picture_url}
                      alt="Profile"
                      className="size-full object-cover"
                    />
                  ) : (
                    <Instagram className="size-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploadPfp.isPending}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = () => {
                          const file = input.files?.[0];
                          if (file && id) {
                            uploadPfp.mutate(
                              { clientId: id, file },
                              {
                                onSuccess: () => toast.success("Profile picture uploaded"),
                                onError: () => toast.error("Failed to upload profile picture"),
                              },
                            );
                          }
                        };
                        input.click();
                      }}
                    >
                      <Upload className="mr-2 size-4" />
                      Upload
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!pfpUrl.trim() || uploadPfp.isPending}
                      onClick={() => {
                        if (!id) return;
                        uploadPfp.mutate(
                          { clientId: id, url: pfpUrl },
                          {
                            onSuccess: () => {
                              setPfpUrl("");
                              toast.success("Profile picture saved");
                            },
                            onError: () => toast.error("Failed to fetch image from URL"),
                          },
                        );
                      }}
                    >
                      {uploadPfp.isPending ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Link2 className="mr-2 size-4" />
                      )}
                      Save from URL
                    </Button>
                  </div>
                  <Input
                    placeholder="Paste an image URL (e.g. from IG 'Copy image link')"
                    value={pfpUrl}
                    onChange={(e) => setPfpUrl(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="ig-username">Username</Label>
                <Input
                  id="ig-username"
                  placeholder="@username"
                  value={igUsername}
                  onChange={(e) => setIgUsername(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig-bio">Bio</Label>
                <Textarea
                  id="ig-bio"
                  placeholder="Instagram bio text..."
                  rows={3}
                  value={igBio}
                  onChange={(e) => setIgBio(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="size-5" />
                Colors
              </CardTitle>
              <CardDescription>Brand color palette used when rendering carousel slides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Primary" value={brandKit.primary_color} onChange={(v) => setBrandKit({ ...brandKit, primary_color: v })} />
                <ColorField label="Secondary" value={brandKit.secondary_color} onChange={(v) => setBrandKit({ ...brandKit, secondary_color: v })} />
                <ColorField label="Accent" value={brandKit.accent_color} onChange={(v) => setBrandKit({ ...brandKit, accent_color: v })} />
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <ColorField label="Text (Light)" value={brandKit.text_color_light} onChange={(v) => setBrandKit({ ...brandKit, text_color_light: v })} />
                <ColorField label="Text (Dark)" value={brandKit.text_color_dark} onChange={(v) => setBrandKit({ ...brandKit, text_color_dark: v })} />
              </div>
            </CardContent>
          </Card>

          {/* Typography */}
          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
              <CardDescription>Font families for headings and body text</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="font-heading">Heading Font</Label>
                <Input
                  id="font-heading"
                  placeholder="e.g. Montserrat"
                  value={brandKit.font_heading}
                  onChange={(e) => setBrandKit({ ...brandKit, font_heading: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="font-body">Body Font</Label>
                <Input
                  id="font-body"
                  placeholder="e.g. Inter"
                  value={brandKit.font_body}
                  onChange={(e) => setBrandKit({ ...brandKit, font_body: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo & Style Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Logo & Style</CardTitle>
              <CardDescription>Logo URL and any additional style notes for the AI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input
                  id="logo-url"
                  placeholder="https://..."
                  value={brandKit.logo_url ?? ""}
                  onChange={(e) => setBrandKit({ ...brandKit, logo_url: e.target.value || null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="style-notes">Style Notes</Label>
                <Textarea
                  id="style-notes"
                  placeholder="Any additional notes about the brand's visual style..."
                  rows={3}
                  value={brandKit.style_notes}
                  onChange={(e) => setBrandKit({ ...brandKit, style_notes: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Voice Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-5" />
                Voice Profile
              </CardTitle>
              <CardDescription>
                Describe the brand's tone of voice — the AI uses this when writing carousel copy.
                You can also paste a YouTube transcript below to auto-generate it.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="e.g. Confident, direct, slightly provocative. Uses short punchy sentences. Avoids corporate jargon..."
                rows={5}
                value={voiceProfile.raw_text}
                onChange={(e) => setVoiceProfile({ raw_text: e.target.value })}
              />

              <Separator />

              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <FileText className="size-4" />
                  Generate from YouTube Transcript
                </Label>
                <Textarea
                  placeholder="Paste a YouTube transcript here..."
                  rows={6}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  onDrop={(e) => {
                    const text = e.dataTransfer.getData("text/plain");
                    if (text) {
                      e.preventDefault();
                      setTranscript(text);
                    }
                  }}
                  className="font-mono text-xs"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={transcript.trim().length < 50 || generateVoice.isPending}
                  onClick={() => {
                    if (!id) return;
                    generateVoice.mutate(
                      { clientId: id, transcript },
                      {
                        onSuccess: (data) => {
                          setVoiceProfile({ raw_text: data.voice_profile.raw_text });
                          setTranscript("");
                          toast.success("Voice profile generated from transcript");
                        },
                        onError: () => toast.error("Failed to generate voice profile"),
                      },
                    );
                  }}
                >
                  {generateVoice.isPending ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 size-4" />
                  )}
                  {generateVoice.isPending ? "Analyzing transcript..." : "Generate Voice Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* CTA Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="size-5" />
                CTA Defaults
              </CardTitle>
              <CardDescription>Default call-to-action text for carousel slides</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="cta-enabled">Enable CTA on slides</Label>
                <Switch
                  id="cta-enabled"
                  checked={ctaDefaults.cta_enabled}
                  onCheckedChange={(checked) => setCtaDefaults({ ...ctaDefaults, cta_enabled: checked })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-cta">Primary CTA</Label>
                <Input
                  id="primary-cta"
                  placeholder="e.g. DM me 'GROWTH' to get started"
                  value={ctaDefaults.primary_cta}
                  onChange={(e) => setCtaDefaults({ ...ctaDefaults, primary_cta: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-cta">Secondary CTA</Label>
                <Input
                  id="secondary-cta"
                  placeholder="e.g. Save this for later"
                  value={ctaDefaults.secondary_cta}
                  onChange={(e) => setCtaDefaults({ ...ctaDefaults, secondary_cta: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Special Instructions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="size-5" />
                Special Instructions
              </CardTitle>
              <CardDescription>
                Custom instructions the AI will always follow when generating carousels for this client (e.g. language, tone overrides, things to avoid)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g. Speak in Italian, never use emojis, always end with a question..."
                rows={4}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
              />
            </CardContent>
          </Card>

          <Button onClick={saveBrand} disabled={updateClient.isPending}>
            {updateClient.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            Save Brand Settings
          </Button>
        </TabsContent>

        {/* ── Integrations Tab ── */}
        <TabsContent value="integrations" className="space-y-6 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Claude (Anthropic)</CardTitle>
              <CardDescription>API key used for carousel generation with Claude models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="claude-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="claude-key"
                    type={showClaude ? "text" : "password"}
                    placeholder="sk-ant-..."
                    value={claudeKey}
                    onChange={(e) => setClaudeKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowClaude(!showClaude)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showClaude ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>OpenAI</CardTitle>
              <CardDescription>API key used for carousel generation with OpenAI models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="openai-key">API Key</Label>
                <div className="relative">
                  <Input
                    id="openai-key"
                    type={showOpenai ? "text" : "password"}
                    placeholder="sk-..."
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenai(!showOpenai)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOpenai ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={saveIntegrations} disabled={updateClient.isPending}>
            {updateClient.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Check className="mr-2 size-4" />
            )}
            Save Integrations
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-9 cursor-pointer rounded border border-input bg-transparent p-0.5"
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}
