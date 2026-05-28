import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export type ReportTargetType = "gig" | "user";

const REASONS: Array<{ value: string; label: string }> = [
  { value: "spam", label: "Spam or misleading" },
  { value: "scam", label: "Looks like a scam" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "fake", label: "Fake or impersonation" },
  { value: "other", label: "Something else" },
];

interface ReportDialogProps {
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  /** Trigger to render. Defaults to a small ghost icon button. */
  trigger?: React.ReactNode;
  /** Optional label of the target shown in dialog (gig title, user name). */
  targetLabel?: string;
}

export function ReportDialog({
  targetType,
  targetId,
  reporterId,
  trigger,
  targetLabel,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason("");
    setDetails("");
  };

  const submit = async () => {
    if (!reason) {
      toast.error("Pick a reason");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Report submitted. Our team will review it.");
    reset();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            aria-label="Report"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
          >
            <Flag className="h-3.5 w-3.5" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report this {targetType}</DialogTitle>
          <DialogDescription>
            {targetLabel ? (
              <>Tell us what's wrong with <span className="font-medium text-foreground">"{targetLabel}"</span>.</>
            ) : (
              <>Tell us what's wrong. Reports are confidential.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason</Label>
            <div className="flex flex-wrap gap-2">
              {REASONS.map((r) => {
                const on = reason === r.value;
                return (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="report-details">Additional details (optional)</Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              placeholder="Add anything that helps our team review faster."
              className="min-h-[88px] rounded-xl"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !reason}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {submitting ? "Sending…" : "Submit report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
