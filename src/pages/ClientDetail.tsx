import { useParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@quddify/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Textarea } from "@quddify/ui/textarea";
import { Separator } from "@quddify/ui/separator";
import { Badge } from "@quddify/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@quddify/ui/tooltip";
import { Sparkles, Images, FileText, Bookmark, History, Palette, Copy, CheckCircle, X, ImageIcon } from "lucide-react";
import { useClient, useClients, useUpdateClient, useCloneClientSettings } from "@/hooks/useClients";
import { useImages } from "@/hooks/useImages";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import type { BrandKit, VoiceProfile, CtaDefaults } from "@/types";

function isSetupComplete(client: { brand_kit: any; voice_profile: any }): boolean {
  const hasBrand = !!(client.brand_kit?.primary_color || client.brand_kit?.font_heading);
  const hasVoice = !!(client.voice_profile?.raw_text);
  return hasBrand && hasVoice;
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id);
  const { data: allClients = [] } = useClients();
  const updateClient = useUpdateClient();
  const cloneSettings = useCloneClientSettings();

  const { data: imageData } = useImages(id);
  const clientImages = imageData?.images?.filter((img) => img.status === "ready") ?? [];

  const [showCtaImagePicker, setShowCtaImagePicker] = useState(false);

  const [brandKit, setBrandKit] = useState<Partial<BrandKit>>({});
  const [voiceProfile, setVoiceProfile] = useState<Partial<VoiceProfile>>({});
  const [ctaDefaults, setCtaDefaults] = useState<Partial<CtaDefaults>>({});
  const [niche, setNiche] = useState("");
  const [salesRepName, setSalesRepName] = useState("");

  useEffect(() => {
    if (client) {
      setBrandKit(client.brand_kit);
      setVoiceProfile(client.voice_profile);
      setCtaDefaults(client.cta_defaults);
      setNiche(client.niche || "");
      setSalesRepName(client.sales_rep_name || "");
    }
  }, [client]);

  function saveGeneral() {
    if (!id) return;
    updateClient.mutate({ id, data: { niche, sales_rep_name: salesRepName } });
  }

  function saveBrandKit() {
    if (!id) return;
    updateClient.mutate({ id, data: { brand_kit: brandKit as BrandKit } });
  }

  function saveVoiceProfile() {
    if (!id) return;
    updateClient.mutate({ id, data: { voice_profile: voiceProfile as VoiceProfile } });
  }

  function saveCtaDefaults() {
    if (!id) return;
    updateClient.mutate({ id, data: { cta_defaults: ctaDefaults as CtaDefaults } });
  }

  if (isLoading || !client) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  const setupDone = isSetupComplete(client);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          <p className="text-sm capitalize text-muted-foreground">{client.niche}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                {setupDone ? (
                  <Button render={<Link to={`/clients/${id}/generate`} />}>
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Carousel
                  </Button>
                ) : (
                  <Button disabled className="opacity-50">
                    <Sparkles className="mr-2 h-4 w-4" /> Generate Carousel
                  </Button>
                )}
              </span>
            </TooltipTrigger>
            {!setupDone && (
              <TooltipContent>Complete the Brand Kit and Voice Profile to enable generation</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid gap-3 md:grid-cols-5">
        {[
          { to: "images", icon: Images, label: "Images" },
          { to: "luts", icon: Palette, label: "LUTs" },
          { to: "transcripts", icon: FileText, label: "Transcripts" },
          { to: "swipe-file", icon: Bookmark, label: "Swipe File" },
          { to: "history", icon: History, label: "History" },
        ].map((item) => (
          <Link key={item.to} to={`/clients/${id}/${item.to}`}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{item.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Separator />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="brand-kit">
            Brand Kit
            {!client.brand_kit?.primary_color && !client.brand_kit?.font_heading && (
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
            )}
          </TabsTrigger>
          <TabsTrigger value="voice">
            Voice Profile
            {!client.voice_profile?.raw_text && (
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 inline-block" />
            )}
          </TabsTrigger>
          <TabsTrigger value="cta">CTA Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader><CardTitle>General Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Niche</Label>
                  <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="fitness" />
                </div>
                <div className="space-y-2">
                  <Label>Sales Rep Name</Label>
                  <Input value={salesRepName} onChange={(e) => setSalesRepName(e.target.value)} placeholder="Jorden" />
                  <p className="text-xs text-muted-foreground">Used to identify the salesperson in call transcripts</p>
                </div>
              </div>
              <Button onClick={saveGeneral} disabled={updateClient.isPending}>Save</Button>
            </CardContent>
          </Card>

          {allClients.filter((c) => c._id !== id).length > 0 && (
            <Card className="mt-4">
              <CardHeader><CardTitle>Copy Settings From Another Client</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Copy brand kit, voice profile, and CTA settings from an existing client to speed up setup.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {allClients.filter((c) => c._id !== id).map((c) => (
                    <Button
                      key={c._id}
                      variant="outline"
                      className="justify-start"
                      disabled={cloneSettings.isPending}
                      onClick={() => {
                        if (!id) return;
                        cloneSettings.mutate(
                          { targetId: id, sourceId: c._id },
                          { onSuccess: () => toast.success(`Copied settings from ${c.name}`) },
                        );
                      }}
                    >
                      <Copy className="mr-2 h-4 w-4" /> {c.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="brand-kit" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Brand Kit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={brandKit.primary_color || "#000000"} onChange={(e) => setBrandKit({ ...brandKit, primary_color: e.target.value })} className="h-10 w-10 cursor-pointer rounded border" />
                    <Input value={brandKit.primary_color || ""} onChange={(e) => setBrandKit({ ...brandKit, primary_color: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={brandKit.secondary_color || "#ffffff"} onChange={(e) => setBrandKit({ ...brandKit, secondary_color: e.target.value })} className="h-10 w-10 cursor-pointer rounded border" />
                    <Input value={brandKit.secondary_color || ""} onChange={(e) => setBrandKit({ ...brandKit, secondary_color: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <input type="color" value={brandKit.accent_color || "#3b82f6"} onChange={(e) => setBrandKit({ ...brandKit, accent_color: e.target.value })} className="h-10 w-10 cursor-pointer rounded border" />
                    <Input value={brandKit.accent_color || ""} onChange={(e) => setBrandKit({ ...brandKit, accent_color: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Input value={brandKit.font_heading || ""} onChange={(e) => setBrandKit({ ...brandKit, font_heading: e.target.value })} placeholder="e.g. Montserrat" />
                  {brandKit.font_heading && (
                    <p className="text-xs text-muted-foreground">Preview: <span style={{ fontFamily: brandKit.font_heading }}>Aa Bb Cc 123</span></p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Input value={brandKit.font_body || ""} onChange={(e) => setBrandKit({ ...brandKit, font_body: e.target.value })} placeholder="e.g. Inter" />
                  {brandKit.font_body && (
                    <p className="text-xs text-muted-foreground">Preview: <span style={{ fontFamily: brandKit.font_body }}>Aa Bb Cc 123</span></p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Style Notes</Label>
                <Textarea
                  value={brandKit.style_notes || ""}
                  onChange={(e) => setBrandKit({ ...brandKit, style_notes: e.target.value })}
                  rows={6}
                  className="font-mono text-xs whitespace-pre-wrap"
                  placeholder={"Color Palette:\n- Primary: #000000\n- Secondary: #ffffff\n\nTypography:\n- Headings: Montserrat Bold\n- Body: Inter Regular"}
                />
                <p className="text-xs text-muted-foreground">
                  Tip: Use line breaks and sections to keep this structured. The AI reads these notes during generation.
                </p>
              </div>
              <Button onClick={saveBrandKit} disabled={updateClient.isPending}>Save Brand Kit</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Voice Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Voice Profile</Label>
                <Textarea value={voiceProfile.raw_text || ""} onChange={(e) => setVoiceProfile({ ...voiceProfile, raw_text: e.target.value })} rows={10} placeholder="Drop all voice profile info here — tone, vocabulary, phrases, example copy, personality notes..." />
                <p className="text-xs text-muted-foreground">
                  Paste everything about this client's voice: tone, vocabulary level, phrases to use/avoid, example copy, personality notes, etc.
                </p>
              </div>
              <Button onClick={saveVoiceProfile} disabled={updateClient.isPending}>Save Voice Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cta" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>CTA Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Primary CTA</Label>
                <Input value={ctaDefaults.primary_cta || ""} onChange={(e) => setCtaDefaults({ ...ctaDefaults, primary_cta: e.target.value })} placeholder="e.g. DM me 'READY' to get started" />
              </div>
              <div className="space-y-2">
                <Label>Secondary CTA</Label>
                <Input value={ctaDefaults.secondary_cta || ""} onChange={(e) => setCtaDefaults({ ...ctaDefaults, secondary_cta: e.target.value })} placeholder="e.g. Save this for later" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cta-enabled" checked={ctaDefaults.cta_enabled !== false} onChange={(e) => setCtaDefaults({ ...ctaDefaults, cta_enabled: e.target.checked })} />
                <Label htmlFor="cta-enabled">CTA enabled by default</Label>
              </div>
              <Button onClick={saveCtaDefaults} disabled={updateClient.isPending}>Save CTA Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Default CTA Image</CardTitle>
              <p className="text-sm text-muted-foreground">
                Choose a photo that will always be used for the CTA slide. This image persists across all carousel generations.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {ctaDefaults.cta_image_id ? (
                <div className="flex items-start gap-4">
                  {(() => {
                    const ctaImg = clientImages.find((img) => img._id === ctaDefaults.cta_image_id);
                    return ctaImg ? (
                      <img
                        src={`/uploads/${ctaImg.thumbnail_key || ctaImg.storage_key}`}
                        alt="CTA image"
                        className="w-32 h-40 rounded-xl object-cover border border-[#222]"
                      />
                    ) : (
                      <div className="w-32 h-40 rounded-xl bg-[#1a1a1a] border border-[#222] flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-[#333]" />
                      </div>
                    );
                  })()}
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowCtaImagePicker(true)}>
                      Change Image
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const next = { ...ctaDefaults, cta_image_id: null };
                        setCtaDefaults(next);
                        if (id) updateClient.mutate({ id, data: { cta_defaults: next as CtaDefaults } });
                      }}
                    >
                      <X className="mr-1 h-3 w-3" /> Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setShowCtaImagePicker(true)}>
                  <ImageIcon className="mr-2 h-4 w-4" /> Select CTA Image
                </Button>
              )}

              {/* CTA Image Picker Modal */}
              {showCtaImagePicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCtaImagePicker(false)}>
                  <div className="w-full max-w-2xl max-h-[80vh] bg-[#111] border border-[#222] rounded-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-5 border-b border-[#222]">
                      <div>
                        <h3 className="text-white text-[15px] font-semibold">Select CTA Image</h3>
                        <p className="text-[#555] text-[12px] mt-0.5">This image will be used for the CTA slide in every carousel</p>
                      </div>
                      <button onClick={() => setShowCtaImagePicker(false)} className="text-[#555] hover:text-white transition-colors cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-5">
                      {clientImages.length === 0 ? (
                        <p className="text-center text-[#555] text-[13px] py-10">No images uploaded yet. Upload images in the Photo Vault first.</p>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {clientImages.map((img) => (
                            <button
                              key={img._id}
                              onClick={() => {
                                const next = { ...ctaDefaults, cta_image_id: img._id };
                                setCtaDefaults(next);
                                if (id) updateClient.mutate({ id, data: { cta_defaults: next as CtaDefaults } });
                                setShowCtaImagePicker(false);
                              }}
                              className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${
                                ctaDefaults.cta_image_id === img._id
                                  ? "border-[#c9a84c]"
                                  : "border-transparent hover:border-[#333]"
                              }`}
                              style={{ aspectRatio: "9/11" }}
                            >
                              <img
                                src={`/uploads/${img.thumbnail_key || img.storage_key}`}
                                alt={img.original_filename}
                                className="absolute inset-0 w-full h-full object-cover"
                              />
                              {ctaDefaults.cta_image_id === img._id && (
                                <div className="absolute inset-0 bg-[#c9a84c]/20 flex items-center justify-center">
                                  <CheckCircle className="h-6 w-6 text-[#c9a84c]" />
                                </div>
                              )}
                              {(img.manual_tags ?? []).length > 0 && (
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                                  <div className="flex flex-wrap gap-0.5">
                                    {img.manual_tags.slice(0, 2).map((tag) => (
                                      <span key={tag} className="text-[#c9a84c] text-[9px] font-medium capitalize">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
