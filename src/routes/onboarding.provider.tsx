import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/onboarding/provider")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: ProviderOnboarding,
});

function ProviderOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("Kuravilangad");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, location, bio")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setDisplayName(data.display_name ?? "");
        setLocation(data.location ?? "Kuravilangad");
        setBio(data.bio ?? "");
      }
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      toast.error("Add your name or business");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          location: location.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("Profile saved!");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold">Floq</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Tell us about you
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Students see this on your gig posts.
        </p>

        <div className="mt-8 space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-soft md:p-7">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name or business</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Maria Bakery, Joseph Antony"
              className="h-11 rounded-xl"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc">Where you are</Label>
            <Input
              id="loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Kuravilangad Junction"
              className="h-11 rounded-xl"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">About</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Briefly describe yourself, your shop, or what you usually need help with."
              className="min-h-[88px] rounded-xl"
              maxLength={280}
            />
          </div>

          <Button
            onClick={save}
            disabled={saving}
            className="h-11 w-full rounded-full text-sm font-semibold"
          >
            {saving ? "Saving…" : "Save & continue"}
          </Button>
        </div>
      </main>
    </div>
  );
}
