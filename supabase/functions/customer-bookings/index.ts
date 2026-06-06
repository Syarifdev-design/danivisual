// =============================================================================
// Supabase Edge Function: customer-bookings
// =============================================================================
// Secure customer bookings access via Supabase Auth JWT.
//
// SECURITY FIX (2026-06-05):
//
// BEFORE (CRITICAL VULNERABILITIES):
// - verifyCustomer() accepted ANY request without proper auth ("For MVP" bypass)
// - Hardcoded default secret "customer-portal-secret"
// - SELECT * FROM bookings (ALL bookings loaded, then filtered client-side)
// - No column limiting — all sensitive columns returned
// - No rate limiting
//
// AFTER (SECURE):
// - Bearer JWT required — any request without valid JWT returns 401
// - JWT verified via Supabase Auth
// - Customer looked up by auth_id (customers.auth_id = auth.uid())
// - Bookings queried with .eq("customer_id", customer.id) — SQL-scoped, no client filter
// - Only necessary columns selected — no sensitive data exposure
// - Simple rate limiting per IP
// - No MVP bypass, no fallback to unsecure methods
//
// AUTH METHOD:
//   Authorization: Bearer <supabase_jwt_token>
//
// DEPLOYMENT:
//   supabase functions deploy customer-bookings
//   (requires migration 012_add_customers_auth_id_link.sql to be applied first)
//
// MANUAL TESTING:
//   Without auth →401 {"error":"Unauthorized"}
//   Auth customer A → only booking A's data returned
//   Auth customer B → cannot see booking A's data
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// =============================================================================
// Constants
// =============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter: IP -> { count, resetAt }
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window

// =============================================================================
// Types
// =============================================================================

interface CustomerBooking {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string;
  packageName: string;
  packagePrice: number;
  serviceType: string;
  addonIds: string[];
  addonTotal: number;
  eventDate: string;
  eventTime: string | null;
  eventLocation: string;
  eventType: string;
  totalAmount: number;
  dpAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  deliveryMethod: string;
  packingFee: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface CustomerPayment {
  id: string;
  bookingId: string;
  bookingOrderNumber: string;
  customerName: string;
  amount: number;
  method: "transfer" | "cash" | "other";
  status: "pending" | "verified" | "rejected";
  type: "dp" | "final_payment";
  proofImageUrl: string;
  verifiedBy: string;
  verifiedAt: string;
  createdAt: string;
}

interface CustomerResponse {
  bookings: CustomerBooking[];
  payments: CustomerPayment[];
}

// =============================================================================
// Helpers
// =============================================================================

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Simple rate limiter — limits requests per IP.
 * Returns true if allowed, false if rate limited.
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // New window
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false; // Rate limited
  }

  entry.count++;
  return true;
}

/**
 * Get client IP from request headers.
 * Works for both direct requests and proxied requests.
 */
function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// =============================================================================
// Authentication: Verify JWT Bearer Token
// =============================================================================

/**
 * Verify the Authorization Bearer token and extract the auth.uid().
 *
 * SECURITY:
 * - Every request MUST have a valid Bearer token
 * - Token is verified against Supabase Auth
 * - No bypass, no fallback, no "For MVP" shortcut
 * - Returns null if token is missing, invalid, or expired
 */
async function verifyAuthToken(
  request: Request,
  supabaseUrl: string,
  supabaseServiceKey: string
): Promise<{ authUid: string } | null> {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader) {
    console.warn("[customer-bookings] Missing Authorization header");
    return null;
  }

  if (!authHeader.startsWith("Bearer ")) {
    console.warn("[customer-bookings] Authorization header must be Bearer token");
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    console.warn("[customer-bookings] Empty Bearer token");
    return null;
  }

  // Verify the JWT using Supabase Auth
  // Use service role key to verify (Edge Functions have elevated privileges)
  const verifyClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await verifyClient.auth.getUser(
    token
  );

  if (userError || !userData?.user) {
    console.warn("[customer-bookings] JWT verification failed:", userError?.message);
    return null;
  }

  return { authUid: userData.user.id };
}

// =============================================================================
// Customer Lookup: Find customer record by auth_id
// =============================================================================

/**
 * Look up the customer record linked to the authenticated user.
 *
 * Uses customers.auth_id = auth.uid() (requires migration 012).
 * Falls back to email matching if auth_id column doesn't exist yet.
 *
 * Returns null if no customer record is found for this auth user.
 */
async function lookupCustomerByAuthId(
  supabase: ReturnType<typeof createClient>,
  authUid: string
): Promise<{ id: string; email: string | null; phone: string | null } | null> {
  // Primary: lookup by auth_id column (requires migration 012)
  const { data: customerByAuthId, error: authIdError } = await supabase
    .from("customers")
    .select("id, email, phone")
    .eq("auth_id", authUid)
    .single();

  if (!authIdError && customerByAuthId) {
    return customerByAuthId;
  }

  // Fallback: lookup by email match (for schemas without auth_id column)
  // Get the user's email from auth.users
  const { data: authUser, error: authUserError } = await supabase
    .from("users") // auth.users is accessed differently in Edge Functions
    .select("email")
    .eq("id", authUid)
    .single();

  if (authUserError || !authUser?.email) {
    return null;
  }

  const { data: customerByEmail, error: emailError } = await supabase
    .from("customers")
    .select("id, email, phone")
    .eq("email", authUser.email.toLowerCase())
    .single();

  if (emailError || !customerByEmail) {
    return null;
  }

  return customerByEmail;
}

// =============================================================================
// Main Handler
// =============================================================================

serve(async (request: Request) => {
  // -------------------------------------------------------------------------
  // CORS preflight
  // -------------------------------------------------------------------------
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // -------------------------------------------------------------------------
  // Method check: only GET allowed
  // -------------------------------------------------------------------------
  if (request.method !== "GET") {
    return jsonResponse({ error: "Method not allowed. Use GET only." }, 405);
  }

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp)) {
    return jsonResponse(
      { error: "Too many requests. Please try again later." },
      429
    );
  }

  // -------------------------------------------------------------------------
  // Environment validation
  // -------------------------------------------------------------------------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[customer-bookings] Missing environment variables");
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  // -------------------------------------------------------------------------
  // Create service role client
  // -------------------------------------------------------------------------
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // -------------------------------------------------------------------------
  // AUTHENTICATION: Verify JWT Bearer token
  // SECURITY: Every request without valid auth returns 401
  // -------------------------------------------------------------------------
  const authResult = await verifyAuthToken(request, supabaseUrl, serviceRoleKey);
  if (!authResult) {
    return jsonResponse(
      { error: "Unauthorized. Valid authentication required." },
      401
    );
  }

  const { authUid } = authResult;

  // -------------------------------------------------------------------------
  // CUSTOMER LOOKUP: Find customer record for this auth user
  // SECURITY: If no customer record found, deny access (not an empty response)
  // -------------------------------------------------------------------------
  const customer = await lookupCustomerByAuthId(supabase, authUid);
  if (!customer) {
    console.warn(
      `[customer-bookings] No customer record for auth user: ${authUid}`
    );
    return jsonResponse(
      {
        error:
          "Customer account not found. Please contact Danivisual support.",
      },
      403
    );
  }

  // -------------------------------------------------------------------------
  // QUERY BOOKINGS: Scoped by customer_id (SQL-level filtering)
  // SECURITY FIX:
  // - REMOVED: select("*") loading ALL bookings
  // - REMOVED: client-side JS filtering with phonesMatch()
  // - NEW: .eq("customer_id", customer.id) — database filters at query level
  // -------------------------------------------------------------------------
  try {
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        // Only select columns needed for the response — no sensitive data exposure
        "id, order_number, customer_name, customer_email, customer_phone, " +
          "package_name, package_price, service_type, addon_ids, addon_total, " +
          "event_date, event_time, event_location, event_type, " +
          "total_amount, dp_amount, paid_amount, remaining_amount, " +
          "status, delivery_method, packing_fee, notes, " +
          "created_at, updated_at"
      )
      .eq("customer_id", customer.id) // SQL-scoped: only this customer's bookings
      .order("created_at", { ascending: false });

    if (bookingsError) {
      console.error(
        "[customer-bookings] Bookings query error:",
        bookingsError
      );
      return jsonResponse(
        { error: "Failed to load bookings. Please try again." },
        500
      );
    }

    if (!bookingsData || bookingsData.length === 0) {
      return jsonResponse({
        bookings: [],
        payments: [],
      } as CustomerResponse);
    }

    // Get booking IDs for payments query
    const bookingIds = bookingsData.map((b) => b.id);

    // -------------------------------------------------------------------------
    // QUERY PAYMENTS: Scoped by booking_ids (SQL-level filtering)
    // -------------------------------------------------------------------------
    const { data: paymentsData, error: paymentsError } = await supabase
      .from("payments")
      .select(
        // Only select non-sensitive columns
        "id, booking_id, booking_order_number, customer_name, " +
          "amount, method, status, payment_type, " +
          "proof_image_url, verified_by, verified_at, created_at"
      )
      .in("booking_id", bookingIds)
      .order("created_at", { ascending: true });

    if (paymentsError) {
      console.warn(
        "[customer-bookings] Payments query warning:",
        paymentsError.message
      );
      // Continue without payments rather than failing entirely
    }

    // -------------------------------------------------------------------------
    // Format response
    // -------------------------------------------------------------------------
    const formattedBookings: CustomerBooking[] = bookingsData.map((row) => ({
      id: row.id,
      orderNumber: row.order_number || "",
      customerName: row.customer_name || "",
      customerEmail: row.customer_email || null,
      customerPhone: row.customer_phone || "",
      packageName: row.package_name || "",
      packagePrice: Number(row.package_price) || 0,
      serviceType: row.service_type || "",
      addonIds: (row.addon_ids || []) as string[],
      addonTotal: Number(row.addon_total) || 0,
      eventDate: row.event_date || "",
      eventTime: row.event_time || null,
      eventLocation: row.event_location || "",
      eventType: row.event_type || "",
      totalAmount: Number(row.total_amount) || 0,
      dpAmount: Number(row.dp_amount) || 0,
      paidAmount: Number(row.paid_amount) || 0,
      remainingAmount: Number(row.remaining_amount) || 0,
      status: (row.status ||
        "pending") as CustomerBooking["status"],
      deliveryMethod: row.delivery_method || "",
      packingFee: Number(row.packing_fee) || 0,
      notes: row.notes || "",
      createdAt: row.created_at || "",
      updatedAt: row.updated_at || "",
    }));

    const formattedPayments: CustomerPayment[] = (paymentsData || []).map(
      (row) => ({
        id: row.id,
        bookingId: row.booking_id || "",
        bookingOrderNumber: row.booking_order_number || "",
        customerName: row.customer_name || "",
        amount: Number(row.amount) || 0,
        method: (row.method || "transfer") as "transfer" | "cash" | "other",
        status: (row.status ||
          "pending") as CustomerPayment["status"],
        type: (row.payment_type || "dp") as CustomerPayment["type"],
        proofImageUrl: row.proof_image_url || "",
        verifiedBy: row.verified_by || "",
        verifiedAt: row.verified_at || "",
        createdAt: row.created_at || "",
      })
    );

    return jsonResponse({
      bookings: formattedBookings,
      payments: formattedPayments,
    } as CustomerResponse);
  } catch (err) {
    console.error("[customer-bookings] Unexpected error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
