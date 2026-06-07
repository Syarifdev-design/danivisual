/**
 * Booking Service
 *
 * Mengelola operasi untuk:
 * - Booking Sessions (frontend state)
 * - Booking Submissions
 * - Booking Status Updates
 *
 * Sumber utama: PHP API
 * Fallback: localStorage (booking state only)
 */

import { apiClient, getLocalData, setLocalData } from "../lib/apiClient";

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
// Booking State Operations (localStorage - session only)
// ============================================================================

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

export const saveBookingState = (state: BookingState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearBookingState = (): void => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(LEGACY_STORAGE_KEY);
};

export const updateBookingState = (updates: Partial<BookingState>): BookingState => {
  const currentState = getBookingState();
  const newState = { ...currentState, ...updates };

  if (updates.eventData) {
    newState.eventData = {
      ...currentState.eventData,
      ...updates.eventData,
      coupleName: updates.eventData.coupleName || updates.eventData.eventName || currentState.eventData.coupleName,
      eventName: updates.eventData.coupleName || updates.eventData.eventName || currentState.eventData.eventName,
      customerName: updates.eventData.coupleName || updates.eventData.eventName || currentState.eventData.customerName,
      activeWhatsapp: updates.eventData.activeWhatsapp || updates.eventData.whatsapp || currentState.eventData.activeWhatsapp,
      whatsapp: updates.eventData.activeWhatsapp || updates.eventData.whatsapp || currentState.eventData.whatsapp,
      instagramUsername: updates.eventData.instagramUsername || updates.eventData.instagram || currentState.eventData.instagramUsername,
      instagram: updates.eventData.instagramUsername || updates.eventData.instagram || currentState.eventData.instagramUsername,
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
// Booking Submission (via PHP API)
// ============================================================================

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
  const dpAmount = 500000;

  const eventInfo = {
    coupleName: state.eventData.coupleName || state.eventData.eventName,
    eventDate: state.eventData.eventDate,
    eventTime: state.eventData.eventTime,
    eventLocation: state.eventData.eventLocationAddress || state.eventData.location,
  };

  try {
    const response = await apiClient.createBooking({
      customer_name: eventInfo.coupleName,
      customer_email: state.eventData.email || "",
      customer_phone: state.eventData.activeWhatsapp || state.eventData.whatsapp || "",
      package_id: state.selectedPackageId,
      package_name: packageDetails.name,
      package_price: packageDetails.price,
      event_date: eventInfo.eventDate,
      event_time: eventInfo.eventTime,
      event_location: eventInfo.eventLocation,
      event_type: packageDetails.categoryId,
      service_type: packageDetails.serviceType,
      total_amount: totalAmount,
      notes: state.eventData.adminNotes || "",
    });

    if (response.success && response.data) {
      const bookingData = response.data as Record<string, unknown>;
      const returnedOrderNumber = (bookingData.order_number as string) || orderNumber;
      updateBookingState({
        bookingSubmitted: true,
        orderNumber: returnedOrderNumber,
      });
      return { success: true, orderNumber: returnedOrderNumber };
    }
  } catch (err) {
    console.warn("[BookingService] submitBooking API error:", err);
  }

  // Fallback: save to localStorage
  updateBookingState({
    bookingSubmitted: true,
    orderNumber,
  });

  return { success: true, orderNumber };
};

// ============================================================================
// Booking Status Operations (via PHP API)
// ============================================================================

export const updateBookingStatus = async (
  orderNumber: string,
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled"
): Promise<boolean> => {
  try {
    const response = await apiClient.updateBooking(orderNumber, { status });
    return response.success;
  } catch (err) {
    console.warn("[BookingService] updateBookingStatus error:", err);
    return false;
  }
};

export const getBookingByOrderNumber = async (
  orderNumber: string
): Promise<BookingRecord | null> => {
  try {
    const response = await apiClient.getBookingById(orderNumber);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        id: row.id as string,
        orderNumber: (row.order_number as string) || orderNumber,
        customerName: (row.customer_name as string) || '',
        packageName: (row.package_name as string) || '',
        totalAmount: Number(row.total_amount) || 0,
        dpAmount: Number(row.dp_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        remainingAmount: Number(row.remaining_amount) || 0,
        status: (row.status as "pending" | "confirmed" | "in_progress" | "completed" | "cancelled") || 'pending',
        eventDate: (row.event_date as string) || '',
        eventLocation: (row.event_location as string) || '',
        createdAt: (row.created_at as string) || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("[BookingService] getBookingByOrderNumber error:", err);
  }
  return null;
};

// ============================================================================
// Payment Proof Upload
// ============================================================================

export const uploadPaymentProof = async (
  orderNumber: string,
  file: File
): Promise<{ success: boolean; url?: string; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      try {
        const response = await apiClient.createPayment({
          booking_order_number: orderNumber,
          amount: 500000,
          method: "transfer",
          type: "dp",
          proof_image: base64,
        });

        if (response.success) {
          resolve({ success: true, url: base64 });
          return;
        }
      } catch (err) {
        console.warn("[BookingService] uploadPaymentProof API error:", err);
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

export const startBookingSession = (): void => {
  saveBookingState(defaultState);
};

export const hasActiveBookingSession = (): boolean => {
  const state = getBookingState();
  return Boolean(state.selectedPackageId && state.bookingSubmitted);
};

export const getCurrentBookingSession = (): BookingState => {
  return getBookingState();
};