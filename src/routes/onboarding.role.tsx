import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { GraduationCap, Briefcase, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { BrandMark, BRAND_NAME } from "@/components/Brand";

export const Route = createFileRoute("/onboarding/role")({
  head: () => ({
    meta: [
      { title: `Choose your role — ${BRAND_NAME}` },
      { name: "description", content: "Pick whether you want to find gigs or post gigs on Fledg. You can switch sides anytime." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    // Admins skip the role picker entirely
    const { data: roles, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id);
    if (roleError) {
      console.error("[routing:/onboarding/role] role lookup failed", roleError);
      throw roleError;
    }
    if ((roles ?? []).some((r) => r.role === "admin")) {
      throw redirect({ to: "/app" });
    }
  },
  component: RolePicker,
});

function RolePicker() {
  const navigate = useNavigate();
  const { user, refreshRoles, setActiveRole } = useAuth();
  const [picking, setPicking] = useState<AppRole | null>(null);

  const choose = async (role: AppRole) => {
    if (!user) return;
    setPicking(role);
    try {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role });
      if (error && !error.message.includes("duplicate")) throw error;
      await refreshRoles();
      setActiveRole(role);
      toast.success("All set!");
      if (role === "student") navigate({ to: "/onboarding/student" });
      else navigate({ to: "/onboarding/provider" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setPicking(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-xl items-center justify-between px-6 py-5">
        <BrandMark />
      </header>

      <main className="mx-auto max-w-xl px-6 pb-12 pt-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          How do you want to start?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You can always add the other role later from your profile.
        </p>

        <div className="mt-8 grid gap-4">
          <RoleCard
            icon={<GraduationCap className="h-6 w-6" />}
            title="I'm looking for gigs"
            body="Find work near you — tutoring, design, photography, events, errands."
            loading={picking === "student"}
            onClick={() => choose("student")}
          />
          <RoleCard
            icon={<Briefcase className="h-6 w-6" />}
            title="I want to post gigs"
            body="Post a gig and get matched with locals who can help, fast."
            loading={picking === "provider"}
            onClick={() => choose("provider")}
          />
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  icon, title, body, onClick, loading,
}: {
  icon: React.ReactNode; title: string; body: string; onClick: () => void; loading: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group flex items-center gap-4 rounded-3xl border border-border bg-surface p-5 text-left shadow-soft transition hover:border-primary hover:shadow-pop disabled:opacity-60"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        <p className="mt-0.5 text-sm text-muted-foreground">{body}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </button>
  );
}
