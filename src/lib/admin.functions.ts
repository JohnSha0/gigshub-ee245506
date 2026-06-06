import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Admin access required");
}

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [profilesRes, rolesRes, reportsRes, requestsRes, actionsRes, gigsRes] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, display_name, location, is_blocked, created_at")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("reports")
        .select("id, reporter_id, target_type, target_id, reason, details, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("locality_requests")
        .select("id, requester_id, custom_name, note, status, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin
        .from("admin_actions")
        .select("id, actor_id, action, target_type, target_id, reason, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.from("gigs").select("id", { count: "exact", head: true }),
    ]);

    const failures = [profilesRes, rolesRes, reportsRes, requestsRes, actionsRes, gigsRes]
      .map((res) => res.error)
      .filter(Boolean);
    if (failures[0]) throw failures[0];

    return {
      profiles: profilesRes.data ?? [],
      roles: rolesRes.data ?? [],
      reports: reportsRes.data ?? [],
      localityRequests: requestsRes.data ?? [],
      adminActions: actionsRes.data ?? [],
      gigCount: gigsRes.count ?? 0,
    };
  });

export const setAdminUserBlocked = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({
      userId: z.string().uuid(),
      blocked: z.boolean(),
      reason: z.string().trim().max(240).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.rpc("set_user_blocked", {
      p_user_id: data.userId,
      p_blocked: data.blocked,
      p_reason: data.reason || null,
    });
    if (error) throw error;
    return { ok: true };
  });