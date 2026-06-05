import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "provider";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: AppRole[];
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  refreshRoles: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const ACTIVE_ROLE_KEY = "kgh.activeRole";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();

  const loadRoles = async (userId: string): Promise<AppRole[]> => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (error) {
      console.error("Failed to load roles", error);
      return [];
    }
    return (data ?? []).map((r) => r.role as AppRole);
  };

  const refreshRoles = async () => {
    if (!session?.user) {
      setRoles([]);
      setActiveRoleState(null);
      return;
    }
    const r = await loadRoles(session.user.id);
    setRoles(r);
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem(ACTIVE_ROLE_KEY) as AppRole | null)
        : null;
    if (stored && r.includes(stored)) {
      setActiveRoleState(stored);
    } else if (r.length > 0) {
      setActiveRoleState(r[0]);
    } else {
      setActiveRoleState(null);
    }
  };

  useEffect(() => {
    // Set up listener BEFORE fetching the session, per docs.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      // Ignore noisy events (TOKEN_REFRESHED fires hourly + on tab focus;
      // INITIAL_SESSION fires on every mount). React only to real identity
      // transitions — otherwise we thrash the router and the query cache.
      if (
        event !== "SIGNED_IN" &&
        event !== "SIGNED_OUT" &&
        event !== "USER_UPDATED"
      ) {
        return;
      }
      setSession(newSession);
      router.invalidate();
      if (newSession?.user) {
        queryClient.invalidateQueries();
        // defer to avoid running queries inside the callback
        setTimeout(() => {
          void loadRoles(newSession.user.id).then((r) => {
            setRoles(r);
            const stored =
              typeof window !== "undefined"
                ? (localStorage.getItem(ACTIVE_ROLE_KEY) as AppRole | null)
                : null;
            if (stored && r.includes(stored)) setActiveRoleState(stored);
            else if (r.length > 0) setActiveRoleState(r[0]);
            else setActiveRoleState(null);
          });
        }, 0);
      } else {
        setRoles([]);
        setActiveRoleState(null);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        void loadRoles(data.session.user.id).then((r) => {
          setRoles(r);
          const stored =
            typeof window !== "undefined"
              ? (localStorage.getItem(ACTIVE_ROLE_KEY) as AppRole | null)
              : null;
          if (stored && r.includes(stored)) setActiveRoleState(stored);
          else if (r.length > 0) setActiveRoleState(r[0]);
        });
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActiveRole = (role: AppRole) => {
    setActiveRoleState(role);
    if (typeof window !== "undefined")
      localStorage.setItem(ACTIVE_ROLE_KEY, role);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined")
      localStorage.removeItem(ACTIVE_ROLE_KEY);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      roles,
      activeRole,
      setActiveRole,
      refreshRoles,
      signOut,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, loading, roles, activeRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
