// =============================================================================
// JWT Verification Helper for Supabase Edge Functions
// =============================================================================
// Purpose: Verify JWT tokens from Supabase Auth
// =============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface AuthUser {
  id: string;
  email?: string;
  role?: string;
  aud: string;
}

export interface AuthPayload {
  user: AuthUser;
  exp: number;
  iat: number;
  iss: string;
}

export interface VerifiedUser {
  id: string;
  email: string;
  role: string;
}

/**
 * Verify JWT token and check if user is super_admin
 */
export async function verifySuperAdmin(request: Request): Promise<VerifiedUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return null;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing environment variables");
    return null;
  }

  try {
    // Create admin client with service role key to verify
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Token verification failed:", error?.message);
      return null;
    }

    // Fetch admin_users profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("admin_users")
      .select("id, role, username, email")
      .eq("auth_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch failed:", profileError?.message);
      return null;
    }

    // Check if user is super_admin
    if (profile.role !== "super_admin") {
      console.error("User is not super_admin:", profile.role);
      return null;
    }

    return {
      id: user.id,
      email: user.email || profile.email || "",
      role: profile.role,
    };
  } catch (err) {
    console.error("Verification error:", err);
    return null;
  }
}

/**
 * Verify JWT token and check if user has any admin role
 */
export async function verifyAdmin(request: Request): Promise<VerifiedUser | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return null;
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    const { data: profile } = await supabase
      .from("admin_users")
      .select("id, role, username, email")
      .eq("auth_id", user.id)
      .single();

    if (!profile) {
      return null;
    }

    const adminRoles = ["super_admin", "admin", "finance", "editor", "staff", "photographer", "videographer"];
    if (!adminRoles.includes(profile.role)) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || profile.email || "",
      role: profile.role,
    };
  } catch {
    return null;
  }
}
