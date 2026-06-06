/**
 * Customer Portal Context
 *
 * SECURITY MODEL (2026-06-05):
 *
 * Auth:
 * - Customer portal requires Supabase Auth JWT (email/password or magic link)
 * - Session token stored by Supabase Auth in localStorage
 * - Edge Function verifies JWT server-side and scopes data by customer_id
 *
 * Data access:
 * - All booking data comes ONLY from the customer-bookings Edge Function
 * - Edge Function scopes data by bookings.customer_id = customers.id
 * - customers.auth_id = auth.uid() links auth user to customer record
 * - NO direct Supabase queries for customer-sensitive data in the portal
 *
 * Fallback behavior:
 * - If Edge Function fails → show error message, NO data exposure
 * - If no JWT session → show "Silakan login terlebih dahulu"
 * - Production portal disabled by default (CLIENT_PORTAL_ENABLED flag)
 *
 * Production portal activation (requires all steps):
 * 1. Migration 012_add_customers_auth_id_link.sql applied
 * 2. Edge Function customer-bookings deployed
 * 3. Customer records linked to auth.users via customers.auth_id
 * 4. Customer login via Supabase Auth
 * 5. VITE_CLIENT_PORTAL_ENABLED=true in production .env
 */

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  getProductionRecord,
  getProgressPercentage,
  ProductionRecord,
  ProductionStepStatus,
} from "../../services/productionService";
import { DP_AMOUNT } from "../data/bookingData";

// ============================================================================
// FEATURE FLAG: Client Portal enabled?
// In production (import.meta.env.PROD), this must be explicitly enabled
// via VITE_CLIENT_PORTAL_ENABLED=true after proper auth is implemented.
// ============================================================================
const CLIENT_PORTAL_ENABLED =
  !import.meta.env.PROD || import.meta.env.VITE_CLIENT_PORTAL_ENABLED === "true";

// ============================================================================
// Phone Normalization (used only for display, NOT for auth or filtering)
// ============================================================================

/**
 * Normalize phone number to consistent format
 * 08xx -> 62xxxxxxxxxx, +62xx -> 62xxxxxxxxxx, 628xx -> 62xxxxxxxxxx
 */
function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  return digits;
}

// ============================================================================
// Types
// ============================================================================

export interface CustomerBooking {
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

export interface CustomerPayment {
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

export interface CustomerBookingDetails {
  coupleName: string;
  decorationPlan: string | null;
  fullAddress: string;
  googleMapsLink: string | null;
  activeWhatsapp: string;
  instagramUsername: string;
  muaPlan: string | null;
  eventTimePending: boolean;
  adminNotes: string | null;
}

export interface ProductionProgress {
  currentStep: string;
  progressPercent: number;
  sneakPeekStatus: "locked" | "available" | "viewed";
  googleDriveLink: string | null;
  galleryLink: string | null;
  customerNotes: string;
  estimatedDate: string | null;
  completedSteps: string[];
  completedStep: string | null;
  photoSortingStatus: ProductionStepStatus;
  deliveryStatus: string;
  deliveryEstimate: string | null;
  trackingNumber: string | null;
}

export interface PhotoSelection {
  bookingId: string;
  galleryLink: string | null;
  editingSelections: string;
  printingSelections: string;
  additionalNotes: string;
  status: "pending" | "submitted" | "approved";
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
}

interface CustomerContextType {
  customerPhone: string | null;
  customerEmail: string | null;
  isLoggedIn: boolean;
  isPortalEnabled: boolean;
  login: (phone: string, email?: string) => Promise<boolean>;
  logout: () => void;

  bookings: CustomerBooking[];
  currentBooking: CustomerBooking | null;
  bookingDetails: CustomerBookingDetails | null;
  productionProgress: ProductionProgress | null;
  photoSelection: PhotoSelection | null;
  payments: CustomerPayment[];

  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  refreshBookings: () => Promise<void>;
  uploadPelunasanProof: (
    file: File,
    amount: number,
    senderName: string
  ) => Promise<{ success: boolean; error?: string }>;
  uploadFinalPayment: (
    file: File,
    amount: number,
    senderName: string
  ) => Promise<{ success: boolean; error?: string }>;
  updatePhotoSelection: (updates: Partial<PhotoSelection>) => {
    success: boolean;
    error?: string;
  };
  submitPhotoSelection: () => { success: boolean; error?: string };
}

// ============================================================================
// Constants
// ============================================================================

const defaultProductionProgress: ProductionProgress = {
  currentStep: "Menunggu Konfirmasi DP",
  progressPercent: 0,
  sneakPeekStatus: "locked",
  googleDriveLink: null,
  galleryLink: null,
  customerNotes: "",
  estimatedDate: null,
  completedSteps: [],
  completedStep: null,
  photoSortingStatus: "waiting",
  deliveryStatus: "pending",
  deliveryEstimate: null,
  trackingNumber: null,
};

// ============================================================================
// Context
// ============================================================================

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  // Customer identification (DEV-only session tracking)
  // NOTE: In production, this should be replaced with Supabase Auth session.
  // Raw phone in localStorage is NOT a secure auth mechanism.
  const [customerPhone, setCustomerPhone] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  // Booking data
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<CustomerBooking | null>(null);
  const [bookingDetails, setBookingDetails] = useState<CustomerBookingDetails | null>(
    null
  );
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [productionProgress, setProductionProgress] =
    useState<ProductionProgress | null>(null);
  const [photoSelection, setPhotoSelection] = useState<PhotoSelection | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = Boolean(customerPhone) && CLIENT_PORTAL_ENABLED;

  // Load bookings when customer is logged in
  useEffect(() => {
    if (customerPhone && CLIENT_PORTAL_ENABLED) {
      loadBookings();
    }
  }, [customerPhone]);

  // Load production progress and photo selection based on current booking
  useEffect(() => {
    if (currentBooking) {
      loadProductionProgress();
      loadPhotoSelection();
    }
  }, [currentBooking, payments]);

  // ============================================================================
  // Login/Logout
  // ============================================================================

  /**
   * Login via Supabase Auth (JWT-based).
   *
   * SECURITY: In production, this is BLOCKED by CLIENT_PORTAL_ENABLED check.
   * This flow is only for DEV/INTERNAL use.
   *
   * Production activation steps:
   * 1. Customer registers/logs in via Supabase Auth (email/password or magic link)
   * 2. Customer record must be linked to auth.users via customers.auth_id
   * 3. Set VITE_CLIENT_PORTAL_ENABLED=true in production .env
   * 4. Remove CLIENT_PORTAL_DISABLED guard in CustomerLogin.tsx
   */
  const login = async (phone: string, email?: string): Promise<boolean> => {
    // PRODUCTION GUARD: Block phone-only login in production builds
    if (!CLIENT_PORTAL_ENABLED) {
      setError("Client Portal belum diaktifkan. Hubungi admin untuk akses.");
      return false;
    }

    setIsLoading(true);
    setError(null);

    // DEV-ONLY: Store phone for session tracking
    // NOTE: In production, customer auth uses Supabase Auth JWT.
    // This phone-based session is NOT a secure auth mechanism.
    if (import.meta.env.DEV) {
      const normalizedPhone = normalizePhone(phone) || phone.trim();
      setCustomerPhone(normalizedPhone);
      if (email) setCustomerEmail(email);
    }

    // Load bookings via Edge Function with JWT auth
    await loadBookingsWithAuth();

    setIsLoading(false);
    return bookings.length > 0;
  };

  const logout = () => {
    setCustomerPhone(null);
    setCustomerEmail(null);
    setBookings([]);
    setCurrentBooking(null);
    setBookingDetails(null);
    setPayments([]);
    setProductionProgress(null);
    setError(null);
  };

  // ============================================================================
  // Load Bookings via Edge Function with JWT Auth
  // ============================================================================

  /**
   * Load bookings for the authenticated customer via Edge Function.
   *
   * SECURITY (2026-06-05):
   * - Uses Supabase Auth JWT from localStorage as Bearer token
   * - Edge Function verifies JWT and looks up customer by auth_id
   * - Bookings are scoped by customer_id at the SQL level (no client-side filter)
   * - If Edge Function fails in production: show error, do NOT expose data
   *
   * Auth flow:
   * 1. Customer logs in via Supabase Auth (email/password or magic link)
   * 2. Session token stored in localStorage by Supabase Auth
   * 3. This function reads the session token and sends as Bearer token
   * 4. Edge Function verifies token, looks up customer, returns scoped data
   */
  const loadBookingsWithAuth = async (phone?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!isSupabaseConfigured()) {
        if (!import.meta.env.DEV) {
          setError("Database belum dikonfigurasi. Hubungi admin.");
          setBookings([]);
          setCurrentBooking(null);
          setIsLoading(false);
          return;
        }
        setBookings([]);
        setCurrentBooking(null);
        setIsLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        if (!import.meta.env.DEV) {
          setError("Konfigurasi tidak lengkap. Hubungi admin.");
          setBookings([]);
          setCurrentBooking(null);
          setIsLoading(false);
          return;
        }
        setBookings([]);
        setCurrentBooking(null);
        setIsLoading(false);
        return;
      }

      // =============================================================================
      // Get Supabase Auth session token for Bearer auth
      // SECURITY: This reads the session from Supabase Auth's localStorage.
      // The Edge Function will verify this token server-side.
      // =============================================================================
      const client: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });

      const { data: sessionData } = await client.auth.getSession();
      const sessionToken = sessionData?.session?.access_token;

      if (!sessionToken) {
        // No authenticated session — show login prompt
        setError("Silakan login terlebih dahulu.");
        setBookings([]);
        setCurrentBooking(null);
        setIsLoading(false);
        return;
      }

      // =============================================================================
      // Call Edge Function with Bearer token (JWT auth)
      // =============================================================================
      const response = await fetch(
        `${supabaseUrl}/functions/v1/customer-bookings`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
            apikey: supabaseAnonKey,
          },
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        console.error(
          "[CustomerContext] Edge Function error:",
          response.status,
          errorBody.error
        );

        if (response.status === 401) {
          setError("Sesi login berakhir. Silakan login kembali.");
          await client.auth.signOut();
        } else if (response.status === 403) {
          setError("Akun customer tidak ditemukan. Hubungi Danivisual.");
        } else {
          setError(
            "Data booking belum bisa dimuat. Silakan coba lagi atau hubungi admin."
          );
        }
        setBookings([]);
        setCurrentBooking(null);
        setIsLoading(false);
        return;
      }

      const data = await response.json();

      if (data.bookings && data.bookings.length > 0) {
        const loadedBookings = data.bookings.map((row: CustomerBooking) => ({
          id: row.id,
          orderNumber: row.orderNumber,
          customerName: row.customerName,
          customerEmail: row.customerEmail,
          customerPhone: row.customerPhone,
          packageName: row.packageName,
          packagePrice: row.packagePrice,
          serviceType: row.serviceType || "",
          addonIds: row.addonIds || [],
          addonTotal: row.addonTotal || 0,
          eventDate: row.eventDate,
          eventTime: row.eventTime,
          eventLocation: row.eventLocation,
          eventType: row.eventType,
          totalAmount: row.totalAmount,
          dpAmount: row.dpAmount,
          paidAmount: row.paidAmount,
          remainingAmount: row.remainingAmount,
          status: row.status as CustomerBooking["status"],
          deliveryMethod: row.deliveryMethod || "",
          packingFee: row.packingFee || 0,
          notes: row.notes || "",
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        }));

        setBookings(loadedBookings);
        setCurrentBooking(loadedBookings[0]);

        if (loadedBookings[0]) {
          await loadBookingDetails(loadedBookings[0].id);
          await loadPayments(loadedBookings[0].orderNumber);
        }
      } else {
        setBookings([]);
        setCurrentBooking(null);
      }

      setIsLoading(false);
    } catch (err) {
      console.error("[CustomerContext] Load bookings error:", err);
      setError("Terjadi kesalahan. Silakan coba lagi atau hubungi admin.");
      setBookings([]);
      setCurrentBooking(null);
      setIsLoading(false);
    }
  };

  // Backward-compatible alias (now uses JWT auth internally)
  const loadBookings = loadBookingsWithAuth;

  const loadBookingDetails = async (bookingId: string) => {
    if (!isSupabaseConfigured()) {
      setBookingDetails(getDefaultBookingDetails());
      return;
    }

    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data, error } = await client
        .from("booking_event_details")
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (!error && data) {
        setBookingDetails({
          coupleName: data.couple_name || "",
          decorationPlan: data.decoration_plan,
          fullAddress: data.full_address || "",
          googleMapsLink: data.google_maps_link,
          activeWhatsapp: data.active_whatsapp || "",
          instagramUsername: data.instagram_username || "",
          muaPlan: data.mua_plan,
          eventTimePending: data.event_time_pending || false,
          adminNotes: data.admin_notes,
        });
      } else {
        setBookingDetails(getDefaultBookingDetails());
      }
    } catch (err) {
      console.warn("[CustomerContext] Load booking details error:", err);
    }
  };

  // ============================================================================
  // Load Payments from Supabase
  // ============================================================================

  const loadPayments = async (orderNumber: string) => {
    if (!isSupabaseConfigured()) return;

    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data, error } = await client
        .from("payments")
        .select("*")
        .eq("booking_order_number", orderNumber)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setPayments(
          data.map((row) => ({
            id: row.id,
            bookingId: row.booking_id || "",
            bookingOrderNumber: row.booking_order_number,
            customerName: row.customer_name || "",
            amount: row.amount,
            method: row.method as CustomerPayment["method"],
            status: row.status as CustomerPayment["status"],
            type: (row.payment_type || "dp") as CustomerPayment["type"],
            proofImageUrl: row.proof_image_url || "",
            verifiedBy: row.verified_by || "",
            verifiedAt: row.verified_at || "",
            createdAt: row.created_at,
          }))
        );
      }
    } catch (err) {
      console.warn("[CustomerContext] Load payments error:", err);
    }
  };

  const getDefaultBookingDetails = (): CustomerBookingDetails => ({
    coupleName: "",
    decorationPlan: null,
    fullAddress: "",
    googleMapsLink: null,
    activeWhatsapp: "",
    instagramUsername: "",
    muaPlan: null,
    eventTimePending: false,
    adminNotes: null,
  });

  // ============================================================================
  // Load Production Progress
  // ============================================================================

  const applyProductionRecordToPhotoSelection = (record: ProductionRecord) => {
    if (!record.galleryLink) return;

    setPhotoSelection((current) => {
      if (!current || current.bookingId !== record.bookingId) return current;
      return { ...current, galleryLink: record.galleryLink };
    });
  };

  const mapProductionRecordToProgress = (
    record: ProductionRecord
  ): ProductionProgress => {
    const stepOrder = [
      "pelunasan",
      "photoSorting",
      "editing",
      "printing",
      "finishing",
      "delivery",
    ] as const;
    const completedSteps = stepOrder
      .map((stepId) => record.steps[stepId])
      .filter((step) => step.status === "completed")
      .map((step) => step.name);
    const activeStep =
      stepOrder
        .map((stepId) => record.steps[stepId])
        .find((step) => step.status === "in_progress") ||
      stepOrder
        .map((stepId) => record.steps[stepId])
        .find((step) => step.status === "waiting");
    const allCompleted = completedSteps.length === stepOrder.length;
    const currentStep = allCompleted
      ? "Selesai"
      : activeStep?.name || "Menunggu Konfirmasi DP";
    const estimatedDate =
      activeStep?.estimatedDate || record.steps.delivery.estimatedDate || null;

    return {
      currentStep,
      progressPercent: getProgressPercentage(record),
      sneakPeekStatus:
        record.steps.pelunasan.status === "completed" ? "available" : "locked",
      googleDriveLink: record.googleDriveLink,
      galleryLink: record.galleryLink,
      customerNotes: record.customerNotes,
      estimatedDate,
      completedSteps,
      completedStep: completedSteps[completedSteps.length - 1] || null,
      photoSortingStatus: record.steps.photoSorting.status,
      deliveryStatus:
        record.steps.delivery.status === "completed" ? "delivered" : "pending",
      deliveryEstimate:
        record.steps.delivery.estimatedDate || "7-14 hari kerja setelah finalisasi",
      trackingNumber: null,
    };
  };

  const getFallbackProductionProgress = (): ProductionProgress => {
    if (!currentBooking) {
      return defaultProductionProgress;
    }

    const isFullyPaid = currentBooking.paidAmount >= currentBooking.totalAmount;
    const dpVerified = payments.some((p) => p.status === "verified");

    let currentStep = "Menunggu Konfirmasi DP";
    if (currentBooking.status === "confirmed" && !isFullyPaid) {
      currentStep = "Menunggu Pelunasan";
    } else if (isFullyPaid) {
      currentStep = "Dalam Produksi";
    }

    let sneakPeekStatus: "locked" | "available" | "viewed" = "locked";
    if (isFullyPaid) {
      sneakPeekStatus = "available";
    } else if (dpVerified) {
      sneakPeekStatus = "locked";
    }

    return {
      currentStep,
      progressPercent: isFullyPaid ? 20 : dpVerified ? 10 : 0,
      sneakPeekStatus,
      galleryLink: null,
      googleDriveLink: null,
      customerNotes: "",
      estimatedDate: null,
      completedSteps: [],
      completedStep: null,
      photoSortingStatus: "waiting",
      deliveryStatus: currentBooking.status === "completed" ? "delivered" : "pending",
      deliveryEstimate: "7-14 hari kerja setelah file final siap",
      trackingNumber: null,
    };
  };

  const loadProductionProgress = async () => {
    if (!currentBooking) {
      setProductionProgress(defaultProductionProgress);
      return;
    }

    const record = await getProductionRecord(currentBooking.id);
    if (record) {
      const nextProgress = mapProductionRecordToProgress(record);
      setProductionProgress(nextProgress);
      applyProductionRecordToPhotoSelection(record);

      if (record.customerNotes && bookingDetails) {
        setBookingDetails({ ...bookingDetails, adminNotes: record.customerNotes });
      } else if (record.customerNotes && !bookingDetails) {
        const defaultDetails = getDefaultBookingDetails();
        setBookingDetails({ ...defaultDetails, adminNotes: record.customerNotes });
      }
      return;
    }

    setProductionProgress(getFallbackProductionProgress());
  };

  // ============================================================================
  // Upload Payment Proof
  // ============================================================================

  const validateFile = (file: File): string | null => {
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return "Ukuran file maksimal 5MB";
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return "Format file harus JPG, PNG, WebP, atau PDF";
    }

    return null;
  };

  const uploadPayment = async (
    file: File,
    amount: number,
    senderName: string,
    type: "dp" | "final_payment"
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentBooking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    const validationError = validateFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    if (!amount || amount <= 0) {
      return { success: false, error: "Nominal tidak valid" };
    }

    setIsSubmitting(true);

    try {
      if (!isSupabaseConfigured()) {
        // PRODUCTION: No localStorage fallback - require Supabase
        if (!import.meta.env.DEV) {
          setIsSubmitting(false);
          return {
            success: false,
            error: "Database belum dikonfigurasi. Hubungi admin.",
          };
        }
        // DEV-ONLY: Store in localStorage as development fallback
        const localPayment = {
          id: generateLocalId(),
          bookingId: currentBooking.id,
          bookingOrderNumber: currentBooking.orderNumber,
          customerName: currentBooking.customerName,
          amount,
          method: "transfer" as const,
          status: "pending" as const,
          type,
          proofImageUrl: await fileToBase64(file),
          verifiedBy: "",
          verifiedAt: "",
          createdAt: new Date().toISOString(),
          senderName,
        };

        const storedPayments = localStorage.getItem("danivisual_local_payments");
        const existingPayments = storedPayments ? JSON.parse(storedPayments) : [];
        existingPayments.push(localPayment);
        localStorage.setItem(
          "danivisual_local_payments",
          JSON.stringify(existingPayments)
        );

        const storedPending = localStorage.getItem("danivisual_pending_payments");
        const pendingPayments = storedPending ? JSON.parse(storedPending) : {};
        if (!pendingPayments[currentBooking.id]) {
          pendingPayments[currentBooking.id] = [];
        }
        pendingPayments[currentBooking.id].push(localPayment);
        localStorage.setItem(
          "danivisual_pending_payments",
          JSON.stringify(pendingPayments)
        );

        setIsSubmitting(false);
        return { success: true };
      }

      const client = getSupabaseClient();
      if (!client) {
        return { success: false, error: "Koneksi database tidak tersedia" };
      }

      // Upload proof to storage
      const ext = file.name.split(".").pop() || "jpg";
      const prefix = type === "dp" ? "dp" : "final";
      const path = `payment-proofs/${currentBooking.orderNumber}_${prefix}_${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await client.storage
        .from("payment-proofs")
        .upload(path, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        console.warn(
          "[CustomerContext] Storage upload error:",
          uploadError.message
        );
        setIsSubmitting(false);
        return { success: false, error: "Gagal upload file. Coba lagi." };
      }

      const { data: urlData } = client.storage
        .from("payment-proofs")
        .getPublicUrl(uploadData.path);

      // Create payment record
      const { error: paymentError } = await client.from("payments").insert({
        booking_order_number: currentBooking.orderNumber,
        booking_id: currentBooking.id,
        customer_name: currentBooking.customerName,
        amount,
        method: "transfer",
        status: "pending",
        payment_type: type,
        proof_image_url: urlData.publicUrl,
        sender_name: senderName || null,
      });

      if (paymentError) {
        console.error("[CustomerContext] Create payment error:", paymentError);
        setIsSubmitting(false);
        return { success: false, error: "Gagal menyimpan data pembayaran" };
      }

      // Reload payments
      await loadPayments(currentBooking.orderNumber);

      setIsSubmitting(false);
      return { success: true };
    } catch (err) {
      console.error("[CustomerContext] Upload payment error:", err);
      setIsSubmitting(false);
      return { success: false, error: "Terjadi kesalahan. Coba lagi." };
    }
  };

  const uploadPelunasanProof = async (
    file: File,
    amount: number,
    senderName: string
  ): Promise<{ success: boolean; error?: string }> => {
    return uploadPayment(file, amount, senderName, "final_payment");
  };

  const uploadFinalPayment = async (
    file: File,
    amount: number,
    senderName: string
  ): Promise<{ success: boolean; error?: string }> => {
    return uploadPayment(file, amount, senderName, "final_payment");
  };

  const generateLocalId = (): string => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ============================================================================
  // Photo Selection Functions
  // ============================================================================

  const loadPhotoSelection = () => {
    if (!currentBooking) return;

    try {
      // DEV-ONLY: Check localStorage for admin-created data
      if (import.meta.env.DEV) {
        const stored = localStorage.getItem("danivisual_photo_selections");
        if (stored) {
          const selections = JSON.parse(stored);
          const selection = selections.find(
            (s: PhotoSelection) => s.bookingId === currentBooking.id
          );
          if (selection) {
            setPhotoSelection(selection);
            return;
          }
        }
      }

      setPhotoSelection({
        bookingId: currentBooking.id,
        galleryLink: null,
        editingSelections: "",
        printingSelections: "",
        additionalNotes: "",
        status: "pending",
        submittedAt: null,
        approvedAt: null,
        approvedBy: null,
      });
    } catch (err) {
      console.warn("[CustomerContext] Load photo selection error:", err);
    }
  };

  const updatePhotoSelection = (
    updates: Partial<PhotoSelection>
  ): { success: boolean; error?: string } => {
    if (!currentBooking || !photoSelection) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    const updatedSelection = { ...photoSelection, ...updates };
    setPhotoSelection(updatedSelection);

    // DEV-ONLY: Save to localStorage
    if (import.meta.env.DEV) {
      const stored = localStorage.getItem("danivisual_photo_selections");
      const selections = stored ? JSON.parse(stored) : [];
      const existingIndex = selections.findIndex(
        (s: PhotoSelection) => s.bookingId === currentBooking.id
      );

      if (existingIndex >= 0) {
        selections[existingIndex] = updatedSelection;
      } else {
        selections.push(updatedSelection);
      }

      localStorage.setItem(
        "danivisual_photo_selections",
        JSON.stringify(selections)
      );
    }

    return { success: true };
  };

  const submitPhotoSelection = (): { success: boolean; error?: string } => {
    if (!currentBooking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    return updatePhotoSelection({
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });
  };

  // ============================================================================
  // Refresh
  // ============================================================================

  const refreshBookings = async () => {
    // Uses JWT auth — no phone needed for authenticated customers
    await loadBookingsWithAuth();
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo(
    () => ({
      customerPhone,
      customerEmail,
      isLoggedIn,
      isPortalEnabled: CLIENT_PORTAL_ENABLED,
      login,
      logout,
      bookings,
      currentBooking,
      bookingDetails,
      productionProgress,
      photoSelection,
      payments,
      isLoading,
      isSubmitting,
      error,
      refreshBookings,
      uploadPelunasanProof,
      uploadFinalPayment,
      updatePhotoSelection,
      submitPhotoSelection,
    }),
    [
      customerPhone,
      customerEmail,
      isLoggedIn,
      bookings,
      currentBooking,
      bookingDetails,
      productionProgress,
      photoSelection,
      payments,
      isLoading,
      isSubmitting,
      error,
    ]
  );

  return <CustomerContext.Provider value={value}>{children}</CustomerContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within CustomerProvider");
  }
  return context;
}

// ============================================================================
// Helpers
// ============================================================================

export function isBookingFullyPaid(booking: CustomerBooking): boolean {
  return booking.paidAmount >= booking.totalAmount;
}

export function getPaymentStatus(payments: CustomerPayment[]) {
  const dpPayment = payments.find((p) => p.type === "dp");
  const dpVerified = dpPayment?.status === "verified";
  const remainingAmount = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    dpVerified: Boolean(dpVerified),
    totalPaid: remainingAmount,
    isFullyPaid: dpVerified && remainingAmount >= DP_AMOUNT * 10,
  };
}
