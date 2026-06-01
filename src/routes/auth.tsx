import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_NAME, BrandMark } from "@/components/Brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: `Sign in — ${BRAND_NAME}` },
      {
        name: "description",
        content: `Sign in to ${BRAND_NAME} to post gigs or find work near you. Quick email login — no password needed.`,
      },
    ],
  }),
  component: AuthPage,
});

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: parsed.data,
        options: {
          shouldCreateUser: true,
          emailRedirectTo:
            typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      toast.success("Check your inbox — tap the link or enter the code");
      navigate({ to: "/auth/otp", search: { contact: parsed.data, channel: "email" } });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <BrandMark showName={false} size="sm" />
      </header>

      <main className="mx-auto max-w-md px-6 pb-12 pt-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Welcome 👋</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email — we'll send you a secure sign-in link (and a backup code). No password needed.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-xl pl-10"
              />
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-full text-sm font-semibold"
          >
            {loading ? "Sending…" : "Email me a sign-in link"}
          </Button>
        </form>

        <p className="mt-6 rounded-2xl border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
          Tap the link from your inbox to sign in, or enter the backup code on the next screen. Phone (SMS) login is coming soon.
        </p>
      </main>
    </div>
  );
}
