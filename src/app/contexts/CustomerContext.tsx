/**
 * Customer Portal Context
 *
 * Mengelola data untuk client portal (dashboard):
 * - My Booking
 * - Payment Status
 * - Production Progress
 *
 * Data diambil dari Supabase berdasarkan customer phone/email
 * dengan RLS policies untuk keamanan.
 */

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  getProductionRecord,
  getProgressPercentage,
  ProductionRecord,
  ProductionStepStatus,
} from "../../services/productionService";
import { DP_AMOUNT } from "../data/bookingData";

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

// Photo Selection Types
export interface PhotoSelection {
  bookingId: string;
  galleryLink: string | null;
  editingSelections: string; // Comma-separated photo numbers
  printingSelections: string; // Comma-separated photo numbers
  additionalNotes: string;
  status: "pending" | "submitted" | "approved";
  submittedAt: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
}

interface CustomerContextType {
  // Customer identification
  customerPhone: string | null;
  customerEmail: string | null;
  isLoggedIn: boolean;
  login: (phone: string, email?: string) => Promise<boolean>;
  logout: () => void;

  // Booking data
  bookings: CustomerBooking[];
  currentBooking: CustomerBooking | null;
  bookingDetails: CustomerBookingDetails | null;
  productionProgress: ProductionProgress | null;
  photoSelection: PhotoSelection | null;
  payments: CustomerPayment[];

  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  refreshBookings: () => Promise<void>;
  uploadPelunasanProof: (file: File, amount: number, senderName: string) => Promise<{ success: boolean; error?: string }>;
  uploadFinalPayment: (file: File, amount: number, senderName: string) => Promise<{ success: boolean; error?: string }>;
  updatePhotoSelection: (updates: Partial<PhotoSelection>) => { success: boolean; error?: string };
  submitPhotoSelection: () => { success: boolean; error?: string };
}

const CUSTOMER_PHONE_KEY = "danivisual_customer_phone";
const CUSTOMER_EMAIL_KEY = "danivisual_customer_email";

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
  // Customer identification
  const [customerPhone, setCustomerPhone] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CUSTOMER_PHONE_KEY);
    }
    return null;
  });
  const [customerEmail, setCustomerEmail] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(CUSTOMER_EMAIL_KEY);
    }
    return null;
  });

  // Booking data
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [currentBooking, setCurrentBooking] = useState<CustomerBooking | null>(null);
  const [bookingDetails, setBookingDetails] = useState<CustomerBookingDetails | null>(null);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [productionProgress, setProductionProgress] = useState<ProductionProgress | null>(null);
  const [photoSelection, setPhotoSelection] = useState<PhotoSelection | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoggedIn = Boolean(customerPhone);

  // Load bookings when customer is logged in
  useEffect(() => {
    if (customerPhone) {
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

  const login = async (phone: string, email?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    // Store customer identification
    setCustomerPhone(phone);
    if (email) setCustomerEmail(email);
    localStorage.setItem(CUSTOMER_PHONE_KEY, phone);
    if (email) localStorage.setItem(CUSTOMER_EMAIL_KEY, email);

    // Load bookings
    await loadBookings();

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
    localStorage.removeItem(CUSTOMER_PHONE_KEY);
    localStorage.removeItem(CUSTOMER_EMAIL_KEY);
  };

  // ============================================================================
  // Load Bookings from Supabase
  // ============================================================================

  const loadBookings = async () => {
    if (!customerPhone) return;

    setIsLoading(true);
    setError(null);

    try {
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          // Load bookings for this customer
          const { data: bookingsData, error: bookingsError } = await client
            .from("bookings")
            .select("*")
            .eq("customer_phone", customerPhone)
            .order("created_at", { ascending: false });

          if (bookingsError) {
            throw new Error("Gagal memuat booking: " + bookingsError.message);
          }

          if (bookingsData && bookingsData.length > 0) {
            const loadedBookings = bookingsData.map((row) => ({
              id: row.id,
              orderNumber: row.order_number,
              customerName: row.customer_name,
              customerEmail: row.customer_email,
              customerPhone: row.customer_phone,
              packageName: row.package_name,
              packagePrice: row.package_price,
              serviceType: row.service_type || "",
              addonIds: row.addon_ids || [],
              addonTotal: row.addon_total || 0,
              eventDate: row.event_date,
              eventTime: row.event_time,
              eventLocation: row.event_location,
              eventType: row.event_type,
              totalAmount: row.total_amount,
              dpAmount: row.dp_amount,
              paidAmount: row.paid_amount,
              remainingAmount: row.remaining_amount,
              status: row.status as CustomerBooking["status"],
              deliveryMethod: row.delivery_method || "",
              packingFee: row.packing_fee || 0,
              notes: row.notes || "",
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));

            setBookings(loadedBookings);

            // Set most recent booking as current
            setCurrentBooking(loadedBookings[0]);

            // Load booking details for current booking
            if (loadedBookings[0]) {
              await loadBookingDetails(loadedBookings[0].id);
              await loadPayments(loadedBookings[0].orderNumber);
            }
          } else {
            setBookings([]);
            setCurrentBooking(null);
          }

          setIsLoading(false);
          return;
        }
      }

      // Fallback: no data
      setBookings([]);
      setCurrentBooking(null);
      setIsLoading(false);
    } catch (err) {
      console.error("[CustomerContext] Load bookings error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsLoading(false);
    }
  };

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
  // Load Production Progress from productionService/Supabase
  // ============================================================================

  const applyProductionRecordToPhotoSelection = (record: ProductionRecord) => {
    if (!record.galleryLink) return;

    setPhotoSelection((current) => {
      if (!current || current.bookingId !== record.bookingId) return current;
      return { ...current, galleryLink: record.galleryLink };
    });
  };

  const mapProductionRecordToProgress = (record: ProductionRecord): ProductionProgress => {
    const stepOrder = ["pelunasan", "photoSorting", "editing", "printing", "finishing", "delivery"] as const;
    const completedSteps = stepOrder
      .map((stepId) => record.steps[stepId])
      .filter((step) => step.status === "completed")
      .map((step) => step.name);
    const activeStep =
      stepOrder.map((stepId) => record.steps[stepId]).find((step) => step.status === "in_progress") ||
      stepOrder.map((stepId) => record.steps[stepId]).find((step) => step.status === "waiting");
    const allCompleted = completedSteps.length === stepOrder.length;
    const currentStep = allCompleted ? "Selesai" : activeStep?.name || "Menunggu Konfirmasi DP";
    const estimatedDate = activeStep?.estimatedDate || record.steps.delivery.estimatedDate || null;

    return {
      currentStep,
      progressPercent: getProgressPercentage(record),
      sneakPeekStatus: record.steps.pelunasan.status === "completed" ? "available" : "locked",
      googleDriveLink: record.googleDriveLink,
      galleryLink: record.galleryLink,
      customerNotes: record.customerNotes,
      estimatedDate,
      completedSteps,
      completedStep: completedSteps[completedSteps.length - 1] || null,
      photoSortingStatus: record.steps.photoSorting.status,
      deliveryStatus: record.steps.delivery.status === "completed" ? "delivered" : "pending",
      deliveryEstimate: record.steps.delivery.estimatedDate || "7-14 hari kerja setelah finalisasi",
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
  // Upload Payment Proof with Validation
  // ============================================================================

  const validateFile = (file: File): string | null => {
    // Max size: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return "Ukuran file maksimal 5MB";
    }

    // Allowed types
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

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      return { success: false, error: validationError };
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return { success: false, error: "Nominal tidak valid" };
    }

    setIsSubmitting(true);

    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured()) {
        // Fallback: store in localStorage
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

        // Store in localStorage
        const storedPayments = localStorage.getItem("danivisual_local_payments");
        const existingPayments = storedPayments ? JSON.parse(storedPayments) : [];
        existingPayments.push(localPayment);
        localStorage.setItem("danivisual_local_payments", JSON.stringify(existingPayments));

        // Also store in pending payments for sync
        const storedPending = localStorage.getItem("danivisual_pending_payments");
        const pendingPayments = storedPending ? JSON.parse(storedPending) : {};
        if (!pendingPayments[currentBooking.id]) {
          pendingPayments[currentBooking.id] = [];
        }
        pendingPayments[currentBooking.id].push(localPayment);
        localStorage.setItem("danivisual_pending_payments", JSON.stringify(pendingPayments));

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
        console.warn("[CustomerContext] Storage upload error:", uploadError.message);
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

  // Helper function to generate local ID
  const generateLocalId = (): string => {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Helper function to convert file to base64
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
      // First check localStorage for admin-created data
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

      // Default empty selection
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

    // Save to localStorage
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

    localStorage.setItem("danivisual_photo_selections", JSON.stringify(selections));

    return { success: true };
  };

  const submitPhotoSelection = (): { success: boolean; error?: string } => {
    if (!currentBooking) {
      return { success: false, error: "Booking tidak ditemukan" };
    }

    const result = updatePhotoSelection({
      status: "submitted",
      submittedAt: new Date().toISOString(),
    });

    return result;
  };

  // ============================================================================
  // Refresh
  // ============================================================================

  const refreshBookings = async () => {
    await loadBookings();
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo(
    () => ({
      customerPhone,
      customerEmail,
      isLoggedIn,
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
// Helper: Check if booking is fully paid
// ============================================================================

export function isBookingFullyPaid(booking: CustomerBooking): boolean {
  return booking.paidAmount >= booking.totalAmount;
}

// ============================================================================
// Helper: Get payment status
// ============================================================================

export function getPaymentStatus(payments: CustomerPayment[]) {
  const dpPayment = payments.find((p) => p.type === "dp");
  const dpVerified = dpPayment?.status === "verified";
  const remainingAmount = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  return {
    dpVerified: Boolean(dpVerified),
    totalPaid: remainingAmount,
    isFullyPaid: dpVerified && remainingAmount >= DP_AMOUNT * 10, // Assuming total is ~10x DP
  };
}
