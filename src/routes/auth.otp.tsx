import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const searchSchema = z.object({
  contact: z.string(),
  channel: z.enum(["email", "sms"]).default("email"),
});

export const Route = createFileRoute("/auth/otp")({
  head: () => ({
    meta: [
      { title: "Verify your sign-in code — Fledg" },
      { name: "description", content: "Enter the 6-digit backup code we just emailed you to finish signing in to Fledg." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: searchSchema,
  component: OtpPage,
});

function OtpPage() {
  const { contact, channel } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (code.length !== 6) {
      toast.error("Enter the full 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp(
        channel === "sms"
          ? { phone: contact, token: code, type: "sms" }
          : { email: contact, token: code, type: "email" },
      );
      if (error) throw error;
      toast.success("Verified!");
      const userId = data.user?.id;
      if (userId) {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        const list = (roles ?? []).map((r) => r.role);
        if (list.includes("admin")) {
          navigate({ to: "/app" });
          return;
        }
        if (list.length === 0) {
          navigate({ to: "/onboarding/role" });
          return;
        }
      }
      navigate({ to: "/app" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const { error } =
        channel === "sms"
          ? await supabase.auth.signInWithOtp({ phone: contact })
          : await supabase.auth.signInWithOtp({
              email: contact,
              options: { shouldCreateUser: true },
            });
      if (error) throw error;
      toast.success("A new code is on the way");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not resend");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-md items-center justify-between px-6 py-5">
        <Link
          to="/auth"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      </header>

      <main className="mx-auto max-w-md px-6 pb-12 pt-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We sent a sign-in link to{" "}
          <span className="font-medium text-foreground">{contact}</span>. Tap the link in the email,
          or enter the 6-digit backup code below.
        </p>

        <div className="mt-8 flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button
          onClick={verify}
          disabled={loading || code.length !== 6}
          className="mt-8 h-11 w-full rounded-full text-sm font-semibold"
        >
          {loading ? "Verifying…" : "Verify & continue"}
        </Button>
        <button
          onClick={resend}
          className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          Didn't get a code? <span className="font-medium text-primary">Resend</span>
        </button>
      </main>
    </div>
  );
}
