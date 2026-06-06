/**
 * Booking Service
 *
 * Mengelola operasi untuk:
 * - Booking Sessions (frontend state)
 * - Booking Submissions
 * - Booking Status Updates
 *
 * Menggunakan Supabase dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export interface SelectedAddon {
  id: string;
  quantity: number;
}

export type DeliveryMethod = "expedition" | "cod-agent" | "pickup-office" | "";

export interface EventData {
  coupleName: string;
  decorationPlan: string;
  fullAddress: string;
  instagramUsername: string;
  activeWhatsapp: string;
  eventDate: string;
  eventTime: string;
  eventTimePending: boolean;
  eventLocationAddress: string;
  googleMapsLink: string;
  adminNotes: string;
  eventName: string;
  customerName: string;
  whatsapp: string;
  email: string;
  instagram: string;
  location: string;
  mapsLink: string;
  muaPlan: string;
}

export interface BookingState {
  selectedCategoryId: string;
  selectedPackageId: string;
  selectedServiceTypeId: string;
  selectedAddons: SelectedAddon[];
  deliveryMethod: DeliveryMethod;
  eventData: EventData;
  paymentData: { proofName: string };
  termsAccepted: boolean;
  reviewAccepted: boolean;
  bookingSubmitted: boolean;
  orderNumber: string;
  accountPendingVerification: boolean;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEY = "danivisual_booking_state_v2";
const LEGACY_STORAGE_KEY = "danivisual_booking_state";

// ============================================================================
// Helper Functions
// ============================================================================

const generateOrderNumber = (): string => {
  const date = new Date();
  const dateStr = date.toLocaleDateString("id-ID", { format: "ddMMyy" }).replace(/\//g, "");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `DV-${dateStr}-${random}`;
};

const normalizePackageId = (value?: string): string => {
  const legacyMap: Record<string, string> = {
    "wedding-basic": "basic",
    "wedding-premium": "premium",
    "wedding-exclusive": "exclusive",
  };
  return value ? legacyMap[value] || value : "";
};

// ============================================================================
// Default State
// ============================================================================

const defaultEventData: EventData = {
  coupleName: "",
  decorationPlan: "",
  fullAddress: "",
  instagramUsername: "",
  activeWhatsapp: "",
  eventDate: "",
  eventTime: "",
  eventTimePending: false,
  eventLocationAddress: "",
  googleMapsLink: "",
  adminNotes: "",
  eventName: "",
  customerName: "",
  whatsapp: "",
  email: "",
  instagram: "",
  location: "",
  mapsLink: "",
  muaPlan: "",
};

const defaultState: BookingState = {
  selectedCategoryId: "wedding",
  selectedPackageId: "",
  selectedServiceTypeId: "",
  selectedAddons: [],
  deliveryMethod: "",
  eventData: defaultEventData,
  paymentData: { proofName: "" },
  termsAccepted: false,
  reviewAccepted: false,
  bookingSubmitted: false,
  orderNumber: "",
  accountPendingVerification: true,
};

// ============================================================================
// LocalStorage Operations
// ============================================================================

/**
 * Ambil booking state dari localStorage
 */
export const getBookingState = (): BookingState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!stored) return defaultState;

    const state = JSON.parse(stored);
    return {
      ...defaultState,
      ...state,
      selectedPackageId: normalizePackageId(state.selectedPackageId),
      eventData: {
        ...defaultEventData,
        ...(state.eventData || {}),
        // Normalize field names
        coupleName: state.eventData?.coupleName || state.eventData?.eventName || "",
        activeWhatsapp: state.eventData?.activeWhatsapp || state.eventData?.whatsapp || "",
        instagramUsername: state.eventData?.instagramUsername || state.eventData?.instagram || "",
        eventLocationAddress: state.eventData?.eventLocationAddress || state.eventData?.location || "",
        googleMapsLink: state.eventData?.googleMapsLink || state.eventData?.mapsLink || "",
      },
    };
  } catch {
    return defaultState;
  }
};

/**
 * Simpan booking state ke localStorage
 */
export const saveBookingState = (state: BookingState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

/**
 * Hapus booking state dari localStorage
 */
export const clearBookingState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
};

/**
 * Update sebagian booking state
 */
export const updateBookingState = (updates: Partial<BookingState>): BookingState => {
  const currentState = getBookingState();
  const newState = { ...currentState, ...updates };

  // Special handling for eventData
  if (updates.eventData) {
    newState.eventData = {
      ...currentState.eventData,
      ...updates.eventData,
      // Normalize field names
      coupleName: updates.eventData.coupleName || updates.eventData.eventName || currentState.eventData.coupleName,
      eventName: updates.eventData.coupleName || updates.eventData.eventName || currentState.eventData.eventName,
      customerName: updates.eventData.coupleName || updates.eventData.eventName || currentState.eventData.customerName,
      activeWhatsapp: updates.eventData.activeWhatsapp || updates.eventData.whatsapp || currentState.eventData.activeWhatsapp,
      whatsapp: updates.eventData.activeWhatsapp || updates.eventData.whatsapp || currentState.eventData.whatsapp,
      instagramUsername: updates.eventData.instagramUsername || updates.eventData.instagram || currentState.eventData.instagramUsername,
      instagram: updates.eventData.instagramUsername || updates.eventData.instagram || currentState.eventData.instagram,
      eventLocationAddress: updates.eventData.eventLocationAddress || updates.eventData.location || currentState.eventData.eventLocationAddress,
      location: updates.eventData.eventLocationAddress || updates.eventData.location || currentState.eventData.location,
      googleMapsLink: updates.eventData.googleMapsLink || updates.eventData.mapsLink || currentState.eventData.googleMapsLink,
      mapsLink: updates.eventData.googleMapsLink || updates.eventData.mapsLink || currentState.eventData.mapsLink,
    };
  }

  saveBookingState(newState);
  return newState;
};

// ============================================================================
// Booking Submission
// ============================================================================

/**
 * Submit booking baru ke database
 */
export const submitBooking = async (
  state: BookingState,
  packageDetails: {
    name: string;
    price: number;
    categoryId: string;
    serviceType: string;
  },
  addons: Array<{ id: string; price: number; quantity: number }>
): Promise<{ success: boolean; orderNumber?: string; error?: string }> => {
  const orderNumber = generateOrderNumber();
  const totalAmount = packageDetails.price + addons.reduce((sum, a) => sum + a.price * a.quantity, 0);
  const dpAmount = 500000; // From bookingData.ts

  // Map event data to backend format
  const eventInfo = {
    coupleName: state.eventData.coupleName || state.eventData.eventName,
    eventDate: state.eventData.eventDate,
    eventTime: state.eventData.eventTime,
    eventLocation: state.eventData.eventLocationAddress || state.eventData.location,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: "Database not available" };
    }

    // First, create or get customer
    let customerId = "";

    // Check if customer exists by phone
    const { data: existingCustomer } = await client
      .from("customers")
      .select("id")
      .eq("phone", state.eventData.activeWhatsapp || state.eventData.whatsapp)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await client
        .from("customers")
        .insert({
          name: eventInfo.coupleName,
          email: state.eventData.email || "",
          phone: state.eventData.activeWhatsapp || state.eventData.whatsapp || "",
          address: state.eventData.fullAddress || "",
          instagram: state.eventData.instagramUsername || state.eventData.instagram || "",
        })
        .select("id")
        .single();

      if (customerError) {
        console.error("[BookingService] create customer error:", customerError);
        return { success: false, error: "Failed to create customer" };
      }

      customerId = newCustomer.id;
    }

    // Create booking
    const { error: bookingError } = await client.from("bookings").insert({
      order_number: orderNumber,
      customer_id: customerId,
      customer_name: eventInfo.coupleName,
      customer_email: state.eventData.email || "",
      customer_phone: state.eventData.activeWhatsapp || state.eventData.whatsapp || "",
      package_id: state.selectedPackageId,
      package_name: packageDetails.name,
      package_price: packageDetails.price,
      addon_ids: addons.map((a) => a.id),
      addon_total: addons.reduce((sum, a) => sum + a.price * a.quantity, 0),
      event_date: eventInfo.eventDate,
      event_location: eventInfo.eventLocation || "",
      event_type: packageDetails.categoryId,
      service_type: packageDetails.serviceType,
      total_amount: totalAmount,
      dp_amount: dpAmount,
      paid_amount: 0,
      remaining_amount: totalAmount,
      status: "pending",
      is_active: true,
      notes: state.eventData.adminNotes || "",
    });

    if (bookingError) {
      console.error("[BookingService] create booking error:", bookingError);
      return { success: false, error: "Failed to create booking" };
    }

    // Update booking state with order number
    updateBookingState({
      bookingSubmitted: true,
      orderNumber,
    });

    return { success: true, orderNumber };
  }

  // Fallback: Save to localStorage (already handled by context)
  updateBookingState({
    bookingSubmitted: true,
    orderNumber,
  });

  return { success: true, orderNumber };
};

// ============================================================================
// Booking Status Operations
// ============================================================================

/**
 * Update status booking dari admin
 */
export const updateBookingStatus = async (
  orderNumber: string,
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const timestamp = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status,
      updated_at: timestamp,
    };

    if (status === "cancelled") {
      updates.is_active = false;
      updates.archived_at = timestamp;
    }

    const { error } = await client
      .from("bookings")
      .update(updates)
      .eq("order_number", orderNumber);

    if (error) {
      console.error("[BookingService] updateBookingStatus error:", error);
      return false;
    }

    return true;
  }

  // Fallback: localStorage - handled by adminService
  return false;
};

/**
 * Cancel/archive booking by order number without deleting historical data.
 */
export const cancelBooking = async (orderNumber: string): Promise<boolean> => {
  return updateBookingStatus(orderNumber, "cancelled");
};

/**
 * Get booking by order number
 */
export const getBookingByOrderNumber = async (
  orderNumber: string
): Promise<BookingRecord | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("bookings")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      packageName: data.package_name,
      totalAmount: data.total_amount,
      dpAmount: data.dp_amount,
      paidAmount: data.paid_amount,
      remainingAmount: data.remaining_amount,
      status: data.status,
      eventDate: data.event_date,
      eventLocation: data.event_location,
      createdAt: data.created_at,
    };
  }

  // Fallback: Not available in localStorage for this service
  return null;
};

// ============================================================================
// Payment Proof Upload
// ============================================================================

/**
 * Upload bukti pembayaran
 */
export const uploadPaymentProof = async (
  orderNumber: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          try {
            const fileName = `payment_${orderNumber}_${Date.now()}.${file.name.split(".").pop()}`;
            const { error: uploadError } = await client.storage
              .from("payment-proofs")
              .upload(fileName, file);

            if (!uploadError) {
              const { data } = client.storage
                .from("payment-proofs")
                .getPublicUrl(fileName);

              // Create payment record
              const { data: bookingData } = await client
                .from("bookings")
                .select("id")
                .eq("order_number", orderNumber)
                .maybeSingle();

              const { error: paymentError } = await client.from("payments").insert({
                booking_id: bookingData?.id || null,
                booking_order_number: orderNumber,
                customer_name: "",
                amount: 500000, // DP amount
                method: "transfer",
                status: "pending",
                payment_type: "dp",
                proof_image_url: data.publicUrl,
              });

              if (!paymentError) {
                resolve({ success: true, url: data.publicUrl });
                return;
              }
            }
          } catch (err) {
            console.error("[BookingService] upload payment error:", err);
          }
        }
      }

      // Fallback: use base64
      resolve({ success: true, url: base64 });
    };

    reader.onerror = () => resolve({ success: false, error: "Failed to read file" });
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// Types for return values
// ============================================================================

export interface BookingRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  packageName: string;
  totalAmount: number;
  dpAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  eventDate: string;
  eventLocation: string;
  createdAt: string;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Start fresh booking session
 */
export const startBookingSession = (): void => {
  saveBookingState(defaultState);
};

/**
 * Check if there's an active booking session
 */
export const hasActiveBookingSession = (): boolean => {
  const state = getBookingState();
  return Boolean(state.selectedPackageId && state.bookingSubmitted);
};

/**
 * Get current booking session data
 */
export const getCurrentBookingSession = (): BookingState => {
  return getBookingState();
};
