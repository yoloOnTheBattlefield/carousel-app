import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Textarea } from "@quddify/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@quddify/ui/select";
import { Progress } from "@quddify/ui/progress";
import { ChevronRight, ChevronLeft, Check, Upload } from "lucide-react";
import { useCreateClient, useUpdateClient } from "@/hooks/useClients";
import { useUploadImages } from "@/hooks/useImages";
import { toast } from "sonner";
import api from "@/lib/api";
import type { BrandKit, VoiceProfile } from "@/types";

const STEPS = ["Basic Info", "Brand Kit", "Voice Profile", "Images", "Transcript"];

export default function OnboardClient() {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const uploadImages = useUploadImages();

  const [step, setStep] = useState(0);
  const [clientId, setClientId] = useState<string | null>(null);

  // Step 1 — Basic Info
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [niche, setNiche] = useState("fitness");
  const [salesRepName, setSalesRepName] = useState("Jorden");

  // Step 2 — Brand Kit
  const [brandKit, setBrandKit] = useState<Partial<BrandKit>>({
    primary_color: "#000000",
    secondary_color: "#ffffff",
    accent_color: "#3b82f6",
    font_heading: "Montserrat",
    font_body: "Inter",
    style_notes: "",
  });

  // Step 3 — Voice Profile
  const [voiceProfile, setVoiceProfile] = useState<Partial<VoiceProfile>>({
    raw_text: "",
    personality_notes: "",
  });

  // Step 4 — Images
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Step 5 — Transcript
  const [transcriptTitle, setTranscriptTitle] = useState("");
  const [transcriptText, setTranscriptText] = useState("");
  const [transcriptType, setTranscriptType] = useState<string>("sales_call");

  async function handleStep1() {
    if (!name.trim() || !slug.trim()) return;
    createClient.mutate(
      { name, slug, niche, sales_rep_name: salesRepName },
      {
        onSuccess: (data) => {
          setClientId(data._id);
          setStep(1);
        },
        onError: () => toast.error("Failed to create client"),
      },
    );
  }

  function handleStep2() {
    if (!clientId) return;
    updateClient.mutate(
      { id: clientId, data: { brand_kit: brandKit as BrandKit } },
      { onSuccess: () => setStep(2) },
    );
  }

  function handleStep3() {
    if (!clientId) return;
    updateClient.mutate(
      { id: clientId, data: { voice_profile: voiceProfile as VoiceProfile } },
      { onSuccess: () => setStep(3) },
    );
  }

  async function handleStep4() {
    if (!clientId) return;
    if (imageFiles.length > 0) {
      uploadImages.mutate(
        { clientId, files: imageFiles },
        {
          onSuccess: () => setStep(4),
          onError: () => toast.error("Image upload failed"),
        },
      );
    } else {
      setStep(4);
    }
  }

  async function handleStep5() {
    if (!clientId) return;
    if (transcriptTitle.trim() && transcriptText.trim()) {
      try {
        await api.post("/transcripts", {
          client_id: clientId,
          title: transcriptTitle,
          raw_text: transcriptText,
          call_type: transcriptType,
        });
      } catch {
        toast.error("Transcript upload failed");
      }
    }
    toast.success("Client onboarded successfully!");
    navigate(`/clients/${clientId}`);
  }

  function skipStep() {
    if (step < 4) setStep(step + 1);
    else {
      toast.success("Client onboarded successfully!");
      navigate(`/clients/${clientId}`);
    }
  }

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Onboard New Client</h1>
        <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex gap-2">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex-1 rounded-md px-2 py-1 text-center text-xs font-medium ${
              i < step ? "bg-primary/10 text-primary" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {i < step ? <Check className="mx-auto h-3 w-3" /> : s}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Client Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John's Fitness Coaching" />
            </div>
            <div className="space-y-2">
              <Label>Slug *</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                placeholder="johns-fitness"
              />
              <p className="text-xs text-muted-foreground">URL-safe identifier, auto-formatted</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Niche</Label>
                <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="fitness" />
              </div>
              <div className="space-y-2">
                <Label>Sales Rep Name</Label>
                <Input value={salesRepName} onChange={(e) => setSalesRepName(e.target.value)} placeholder="Jorden" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleStep1} disabled={!name.trim() || !slug.trim() || createClient.isPending}>
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Brand Kit</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {(["primary_color", "secondary_color", "accent_color"] as const).map((key) => (
                <div key={key} className="space-y-2">
                  <Label className="capitalize">{key.replace(/_/g, " ")}</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={brandKit[key] || "#000000"}
                      onChange={(e) => setBrandKit({ ...brandKit, [key]: e.target.value })}
                      className="h-10 w-10 cursor-pointer rounded border"
                    />
                    <Input value={brandKit[key] || ""} onChange={(e) => setBrandKit({ ...brandKit, [key]: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Heading Font</Label>
                <Input value={brandKit.font_heading || ""} onChange={(e) => setBrandKit({ ...brandKit, font_heading: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Body Font</Label>
                <Input value={brandKit.font_body || ""} onChange={(e) => setBrandKit({ ...brandKit, font_body: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Style Notes</Label>
              <Textarea value={brandKit.style_notes || ""} onChange={(e) => setBrandKit({ ...brandKit, style_notes: e.target.value })} rows={3} />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={skipStep}>Skip</Button>
                <Button onClick={handleStep2} disabled={updateClient.isPending}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
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
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={skipStep}>Skip</Button>
                <Button onClick={handleStep3} disabled={updateClient.isPending}>
                  Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Upload Images</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Upload client photos for carousel backgrounds. You can add more later.</p>
            <div className="rounded-lg border-2 border-dashed p-8 text-center">
              <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                className="mx-auto block text-sm"
              />
              {imageFiles.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">{imageFiles.length} file(s) selected</p>
              )}
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(2)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={skipStep}>Skip</Button>
                <Button onClick={handleStep4} disabled={uploadImages.isPending}>
                  {uploadImages.isPending ? "Uploading..." : "Next"} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader><CardTitle>Upload Transcript</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Paste a sales call or coaching call transcript. You can add more later.</p>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={transcriptTitle} onChange={(e) => setTranscriptTitle(e.target.value)} placeholder="e.g. Discovery Call - March 10" />
            </div>
            <div className="space-y-2">
              <Label>Call Type</Label>
              <Select value={transcriptType} onValueChange={setTranscriptType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_call">Sales Call</SelectItem>
                  <SelectItem value="coaching_call">Coaching Call</SelectItem>
                  <SelectItem value="content_brainstorm">Content Brainstorm</SelectItem>
                  <SelectItem value="generic">Generic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transcript</Label>
              <Textarea
                value={transcriptText}
                onChange={(e) => setTranscriptText(e.target.value)}
                rows={10}
                placeholder="Paste the full transcript here..."
                className="text-xs font-mono"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => setStep(3)}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={skipStep}>Skip</Button>
                <Button onClick={handleStep5}>
                  <Check className="mr-1 h-4 w-4" /> Finish
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
