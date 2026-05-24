import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { MapPin, Users, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BRAND_NAME, BRAND_TAGLINE, BrandMark } from "@/components/Brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: `${BRAND_NAME} — ${BRAND_TAGLINE}` },
      {
        name: "description",
        content:
          "Gigs Hub is a hyper-local marketplace for quick gigs near you. Find tutoring, design, photography, event help, errands and more — in your town.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <BrandMark />
        <Link
          to="/auth"
          className="rounded-full border border-border bg-surface px-5 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          Sign in
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-8 md:pt-20">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
              <MapPin className="h-3.5 w-3.5" />
              Hyper-local · pick your town
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Quick gigs <span className="text-primary">near you.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Tutoring, design, photography, events, errands and more — posted by
              neighbours in your locality. Match. Chat. Get paid. Now live in
              Kuravilangad and rolling out to nearby towns.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-pop transition hover:bg-primary/90"
              >
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-7 py-3.5 text-sm font-semibold transition hover:border-primary"
              >
                I have an account
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-primary-soft via-background to-accent/10 blur-2xl" />
            <div className="space-y-3 rounded-3xl border border-border bg-surface p-4 shadow-soft">
              <PreviewCard
                title="Your gig appears here"
                meta="Local area · Pay shown here"
                badge="Example"
              />
              <PreviewCard
                title="Another sample gig"
                meta="Remote or nearby · Example pay"
                badge="Example"
              />
              <PreviewCard
                title="Real gigs from your town"
                meta="Posted by neighbours · Example pay"
                badge="Example"
              />
            </div>
          </div>
        </section>

        <section className="mt-24 grid gap-6 md:grid-cols-3">
          <Feature
            icon={<MapPin className="h-5 w-5" />}
            title="Pick your locality"
            body="BookMyShow-style picker with GPS detect and nearby-town matching within ~10 km."
          />
          <Feature
            icon={<Users className="h-5 w-5" />}
            title="Smart matches"
            body="Post a gig and we stack the top student profiles that fit your skills and area."
          />
          <Feature
            icon={<Briefcase className="h-5 w-5" />}
            title="One account, both sides"
            body="Flip between Student and Provider with a single toggle. Same login, both worlds."
          />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> {BRAND_NAME}
          </span>
          <span>{BRAND_TAGLINE}</span>
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({ title, meta, badge }: { title: string; meta: string; badge: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border bg-background p-4">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      </div>
      <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
        {badge}
      </span>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
