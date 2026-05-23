import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Sparkles, MapPin, Users, Briefcase, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // Send signed-in users straight into the app.
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">
            Kuravilangad Gig Hub
          </span>
        </div>
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
              Hyper-local · Kuravilangad
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight md:text-6xl">
              Earn nearby. <span className="text-primary">Hire nearby.</span>
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              A tiny marketplace built for our town. Students post their skills.
              Shops, parents and event organizers post quick gigs. Everyone
              connects in minutes.
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
            icon={<Briefcase className="h-5 w-5" />}
            title="Real local gigs"
            body="From tuition near Deva Matha to event help at the Junction — work that's a walk away."
          />
          <Feature
            icon={<Users className="h-5 w-5" />}
            title="Smart matches"
            body="Post a gig and we instantly stack the top student profiles that match your tags."
          />
          <Feature
            icon={<Sparkles className="h-5 w-5" />}
            title="Built for both sides"
            body="One toggle to flip between Student and Provider. Same account, both worlds."
          />
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-6 py-6 text-center text-xs text-muted-foreground">
          Made for the people of Kuravilangad.
        </div>
      </footer>
    </div>
  );
}

function PreviewCard({
  title,
  meta,
  badge,
}: {
  title: string;
  meta: string;
  badge: string;
}) {
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

function Feature({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
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
