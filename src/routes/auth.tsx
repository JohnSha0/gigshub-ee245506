import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Phone, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Kuravilangad Gig Hub" },
      {
        name: "description",
        content:
          "Sign in or create an account to post gigs or find work in Kuravilangad.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "email" | "phone";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("email");

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 pb-12 pt-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Welcome 👋
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in to your account or create a new one in seconds.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-2 rounded-full bg-secondary p-1">
          <button
            onClick={() => setMode("email")}
            className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "email"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground"
            }`}
          >
            <Mail className="h-4 w-4" /> Email
          </button>
          <button
            onClick={() => setMode("phone")}
            className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
              mode === "phone"
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground"
            }`}
          >
            <Phone className="h-4 w-4" /> Phone
          </button>
        </div>

        <div className="mt-6">
          {mode === "email" ? <EmailForm /> : <PhoneForm />}
        </div>
      </main>
    </div>
  );
}

const emailSchema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function EmailForm() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo:
              typeof window !== "undefined" ? window.location.origin : undefined,
          },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created");
          navigate({ to: "/onboarding/role" });
        } else {
          toast.info("Check your email to confirm your account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/app" });
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 rounded-xl"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          className="h-11 rounded-xl"
        />
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-full text-sm font-semibold"
      >
        {loading ? "Please wait…" : isSignUp ? "Create account" : "Log in"}
      </Button>
      <button
        type="button"
        onClick={() => setIsSignUp((v) => !v)}
        className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <span className="font-medium text-primary">Log in</span>
          </>
        ) : (
          <>
            New here?{" "}
            <span className="font-medium text-primary">Create an account</span>
          </>
        )}
      </button>
    </form>
  );
}

const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+?[1-9]\d{7,14}$/,
    "Enter a valid phone number (include country code, e.g. +91…)",
  );

function PhoneForm() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+91");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid number");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: parsed.data,
      });
      if (error) throw error;
      toast.success("OTP sent");
      navigate({ to: "/auth/otp", search: { phone: parsed.data } });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to send OTP";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          className="h-11 rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          We'll send you a 6-digit verification code.
        </p>
      </div>
      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-full text-sm font-semibold"
      >
        {loading ? "Sending…" : "Send OTP"}
      </Button>
    </form>
  );
}
