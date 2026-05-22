import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { GraduationCap, Briefcase, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/onboarding/role")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
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
      const message = err instanceof Error ? err.message : "Failed to save";
      toast.error(message);
    } finally {
      setPicking(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="font-display text-sm font-bold">
            Kuravilangad Gig Hub
          </span>
        </div>
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
            title="I'm a Student"
            body="Find gigs near me — tuition, design, tech, retail, events."
            loading={picking === "student"}
            onClick={() => choose("student")}
          />
          <RoleCard
            icon={<Briefcase className="h-6 w-6" />}
            title="I'm a Provider"
            body="Post a gig and get matched with local students instantly."
            loading={picking === "provider"}
            onClick={() => choose("provider")}
          />
        </div>
      </main>
    </div>
  );
}

function RoleCard({
  icon,
  title,
  body,
  onClick,
  loading,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  onClick: () => void;
  loading: boolean;
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
