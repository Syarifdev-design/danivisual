// =============================================================================
// Supabase Edge Function: create-staff-user
// =============================================================================
// Creates Supabase Auth users plus Danivisual profile links.
// Security: callable only by active super_admin users.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

const OPERATIONAL_ROLES = ["admin", "finance", "editor", "photographer", "videographer", "staff"];

type AllowedRole = (typeof ALLOWED_ROLES)[number];

interface CreateStaffUserRequest {
  name: string;
  email: string;
  temporaryPassword: string;
  role: AllowedRole;
  position?: string;
  phone?: string;
  isActive?: boolean;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizeUsername(email: string) {
  return email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "user";
}

async function verifySuperAdmin(request: Request, supabase: ReturnType<typeof createClient>) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
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

async function upsertCustomerIfSupported(
  supabase: ReturnType<typeof createClient>,
  body: CreateStaffUserRequest
): Promise<string | null> {
  const email = body.email.toLowerCase();
  const phone = body.phone || email;

  const { data: existing, error: findError } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    if (findError.code === "42P01") return null;
    throw findError;
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from("customers")
      .update({
        name: body.name,
        phone,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (updateError) throw updateError;
    return existing.id;
  }

  const { data: customer, error: insertError } = await supabase
    .from("customers")
    .insert({
      name: body.name,
      email,
      phone,
      notes: "Created from Settings user management",
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "42P01") return null;
    throw insertError;
  }

  return customer.id;
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
    return jsonResponse({ error: "Server is missing Supabase service configuration" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const caller = await verifySuperAdmin(request, supabase);
  if (!caller) {
    return jsonResponse({ error: "Unauthorized. Only active super_admin can create users." }, 401);
  }

  let body: CreateStaffUserRequest;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  const email = body.email?.trim().toLowerCase();
  const temporaryPassword = body.temporaryPassword || "";
  const role = body.role;
  const isActive = body.isActive !== false;

  if (!body.name?.trim() || !email || !temporaryPassword || !role) {
    return jsonResponse({ error: "Missing required fields: name, email, temporaryPassword, role" }, 400);
  }

  if (!ALLOWED_ROLES.includes(role)) {
    return jsonResponse({ error: `Invalid role. Allowed: ${ALLOWED_ROLES.join(", ")}` }, 400);
  }

  if (temporaryPassword.length < 8) {
    return jsonResponse({ error: "Temporary password must be at least 8 characters" }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({ error: "Invalid email format" }, 400);
  }

  let authId: string | null = null;
  let adminUserId: string | null = null;
  let createdAuthUser = false;
  let createdAdminUser = false;

  try {
    const { data: existingProfile } = await supabase
      .from("admin_users")
      .select("id, auth_id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.auth_id) {
      authId = existingProfile.auth_id;
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(authId, {
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: body.name.trim(), role },
      });
      if (updateAuthError) throw updateAuthError;
    } else {
      const { data: authData, error: createAuthError } = await supabase.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: { name: body.name.trim(), role },
      });
      if (createAuthError) throw createAuthError;
      if (!authData.user) throw new Error("Supabase Auth did not return a user");
      authId = authData.user.id;
      createdAuthUser = true;
    }

    const username = normalizeUsername(email);
    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .upsert(
        {
          id: existingProfile?.id,
          auth_id: authId,
          username,
          name: body.name.trim(),
          email,
          phone: body.phone || null,
          whatsapp: body.phone || null,
          role,
          position: body.position || null,
          is_active: isActive,
          password_hash: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select("id")
      .single();

    if (adminError) throw adminError;
    adminUserId = adminUser.id;
    createdAdminUser = !existingProfile?.id;

    let employeeId: string | null = null;
    let customerId: string | null = null;

    if (OPERATIONAL_ROLES.includes(role)) {
      const { data: existingEmployee, error: employeeFindError } = await supabase
        .from("employees")
        .select("id")
        .or(`user_id.eq.${authId},email.eq.${email}`)
        .maybeSingle();

      if (employeeFindError) throw employeeFindError;

      const employeePayload = {
        user_id: authId,
        name: body.name.trim(),
        email,
        phone: body.phone || null,
        role,
        position: body.position || null,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      };

      if (existingEmployee?.id) {
        const { data: employee, error: employeeUpdateError } = await supabase
          .from("employees")
          .update(employeePayload)
          .eq("id", existingEmployee.id)
          .select("id")
          .single();
        if (employeeUpdateError) throw employeeUpdateError;
        employeeId = employee.id;
      } else {
        const { data: employee, error: employeeInsertError } = await supabase
          .from("employees")
          .insert({ ...employeePayload, join_date: new Date().toISOString().slice(0, 10) })
          .select("id")
          .single();
        if (employeeInsertError) throw employeeInsertError;
        employeeId = employee.id;
      }

      const { error: linkError } = await supabase
        .from("admin_users")
        .update({ employee_id: employeeId })
        .eq("id", adminUserId);
      if (linkError) throw linkError;
    }

    if (role === "customer") {
      customerId = await upsertCustomerIfSupported(supabase, body);
    }

    return jsonResponse(
      {
        success: true,
        userId: authId,
        adminUserId,
        employeeId,
        customerId,
      },
      201
    );
  } catch (err) {
    console.error("create-staff-user error:", err);

    if (adminUserId && createdAdminUser) {
      await supabase.from("admin_users").delete().eq("id", adminUserId);
    }
    if (authId && createdAuthUser) {
      await supabase.auth.admin.deleteUser(authId);
    }

    const message = err instanceof Error ? err.message : "Internal server error";
    const isDuplicate = message.toLowerCase().includes("already") || message.toLowerCase().includes("duplicate");
    return jsonResponse({ error: message }, isDuplicate ? 409 : 500);
  }
});
