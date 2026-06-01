import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { BrandMark } from "@/components/Brand";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/onboarding/student")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: StudentOnboarding,
});

interface Skill {
  id: string;
  name: string;
}

function StudentOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("Kuravilangad");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("skills")
        .select("id, name")
        .order("name");
      setSkills(data ?? []);
      if (user) {
        const { data: profile } = await supabase.rpc("get_my_profile");

        if (profile) {
          setDisplayName(profile.display_name ?? "");
          setLocation(profile.location ?? "Kuravilangad");
          setBio(profile.bio ?? "");
          setPhone(profile.phone ?? "");
        }
        const { data: existing } = await supabase
          .from("profile_skills")
          .select("skill_id")
          .eq("profile_id", user.id);
        if (existing && existing.length) {
          setSelected(new Set(existing.map((r) => r.skill_id)));
        }
      }
    })();
  }, [user]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const save = async () => {
    if (!user) {
      toast.error("You're signed out — please sign in again.");
      return;
    }
    if (!displayName.trim()) {
      toast.error("Add your name");
      return;
    }
    if (selected.size === 0) {
      toast.error("Pick at least one skill");
      return;
    }
    const cleanedPhone = phone.trim();
    if (cleanedPhone && !/^[+\d][\d\s\-()]{5,}$/.test(cleanedPhone)) {
      toast.error("Enter a valid phone number, or leave it blank.");
      return;
    }
    setSaving(true);
    try {
      // Upsert ensures we don't fail if the profile row wasn't created yet.
      const { error: pErr } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            display_name: displayName.trim(),
            location: location.trim() || null,
            bio: bio.trim() || null,
            phone: cleanedPhone || null,
          },
          { onConflict: "id" },
        );
      if (pErr) throw pErr;

      await supabase.from("profile_skills").delete().eq("profile_id", user.id);
      const rows = Array.from(selected).map((skill_id) => ({
        profile_id: user.id,
        skill_id,
      }));
      const { error: sErr } = await supabase.from("profile_skills").insert(rows);
      if (sErr) throw sErr;

      toast.success("Profile saved!");
      navigate({ to: "/app" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save your profile. Please try again.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-2xl items-center justify-between px-6 py-5">
        <BrandMark size="sm" />
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24 pt-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Set up your profile
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          A few quick details so people nearby can find you for the right gigs.
        </p>

        <div className="mt-8 space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-soft md:p-7">
          <div className="space-y-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Amal S."
              className="h-11 rounded-xl"
              maxLength={60}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="loc">Where you're based</Label>
            <Input
              id="loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Town or neighbourhood"
              className="h-11 rounded-xl"
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone <span className="text-xs text-muted-foreground">(optional)</span></Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="h-11 rounded-xl"
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground">Only shared with people you connect with.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="A line or two about you — what you do and when you're free."
              className="min-h-[88px] rounded-xl"
              maxLength={280}
            />
          </div>

          <div className="space-y-2">
            <Label>Your skills</Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => {
                const on = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-foreground hover:border-primary"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
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
