import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import {
  Sparkles,
  Search,
  LogOut,
  Plus,
  MessageCircle,
  GraduationCap,
  Briefcase,
  MapPin,
  Check,
  Send,
  X,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useLocalityPrefs } from "@/hooks/useLocalityPrefs";
import { LocalitySwitcher } from "@/components/LocalitySwitcher";
import { fetchLocalities, type Locality } from "@/lib/locality";

export const Route = createFileRoute("/_authenticated/app")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    // If no role yet, send to role picker.
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .limit(1);
    if (!roles || roles.length === 0) {
      throw redirect({ to: "/onboarding/role" });
    }
  },
  component: Dashboard,
});

interface Skill {
  id: string;
  name: string;
}
interface Gig {
  id: string;
  title: string;
  category: string;
  pay_text: string;
  duration: string | null;
  location: string;
  description: string | null;
  created_at: string;
  provider_id: string;
  locality_id: string | null;
  locality_name?: string;
  tags: string[];
  provider_name?: string;
}
interface Profile {
  id: string;
  display_name: string;
  location: string | null;
  bio: string | null;
  skills: string[];
}
interface Thread {
  id: string;
  gig_id: string;
  student_id: string;
  provider_id: string;
}

const CATEGORIES = [
  "All",
  "Tuition",
  "Design",
  "Photography",
  "Tech",
  "Retail",
  "Events",
  "Social Media",
  "Delivery",
];

function Dashboard() {
  const { user, roles, activeRole, setActiveRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"home" | "chats" | "profile">("home");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [openThread, setOpenThread] = useState<Thread | null>(null);
  const prefs = useLocalityPrefs(user?.id);

  useEffect(() => {
    void supabase
      .from("skills")
      .select("id, name")
      .order("name")
      .then(({ data }) => setSkills(data ?? []));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 md:px-6">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <LocalitySwitcher prefs={prefs} userId={user!.id} />
          </div>

          <div className="flex items-center gap-2">
            <RoleToggle
              roles={roles}
              active={activeRole}
              onChange={setActiveRole}
            />
            <button
              onClick={handleSignOut}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition hover:border-primary hover:text-primary"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        {tab === "home" && activeRole === "student" && (
          <StudentFeed
            userId={user!.id}
            localityIds={prefs.effectiveIds}
            selectedLocalities={prefs.selected}
            prefsLoading={prefs.loading}
            onOpenThread={(t) => setOpenThread(t)}
          />
        )}
        {tab === "home" && activeRole === "provider" && (
          <ProviderHome
            userId={user!.id}
            skills={skills}
            homeLocalityId={prefs.homeId}
            onOpenThread={(t) => setOpenThread(t)}
          />
        )}
        {tab === "chats" && (
          <ChatsList userId={user!.id} onOpen={(t) => setOpenThread(t)} />
        )}
        {tab === "profile" && (
          <ProfileTab
            userId={user!.id}
            skills={skills}
            roles={roles}
            activeRole={activeRole}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto grid max-w-5xl grid-cols-3">
          <NavBtn
            active={tab === "home"}
            onClick={() => setTab("home")}
            icon={
              activeRole === "provider" ? (
                <Briefcase className="h-5 w-5" />
              ) : (
                <Search className="h-5 w-5" />
              )
            }
            label={activeRole === "provider" ? "Gigs" : "Find"}
          />
          <NavBtn
            active={tab === "chats"}
            onClick={() => setTab("chats")}
            icon={<MessageCircle className="h-5 w-5" />}
            label="Chats"
          />
          <NavBtn
            active={tab === "profile"}
            onClick={() => setTab("profile")}
            icon={<GraduationCap className="h-5 w-5" />}
            label="Profile"
          />
        </div>
      </nav>

      <Sheet
        open={!!openThread}
        onOpenChange={(o) => !o && setOpenThread(null)}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col p-0 sm:max-w-md"
        >
          {openThread && (
            <ChatWindow
              thread={openThread}
              userId={user!.id}
              onClose={() => setOpenThread(null)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function RoleToggle({
  roles,
  active,
  onChange,
}: {
  roles: AppRole[];
  active: AppRole | null;
  onChange: (r: AppRole) => void;
}) {
  const { user, refreshRoles } = useAuth();

  const addRole = async (r: AppRole) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: user.id, role: r });
    if (error && !error.message.includes("duplicate")) {
      toast.error(error.message);
      return;
    }
    await refreshRoles();
    onChange(r);
    toast.success(`Switched to ${r} view`);
  };

  return (
    <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
      {(["student", "provider"] as AppRole[]).map((r) => {
        const has = roles.includes(r);
        const isActive = active === r;
        return (
          <button
            key={r}
            onClick={() => (has ? onChange(r) : addRole(r))}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
              isActive
                ? "bg-background text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r === "student" ? (
              <GraduationCap className="h-3.5 w-3.5" />
            ) : (
              <Briefcase className="h-3.5 w-3.5" />
            )}
            {r === "student" ? "Student" : "Provider"}
          </button>
        );
      })}
    </div>
  );
}

function NavBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition ${
        active ? "text-primary" : "text-muted-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- STUDENT: gig feed ---------------- */

function StudentFeed({
  userId,
  localityIds,
  selectedLocalities,
  prefsLoading,
  onOpenThread,
}: {
  userId: string;
  localityIds: string[];
  selectedLocalities: Locality[];
  prefsLoading: boolean;
  onOpenThread: (t: Thread) => void;
}) {
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [applied, setApplied] = useState<Map<string, string>>(new Map());
  const [category, setCategory] = useState("All");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const localityKey = localityIds.join(",");
  const localityNameById = useMemo(
    () => new Map(selectedLocalities.map((l) => [l.id, l.name])),
    [selectedLocalities],
  );

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("gigs")
      .select(
        "id, title, category, pay_text, duration, location, description, created_at, provider_id, locality_id",
      )
      .order("created_at", { ascending: false })
      .limit(100);
    if (localityIds.length > 0) {
      query = query.in("locality_id", localityIds);
    }
    const { data: g } = await query;

    const ids = (g ?? []).map((x) => x.id);
    const providerIds = Array.from(new Set((g ?? []).map((x) => x.provider_id)));
    const [{ data: tags }, { data: providers }] = await Promise.all([
      ids.length
        ? supabase
            .from("gig_tags")
            .select("gig_id, skills(name)")
            .in("gig_id", ids)
        : Promise.resolve({ data: [] as any[] }),
      providerIds.length
        ? supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", providerIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const tagMap = new Map<string, string[]>();
    (tags ?? []).forEach((t: any) => {
      const arr = tagMap.get(t.gig_id) ?? [];
      if (t.skills?.name) arr.push(t.skills.name);
      tagMap.set(t.gig_id, arr);
    });
    const provMap = new Map<string, string>();
    (providers ?? []).forEach((p: any) =>
      provMap.set(p.id, p.display_name ?? "Provider"),
    );

    const enriched: Gig[] = (g ?? []).map((x) => ({
      ...x,
      tags: tagMap.get(x.id) ?? [],
      provider_name: provMap.get(x.provider_id),
      locality_name: x.locality_id ? localityNameById.get(x.locality_id) : undefined,
    }));
    setGigs(enriched);

    const { data: apps } = await supabase
      .from("applications")
      .select("gig_id")
      .eq("student_id", userId);
    const { data: threads } = await supabase
      .from("threads")
      .select("id, gig_id")
      .eq("student_id", userId);
    const tMap = new Map<string, string>();
    (threads ?? []).forEach((t: any) => tMap.set(t.gig_id, t.id));
    const appliedMap = new Map<string, string>();
    (apps ?? []).forEach((a: any) => {
      const tid = tMap.get(a.gig_id);
      if (tid) appliedMap.set(a.gig_id, tid);
    });
    setApplied(appliedMap);
    setLoading(false);
  };

  useEffect(() => {
    if (prefsLoading) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, localityKey, prefsLoading]);

  const filtered = useMemo(() => {
    return gigs.filter((g) => {
      if (category !== "All" && g.category !== category) return false;
      if (q) {
        const t = q.toLowerCase();
        return (
          g.title.toLowerCase().includes(t) ||
          g.location.toLowerCase().includes(t) ||
          g.tags.some((x) => x.toLowerCase().includes(t))
        );
      }
      return true;
    });
  }, [gigs, category, q]);

  const apply = async (gig: Gig) => {
    // 1. Insert application
    const { error: aErr } = await supabase
      .from("applications")
      .insert({ gig_id: gig.id, student_id: userId });
    if (aErr && !aErr.message.includes("duplicate")) {
      toast.error(aErr.message);
      return;
    }
    // 2. Get-or-create thread
    let threadId: string | null = null;
    const { data: existing } = await supabase
      .from("threads")
      .select("id")
      .eq("gig_id", gig.id)
      .eq("student_id", userId)
      .eq("provider_id", gig.provider_id)
      .maybeSingle();
    if (existing) {
      threadId = existing.id;
    } else {
      const { data: t, error: tErr } = await supabase
        .from("threads")
        .insert({
          gig_id: gig.id,
          student_id: userId,
          provider_id: gig.provider_id,
        })
        .select("id")
        .single();
      if (tErr) {
        toast.error(tErr.message);
        return;
      }
      threadId = t.id;
      await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: userId,
        body: `Hi! I'd like to help with "${gig.title}".`,
      });
    }
    setApplied((p) => new Map(p).set(gig.id, threadId!));
    toast.success("Application sent");
    onOpenThread({
      id: threadId!,
      gig_id: gig.id,
      student_id: userId,
      provider_id: gig.provider_id,
    });
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
          Gigs near you
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fresh local work in Kuravilangad.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, location, or skill"
          className="h-11 rounded-full pl-10"
        />
      </div>

      <div className="mb-5 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              category === c
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-foreground hover:border-primary"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading gigs…
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No gigs match your filters yet.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((g) => (
            <GigCard
              key={g.id}
              gig={g}
              appliedThreadId={applied.get(g.id) ?? null}
              onApply={() => apply(g)}
              onOpen={() => {
                const tid = applied.get(g.id);
                if (tid)
                  onOpenThread({
                    id: tid,
                    gig_id: g.id,
                    student_id: userId,
                    provider_id: g.provider_id,
                  });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GigCard({
  gig,
  appliedThreadId,
  onApply,
  onOpen,
}: {
  gig: Gig;
  appliedThreadId: string | null;
  onApply: () => void;
  onOpen: () => void;
}) {
  const isApplied = !!appliedThreadId;
  return (
    <article className="rounded-3xl border border-border bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <span className="rounded-full bg-primary-soft px-3 py-0.5 text-xs font-medium text-primary">
            {gig.category}
          </span>
          <h3 className="mt-2 font-display text-lg font-semibold leading-snug">
            {gig.title}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {gig.location}
            </span>
            <span>·</span>
            <span className="font-semibold text-foreground">{gig.pay_text}</span>
            {gig.duration && (
              <>
                <span>·</span>
                <span>{gig.duration}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {gig.description && (
        <p className="mt-3 text-sm text-muted-foreground">{gig.description}</p>
      )}
      {gig.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {gig.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4">
        {isApplied ? (
          <Button
            onClick={onOpen}
            variant="secondary"
            className="h-10 w-full rounded-full text-sm font-semibold"
          >
            <Check className="mr-1.5 h-4 w-4" /> Applied · Open chat
          </Button>
        ) : (
          <Button
            onClick={onApply}
            className="h-10 w-full rounded-full text-sm font-semibold"
          >
            Apply now
          </Button>
        )}
      </div>
    </article>
  );
}

/* ---------------- PROVIDER: post & suggestions ---------------- */

const gigSchema = z.object({
  title: z.string().trim().min(3).max(100),
  category: z.string().min(1).max(40),
  pay_text: z.string().trim().min(1).max(40),
  duration: z.string().trim().max(60).optional(),
  location: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

function ProviderHome({
  userId,
  skills,
  onOpenThread,
}: {
  userId: string;
  skills: Skill[];
  onOpenThread: (t: Thread) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [myGigs, setMyGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: g } = await supabase
      .from("gigs")
      .select(
        "id, title, category, pay_text, duration, location, description, created_at, provider_id, locality_id",
      )
      .eq("provider_id", userId)
      .order("created_at", { ascending: false });
    const ids = (g ?? []).map((x) => x.id);
    const { data: tags } = ids.length
      ? await supabase
          .from("gig_tags")
          .select("gig_id, skills(name)")
          .in("gig_id", ids)
      : { data: [] as any[] };
    const tagMap = new Map<string, string[]>();
    (tags ?? []).forEach((t: any) => {
      const arr = tagMap.get(t.gig_id) ?? [];
      if (t.skills?.name) arr.push(t.skills.name);
      tagMap.set(t.gig_id, arr);
    });
    setMyGigs(
      (g ?? []).map((x) => ({ ...x, tags: tagMap.get(x.id) ?? [] })),
    );
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, [userId]);

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Your gigs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Post once, get matched with local students instantly.
          </p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="h-10 rounded-full px-4 text-sm font-semibold"
        >
          <Plus className="mr-1 h-4 w-4" />
          {showForm ? "Close" : "Post gig"}
        </Button>
      </div>

      {showForm && (
        <PostGigForm
          userId={userId}
          skills={skills}
          onCreated={() => {
            setShowForm(false);
            void load();
          }}
        />
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      ) : myGigs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No gigs yet. Click <strong>Post gig</strong> to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {myGigs.map((g) => (
            <ProviderGigCard
              key={g.id}
              gig={g}
              userId={userId}
              onOpenThread={onOpenThread}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PostGigForm({
  userId,
  skills,
  onCreated,
}: {
  userId: string;
  skills: Skill[];
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Tuition");
  const [pay, setPay] = useState("");
  const [duration, setDuration] = useState("");
  const [location, setLocation] = useState("Kuravilangad");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = gigSchema.safeParse({
      title,
      category,
      pay_text: pay,
      duration: duration || undefined,
      location,
      description: description || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Check your inputs");
      return;
    }
    setSaving(true);
    try {
      const { data: gig, error } = await supabase
        .from("gigs")
        .insert({ ...parsed.data, provider_id: userId })
        .select("id")
        .single();
      if (error) throw error;
      if (selected.size > 0) {
        const rows = Array.from(selected).map((skill_id) => ({
          gig_id: gig.id,
          skill_id,
        }));
        const { error: tErr } = await supabase.from("gig_tags").insert(rows);
        if (tErr) throw tErr;
      }
      toast.success("Gig posted!");
      onCreated();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mb-6 space-y-4 rounded-3xl border border-border bg-surface p-5 shadow-soft md:p-6"
    >
      <div className="space-y-1.5">
        <Label htmlFor="t">Job title</Label>
        <Input
          id="t"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Class 10 Math tuition"
          className="h-11 rounded-xl"
          maxLength={100}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cat">Category</Label>
          <select
            id="cat"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm"
          >
            {CATEGORIES.filter((c) => c !== "All").map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pay">Pay</Label>
          <Input
            id="pay"
            value={pay}
            onChange={(e) => setPay(e.target.value)}
            placeholder="₹300/hr or ₹1500 fixed"
            className="h-11 rounded-xl"
            maxLength={40}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dur">Duration</Label>
          <Input
            id="dur"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="2 hrs · 1 day · 2 weeks"
            className="h-11 rounded-xl"
            maxLength={60}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="loc">Location / landmark</Label>
          <Input
            id="loc"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Near Deva Matha Campus"
            className="h-11 rounded-xl"
            maxLength={100}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="desc">Description</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="A few details to help the right student apply."
          className="min-h-[88px] rounded-xl"
          maxLength={500}
        />
      </div>
      <div className="space-y-2">
        <Label>Skill tags (for matching)</Label>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => {
            const on = selected.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setSelected((p) => {
                    const n = new Set(p);
                    if (n.has(s.id)) n.delete(s.id);
                    else n.add(s.id);
                    return n;
                  })
                }
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  on
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
      <Button
        type="submit"
        disabled={saving}
        className="h-11 w-full rounded-full text-sm font-semibold"
      >
        {saving ? "Posting…" : "Post gig"}
      </Button>
    </form>
  );
}

function ProviderGigCard({
  gig,
  userId,
  onOpenThread,
}: {
  gig: Gig;
  userId: string;
  onOpenThread: (t: Thread) => void;
}) {
  const [matches, setMatches] = useState<
    Array<Profile & { overlap: number }>
  >([]);
  const [connected, setConnected] = useState<Map<string, string>>(new Map()); // studentId -> threadId
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      // Get tag skill ids for this gig
      const { data: tags } = await supabase
        .from("gig_tags")
        .select("skill_id")
        .eq("gig_id", gig.id);
      const skillIds = (tags ?? []).map((t: any) => t.skill_id);

      // Get all student profiles with their skills
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, display_name, location, bio");
      const { data: ps } = await supabase
        .from("profile_skills")
        .select("profile_id, skills(name, id)");
      const profSkills = new Map<
        string,
        { names: string[]; ids: string[] }
      >();
      (ps ?? []).forEach((row: any) => {
        const entry = profSkills.get(row.profile_id) ?? {
          names: [],
          ids: [],
        };
        if (row.skills?.name) entry.names.push(row.skills.name);
        if (row.skills?.id) entry.ids.push(row.skills.id);
        profSkills.set(row.profile_id, entry);
      });

      const scored = (profs ?? [])
        .filter((p: any) => p.id !== userId)
        .map((p: any) => {
          const entry = profSkills.get(p.id) ?? { names: [], ids: [] };
          const overlap = entry.ids.filter((id) => skillIds.includes(id))
            .length;
          return {
            id: p.id,
            display_name: p.display_name,
            location: p.location,
            bio: p.bio,
            skills: entry.names,
            overlap,
          };
        })
        .filter((p) => p.overlap > 0)
        .sort((a, b) => b.overlap - a.overlap)
        .slice(0, 6);
      setMatches(scored);

      // Existing connections for this gig
      const { data: conns } = await supabase
        .from("connections")
        .select("student_id")
        .eq("gig_id", gig.id)
        .eq("provider_id", userId);
      const { data: threads } = await supabase
        .from("threads")
        .select("id, student_id")
        .eq("gig_id", gig.id)
        .eq("provider_id", userId);
      const tMap = new Map<string, string>();
      (threads ?? []).forEach((t: any) => tMap.set(t.student_id, t.id));
      const cMap = new Map<string, string>();
      (conns ?? []).forEach((c: any) => {
        const tid = tMap.get(c.student_id);
        if (tid) cMap.set(c.student_id, tid);
      });
      setConnected(cMap);
      setLoading(false);
    })();
  }, [gig.id, userId]);

  const connect = async (student: Profile) => {
    const { error: cErr } = await supabase
      .from("connections")
      .insert({
        gig_id: gig.id,
        provider_id: userId,
        student_id: student.id,
      });
    if (cErr && !cErr.message.includes("duplicate")) {
      toast.error(cErr.message);
      return;
    }
    let threadId: string | null = null;
    const { data: existing } = await supabase
      .from("threads")
      .select("id")
      .eq("gig_id", gig.id)
      .eq("student_id", student.id)
      .eq("provider_id", userId)
      .maybeSingle();
    if (existing) {
      threadId = existing.id;
    } else {
      const { data: t, error: tErr } = await supabase
        .from("threads")
        .insert({
          gig_id: gig.id,
          student_id: student.id,
          provider_id: userId,
        })
        .select("id")
        .single();
      if (tErr) {
        toast.error(tErr.message);
        return;
      }
      threadId = t.id;
      await supabase.from("messages").insert({
        thread_id: threadId,
        sender_id: userId,
        body: `Hi ${student.display_name}! Interested in helping with "${gig.title}"?`,
      });
    }
    setConnected((p) => new Map(p).set(student.id, threadId!));
    toast.success("Request sent!");
    onOpenThread({
      id: threadId!,
      gig_id: gig.id,
      student_id: student.id,
      provider_id: userId,
    });
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-primary-soft px-3 py-0.5 text-xs font-medium text-primary">
              {gig.category}
            </span>
            <h3 className="mt-2 font-display text-lg font-semibold">
              {gig.title}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              <MapPin className="mr-1 inline h-3 w-3" />
              {gig.location} · {gig.pay_text}
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background p-5">
        <h4 className="mb-3 text-sm font-semibold">
          ✨ Suggested students for this gig
        </h4>
        {loading ? (
          <p className="text-xs text-muted-foreground">Matching…</p>
        ) : matches.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No matching students yet. Try adding more skill tags.
          </p>
        ) : (
          <div className="space-y-3">
            {matches.map((s) => {
              const tid = connected.get(s.id);
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{s.display_name}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {s.skills.join(" · ")}
                    </p>
                  </div>
                  {tid ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-9 shrink-0 rounded-full text-xs"
                      onClick={() =>
                        onOpenThread({
                          id: tid,
                          gig_id: gig.id,
                          student_id: s.id,
                          provider_id: userId,
                        })
                      }
                    >
                      <Check className="mr-1 h-3 w-3" /> Sent · Open chat
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="h-9 shrink-0 rounded-full text-xs"
                      onClick={() => connect(s)}
                    >
                      Connect
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}

/* ---------------- CHATS LIST ---------------- */

function ChatsList({
  userId,
  onOpen,
}: {
  userId: string;
  onOpen: (t: Thread) => void;
}) {
  const [threads, setThreads] = useState<
    Array<Thread & { gig_title: string; other_name: string; last?: string }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data: ts } = await supabase
        .from("threads")
        .select("id, gig_id, student_id, provider_id, created_at")
        .or(`student_id.eq.${userId},provider_id.eq.${userId}`)
        .order("created_at", { ascending: false });
      const gigIds = (ts ?? []).map((t: any) => t.gig_id);
      const otherIds = (ts ?? []).map((t: any) =>
        t.student_id === userId ? t.provider_id : t.student_id,
      );
      const [{ data: gigs }, { data: profs }] = await Promise.all([
        gigIds.length
          ? supabase.from("gigs").select("id, title").in("id", gigIds)
          : Promise.resolve({ data: [] as any[] }),
        otherIds.length
          ? supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", otherIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      const gMap = new Map((gigs ?? []).map((g: any) => [g.id, g.title]));
      const pMap = new Map(
        (profs ?? []).map((p: any) => [p.id, p.display_name]),
      );
      setThreads(
        (ts ?? []).map((t: any) => ({
          id: t.id,
          gig_id: t.gig_id,
          student_id: t.student_id,
          provider_id: t.provider_id,
          gig_title: gMap.get(t.gig_id) ?? "Gig",
          other_name:
            pMap.get(
              t.student_id === userId ? t.provider_id : t.student_id,
            ) ?? "User",
        })),
      );
      setLoading(false);
    })();
  }, [userId]);

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold tracking-tight md:text-3xl">
        Your chats
      </h1>
      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      ) : threads.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No conversations yet. Apply or connect from the home tab to start
            chatting.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => onOpen(t)}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold">{t.other_name}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {t.gig_title}
                </p>
              </div>
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- CHAT WINDOW ---------------- */

function ChatWindow({
  thread,
  userId,
  onClose,
}: {
  thread: Thread;
  userId: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<
    Array<{ id: string; sender_id: string; body: string; created_at: string }>
  >([]);
  const [body, setBody] = useState("");
  const [gigTitle, setGigTitle] = useState("");
  const [otherName, setOtherName] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, body, created_at")
        .eq("thread_id", thread.id)
        .order("created_at");
      setMessages(data ?? []);
      const { data: g } = await supabase
        .from("gigs")
        .select("title")
        .eq("id", thread.gig_id)
        .maybeSingle();
      setGigTitle(g?.title ?? "Gig");
      const otherId =
        thread.student_id === userId ? thread.provider_id : thread.student_id;
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", otherId)
        .maybeSingle();
      setOtherName(p?.display_name ?? "User");
    })();

    const channel = supabase
      .channel(`messages:${thread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `thread_id=eq.${thread.id}`,
        },
        (payload) => {
          setMessages((p) => [...p, payload.new as any]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [thread.id, userId, thread.gig_id, thread.student_id, thread.provider_id]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    setBody("");
    const { error } = await supabase
      .from("messages")
      .insert({ thread_id: thread.id, sender_id: userId, body: text });
    if (error) toast.error(error.message);
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="flex flex-row items-center justify-between border-b border-border p-4">
        <div className="min-w-0 flex-1">
          <SheetTitle className="truncate text-base">{otherName}</SheetTitle>
          <p className="truncate text-xs text-muted-foreground">{gigTitle}</p>
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </SheetHeader>
      <div className="flex-1 space-y-2 overflow-y-auto bg-background p-4">
        {messages.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No messages yet. Say hi!
          </p>
        )}
      </div>
      <form
        onSubmit={send}
        className="flex items-center gap-2 border-t border-border bg-surface p-3"
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          className="h-11 flex-1 rounded-full"
          maxLength={1000}
        />
        <Button
          type="submit"
          size="icon"
          className="h-11 w-11 shrink-0 rounded-full"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

/* ---------------- PROFILE TAB ---------------- */

function ProfileTab({
  userId,
  skills,
  roles,
  activeRole,
}: {
  userId: string;
  skills: Skill[];
  roles: AppRole[];
  activeRole: AppRole | null;
}) {
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("display_name, location, bio")
        .eq("id", userId)
        .maybeSingle();
      if (p) {
        setDisplayName(p.display_name ?? "");
        setLocation(p.location ?? "");
        setBio(p.bio ?? "");
      }
      const { data: ps } = await supabase
        .from("profile_skills")
        .select("skill_id")
        .eq("profile_id", userId);
      setSelected(new Set((ps ?? []).map((r: any) => r.skill_id)));
    })();
  }, [userId]);

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim(),
          location: location.trim() || null,
          bio: bio.trim() || null,
        })
        .eq("id", userId);
      if (error) throw error;

      if (activeRole === "student") {
        await supabase.from("profile_skills").delete().eq("profile_id", userId);
        if (selected.size > 0) {
          const rows = Array.from(selected).map((skill_id) => ({
            profile_id: userId,
            skill_id,
          }));
          const { error: e2 } = await supabase
            .from("profile_skills")
            .insert(rows);
          if (e2) throw e2;
        }
      }
      toast.success("Profile updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="mb-5 font-display text-2xl font-bold tracking-tight md:text-3xl">
        Your profile
      </h1>
      <div className="space-y-5 rounded-3xl border border-border bg-surface p-5 shadow-soft md:p-7">
        <div className="space-y-1.5">
          <Label htmlFor="n">Name</Label>
          <Input
            id="n"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="h-11 rounded-xl"
            maxLength={80}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="l">Location</Label>
          <Input
            id="l"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="h-11 rounded-xl"
            maxLength={100}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="b">About</Label>
          <Textarea
            id="b"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="min-h-[88px] rounded-xl"
            maxLength={280}
          />
        </div>
        {activeRole === "student" && (
          <div className="space-y-2">
            <Label>Your skills</Label>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => {
                const on = selected.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setSelected((p) => {
                        const n = new Set(p);
                        if (n.has(s.id)) n.delete(s.id);
                        else n.add(s.id);
                        return n;
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background hover:border-primary"
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <Button
          onClick={save}
          disabled={saving}
          className="h-11 w-full rounded-full text-sm font-semibold"
        >
          {saving ? "Saving…" : "Save changes"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          You currently have {roles.length} role{roles.length === 1 ? "" : "s"}:{" "}
          {roles.join(", ") || "none"}.
        </p>
      </div>
    </div>
  );
}
