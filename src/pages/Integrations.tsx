import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@quddify/ui/card";
import { Button } from "@quddify/ui/button";
import { Input } from "@quddify/ui/input";
import { Label } from "@quddify/ui/label";
import { Badge } from "@quddify/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@quddify/ui/alert-dialog";
import { Instagram, CheckCircle2, Loader2, Unlink, Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { useClient, useConnectInstagram, useDisconnectInstagram } from "@/hooks/useClients";
import {
  useApifyTokens,
  useApifyUsage,
  useAddApifyToken,
  useDeleteApifyToken,
  useResetApifyToken,
} from "@/hooks/useApifyTokens";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function Integrations() {
  const { id } = useParams<{ id: string }>();
  const { data: client, isLoading } = useClient(id);
  const connectInstagram = useConnectInstagram();
  const disconnectInstagram = useDisconnectInstagram();
  const [searchParams, setSearchParams] = useSearchParams();
  const oauthHandled = useRef(false);

  // Apify state
  const { data: apifyTokensData, isLoading: apifyTokensLoading } = useApifyTokens();
  const hasApifyTokens = (apifyTokensData?.tokens?.length ?? 0) > 0;
  const { data: apifyUsageData } = useApifyUsage(hasApifyTokens);
  const apifyUsageMap = new Map(
    (apifyUsageData?.usage ?? []).map((u) => [u._id, u]),
  );
  const addApifyToken = useAddApifyToken();
  const deleteApifyToken = useDeleteApifyToken();
  const resetApifyToken = useResetApifyToken();
  const [newApifyLabel, setNewApifyLabel] = useState("");
  const [newApifyToken, setNewApifyToken] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Handle OAuth redirect: ?code=...&state=client:...
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (!code || !state?.startsWith("client:") || !id || oauthHandled.current) return;
    oauthHandled.current = true;

    const clientIdFromState = state.replace("client:", "");
    if (clientIdFromState !== id) return;

    setSearchParams({}, { replace: true });

    connectInstagram.mutate(
      { clientId: id, code },
      {
        onSuccess: (data) => toast.success(`Instagram connected: @${data.ig_username}`),
        onError: (err: any) => toast.error(err.response?.data?.error || "Failed to connect Instagram"),
      },
    );
  }, [searchParams, id]);

  async function startInstagramOAuth() {
    if (!id) return;
    try {
      const { data } = await api.get(`/instagram/client/${id}/auth-url`);
      window.location.href = data.url;
    } catch {
      toast.error("Failed to start Instagram connection");
    }
  }

  function handleDisconnectInstagram() {
    if (!id) return;
    disconnectInstagram.mutate(id, {
      onSuccess: () => toast.success("Instagram disconnected"),
      onError: () => toast.error("Failed to disconnect Instagram"),
    });
  }

  async function handleAddApifyToken() {
    const token = newApifyToken.trim();
    if (!token) return;
    try {
      await addApifyToken.mutateAsync({ label: newApifyLabel.trim() || undefined, token });
      setNewApifyToken("");
      setNewApifyLabel("");
      toast.success("Apify token added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add token");
    }
  }

  async function handleDeleteApifyToken(tokenId: string) {
    try {
      await deleteApifyToken.mutateAsync(tokenId);
      toast.success("Apify token removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove token");
    }
  }

  async function handleResetApifyToken(tokenId: string) {
    try {
      await resetApifyToken.mutateAsync(tokenId);
      toast.success("Token marked as active");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reset token");
    }
  }

  if (isLoading || !client) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;

  const igConnected = !!client.ig_oauth?.ig_username;
  const tokens = apifyTokensData?.tokens ?? [];
  const activeCount = tokens.filter((t) => t.status === "active").length;
  const limitedCount = tokens.filter((t) => t.status === "limit_reached").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect and manage integrations for {client.name}
        </p>
      </div>

      {/* ── Connections ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Connections</h3>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Instagram Integration Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Instagram</CardTitle>
                {igConnected ? (
                  <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    @{client.ig_oauth!.ig_username}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground gap-1">
                    Not Connected
                  </Badge>
                )}
              </div>
              <CardDescription>
                Connect this client's Instagram account to publish carousels directly
              </CardDescription>
            </CardHeader>
            <CardContent>
              {igConnected ? (
                <Button
                  onClick={handleDisconnectInstagram}
                  className="w-full"
                  variant="outline"
                  disabled={disconnectInstagram.isPending}
                >
                  {disconnectInstagram.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Unlink className="h-3.5 w-3.5 mr-1.5" />
                      Disconnect Instagram
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={startInstagramOAuth}
                  className="w-full"
                  disabled={connectInstagram.isPending}
                >
                  {connectInstagram.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Instagram className="h-3.5 w-3.5 mr-1.5" />
                      Connect Instagram
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── Data Acquisition ── */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Data Acquisition</h3>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Apify API Tokens</CardTitle>
                <CardDescription>
                  Manage multiple Apify tokens for deep scraping. Tokens auto-rotate when one hits its monthly limit.
                </CardDescription>
              </div>
              {tokens.length > 0 && (
                <div className="flex gap-1.5">
                  {activeCount > 0 && (
                    <Badge className="bg-green-500/15 text-green-500 border-green-500/30 gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {activeCount} active
                    </Badge>
                  )}
                  {limitedCount > 0 && (
                    <Badge className="bg-orange-500/15 text-orange-500 border-orange-500/30 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {limitedCount} limited
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Token list */}
            {apifyTokensLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading tokens...
              </div>
            ) : tokens.length > 0 ? (
              <div className="space-y-2">
                <Label>Saved Tokens</Label>
                <div className="space-y-1.5">
                  {tokens.map((t) => (
                    <div
                      key={t._id}
                      className={`rounded-md border px-3 py-2 ${
                        t.status === "limit_reached" ? "border-orange-500/30 bg-orange-500/5" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm font-medium truncate">
                            {t.label || "Unnamed"}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">{t.token}</span>
                          {t.status === "active" && (
                            <Badge variant="outline" className="text-green-500 border-green-500/30 text-[10px] px-1.5 py-0 shrink-0">
                              Active
                            </Badge>
                          )}
                          {t.status === "limit_reached" && (
                            <Badge variant="outline" className="text-orange-500 border-orange-500/30 text-[10px] px-1.5 py-0 shrink-0">
                              Limit Reached
                            </Badge>
                          )}
                          {t.status === "disabled" && (
                            <Badge variant="outline" className="text-muted-foreground text-[10px] px-1.5 py-0 shrink-0">
                              Disabled
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {t.status === "limit_reached" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-green-500"
                              onClick={() => handleResetApifyToken(t._id)}
                              disabled={resetApifyToken.isPending}
                              title="Reset to active"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteConfirmId(t._id)}
                            disabled={deleteApifyToken.isPending}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      {(() => {
                        const usage = apifyUsageMap.get(t._id);
                        if (!usage) return null;
                        if (usage.error) return (
                          <p className="text-[10px] text-muted-foreground mt-1">Usage: unavailable</p>
                        );
                        const used = usage.totalUsageUsd ?? 0;
                        const limit = usage.monthlyUsageLimitUsd;
                        const pct = limit ? Math.min((used / limit) * 100, 100) : null;
                        return (
                          <div className="mt-1.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>${used.toFixed(2)} used{limit ? ` / $${limit.toFixed(2)} limit` : ""}</span>
                              {pct !== null && <span>{pct.toFixed(0)}%</span>}
                            </div>
                            {pct !== null && (
                              <div className="h-1 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-orange-500" : "bg-green-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No Apify tokens added yet.</p>
            )}

            {/* Add new token form */}
            <div className="border-t pt-4 space-y-3">
              <Label>Add Token</Label>
              <div className="space-y-2">
                <Label htmlFor="apify-label" className="text-xs text-muted-foreground">Label (optional)</Label>
                <Input
                  id="apify-label"
                  placeholder="e.g. Main account, Backup"
                  value={newApifyLabel}
                  onChange={(e) => setNewApifyLabel(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apify-token-new" className="text-xs text-muted-foreground">API Token</Label>
                <Input
                  id="apify-token-new"
                  type="password"
                  placeholder="apify_api_..."
                  value={newApifyToken}
                  onChange={(e) => setNewApifyToken(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleAddApifyToken}
                  disabled={addApifyToken.isPending || !newApifyToken.trim()}
                >
                  {addApifyToken.isPending ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Token"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Apify Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Apify Token</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this token. Any scraping jobs using it will switch to another available token.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteConfirmId) {
                  handleDeleteApifyToken(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
