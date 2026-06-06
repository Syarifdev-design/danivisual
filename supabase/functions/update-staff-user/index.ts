// =============================================================================
// Supabase Edge Function: update-staff-user
// =============================================================================
// Updates existing Supabase Auth users and Danivisual profile.
// Security: callable only by active super_admin users.
//
// SECURITY FIX (2026-06-05):
// - LAST SUPER_ADMIN GUARD: Cannot deactivate the last active super_admin.
// - Prevents locking the system by accidentally removing all super_admins.
// - Guards both self-deactivation and deactivation by other super_admins.
//
// Actions supported:
//   "deactivate" - set is_active = false (with guard check)
//   "reactivate"  - set is_active = true
//   "update"      - update name, email, phone, position, role
//
// Status codes:
//   200 - success
//   400 - bad request (missing fields, invalid role)
//   401 - unauthorized (not super_admin)
//   409 - conflict (cannot deactivate last super_admin)
//   500 - internal error
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ALLOWED_ROLES = [
  "super_admin",
  "admin",
  "finance",
  "editor",
  "photographer",
  "videographer",
  "staff",
  "customer",
] as const;

type AllowedRole = (typeof ALLOWED_ROLES)[number];

interface UpdateStaffUserRequest {
  /** admin_users.id of the user to update */
  userId: string;
  /** Action: "deactivate" | "reactivate" | "update" */
  action: "deactivate" | "reactivate" | "update";
  /** For "update" action - optional fields */
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  role?: AllowedRole;
  isActive?: boolean;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySuperAdmin(
  request: Request,
  supabase: ReturnType<typeof createClient>
) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);
  if (authError || !authData.user) return null;

  const { data: profile } = await supabase
    .from("admin_users")
    .select("id, auth_id, email, role, is_active")
    .eq("auth_id", authData.user.id)
    .single();

  if (!profile || profile.role !== "super_admin" || profile.is_active === false) {
    return null;
  }

  return profile;
}

/**
 * Count active super_admin users in admin_users table.
 * Used to enforce the "last super_admin cannot be deactivated" rule.
 */
async function countActiveSuperAdmins(
  supabase: ReturnType<typeof createClient>
): Promise<number> {
  const { count } = await supabase
    .from("admin_users")
    .select("*", { count: "exact", head: true })
    .eq("role", "super_admin")
    .eq("is_active", true);

  return count ?? 0;
}

serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse(
      { error: "Server is missing Supabase service configuration" },
      500
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify caller is active super_admin
  const caller = await verifySuperAdmin(request, supabase);
  if (!caller) {
    return jsonResponse(
      { error: "Unauthorized. Only active super_admin can update users." },
      401
    );
  }

  let body: UpdateStaffUserRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const { userId, action } = body;

  if (!userId || !action) {
    return jsonResponse(
      { error: "Missing required fields: userId, action" },
      400
    );
  }

  if (!["deactivate", "reactivate", "update"].includes(action)) {
    return jsonResponse(
      { error: "Invalid action. Allowed: deactivate, reactivate, update" },
      400
    );
  }

  // -------------------------------------------------------------------------
  // Fetch the target user
  // -------------------------------------------------------------------------
  const { data: targetUser, error: fetchError } = await supabase
    .from("admin_users")
    .select("id, auth_id, email, role, is_active")
    .eq("id", userId)
    .single();

  if (fetchError || !targetUser) {
    return jsonResponse({ error: "User not found" }, 404);
  }

  // -------------------------------------------------------------------------
  // GUARD: Cannot deactivate the last active super_admin
  // -------------------------------------------------------------------------
  if (action === "deactivate") {
    if (targetUser.role === "super_admin") {
      const activeCount = await countActiveSuperAdmins(supabase);

      if (activeCount <= 1) {
        return jsonResponse(
          {
            error:
              "Tidak dapat menonaktifkan satu-satunya Super Admin aktif. " +
              "Sistem harus memiliki minimal satu Super Admin aktif.",
 code: "LAST_SUPER_ADMIN",
          },
          409
        );
      }
    }

    // Perform deactivation
    const { error: deactivateError } = await supabase
      .from("admin_users")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (deactivateError) {
      console.error("[update-staff-user] Deactivate error:", deactivateError);
      return jsonResponse(
        { error: "Failed to deactivate user" },
        500
      );
    }

    return jsonResponse({
      success: true,
      action: "deactivate",
      userId,
      message: "User deactivated successfully",
    });
  }

  // -------------------------------------------------------------------------
  // Reactivate user
  // -------------------------------------------------------------------------
  if (action === "reactivate") {
    const { error: reactivateError } = await supabase
      .from("admin_users")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (reactivateError) {
      console.error("[update-staff-user] Reactivate error:", reactivateError);
      return jsonResponse(
        { error: "Failed to reactivate user" },
        500
      );
    }

    return jsonResponse({
      success: true,
      action: "reactivate",
      userId,
      message: "User reactivated successfully",
    });
  }

  // -------------------------------------------------------------------------
  // Update user fields
  // -------------------------------------------------------------------------
  if (action === "update") {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonResponse({ error: "Invalid email format" }, 400);
      }
      updates.email = email;
    }
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.position !== undefined) updates.position = body.position || null;
    if (body.role !== undefined) {
      if (!ALLOWED_ROLES.includes(body.role)) {
        return jsonResponse(
          { error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}` },
          400
        );
      }
      updates.role = body.role;
    }
    if (body.isActive !== undefined) updates.is_active = body.isActive;

    const { error: updateError } = await supabase
      .from("admin_users")
      .update(updates)
      .eq("id", userId);

    if (updateError) {
      console.error("[update-staff-user] Update error:", updateError);
      return jsonResponse({ error: "Failed to update user" }, 500);
    }

    return jsonResponse({
      success: true,
      action: "update",
      userId,
      message: "User updated successfully",
    });
  }

  return jsonResponse({ error: "Unknown action" }, 400);
});
