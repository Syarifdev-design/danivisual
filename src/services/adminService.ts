/**
 * Admin Service
 *
 * Mengelola operasi CRUD untuk data admin:
 * - Bookings (via apiClient)
 * - Customers (via apiClient)
 * - Payments (via apiClient)
 * - Calendar Events (via apiClient)
 * - Staff (via apiClient)
 * - Analytics
 *
 * Sumber utama: PHP API
 * Fallback: localStorage (non-critical data only)
 */

import { apiClient, getLocalData, setLocalData } from "../lib/apiClient";

// ============================================================================
// Types
// ============================================================================

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "verified" | "rejected";
export type AdminRole = "super_admin" | "admin" | "finance" | "editor" | "photographer" | "videographer" | "staff" | "customer";

export interface Booking {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  addonIds: string[];
  addonTotal: number;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  serviceType: string;
  totalAmount: number;
  dpAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: BookingStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  bookingOrderNumber: string;
  customerName: string;
  amount: number;
  method: "transfer" | "cash" | "other";
  status: PaymentStatus;
  type: "dp" | "final_payment";
  proofImage: string;
  notes: string;
  verifiedBy: string;
  verifiedAt: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "booking" | "blocked" | "event";
  bookingId?: string;
  description: string;
  createdBy: string;
}

export interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface AnalyticsData {
  date: string;
  views: number;
  bookings: number;
  revenue: number;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEYS = {
  bookings: "danivisual_admin_bookings",
  customers: "danivisual_admin_customers",
  payments: "danivisual_admin_payments",
  calendar: "danivisual_admin_calendar",
  admins: "danivisual_admin_admins",
  analytics: "danivisual_admin_analytics",
};

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ============================================================================
// Booking Operations (via PHP API)
// ============================================================================

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const response = await apiClient.getBookings();
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      return (rawData as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        orderNumber: (row.order_number as string) || '',
        customerId: (row.customer_id as string) || '',
        customerName: (row.customer_name as string) || '',
        customerEmail: (row.customer_email as string) || '',
        customerPhone: (row.customer_phone as string) || '',
        packageId: (row.package_id as string) || '',
        packageName: (row.package_name as string) || '',
        packagePrice: Number(row.package_price) || 0,
        addonIds: (row.addon_ids as string[]) || [],
        addonTotal: Number(row.addon_total) || 0,
        eventDate: (row.event_date as string) || '',
        eventLocation: (row.event_location as string) || '',
        eventType: (row.event_type as string) || '',
        serviceType: (row.service_type as string) || '',
        totalAmount: Number(row.total_amount) || 0,
        dpAmount: Number(row.dp_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        remainingAmount: Number(row.remaining_amount) || 0,
        status: (row.status as BookingStatus) || 'pending',
        notes: (row.notes as string) || '',
        createdAt: (row.created_at as string) || '',
        updatedAt: (row.updated_at as string) || '',
      }));
    }
  } catch (err) {
    console.warn("[AdminService] getBookings error:", err);
  }
  return getLocalData<Booking[]>(STORAGE_KEYS.bookings, []);
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    const response = await apiClient.getBookingById(id);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        id: row.id as string,
        orderNumber: (row.order_number as string) || '',
        customerId: (row.customer_id as string) || '',
        customerName: (row.customer_name as string) || '',
        customerEmail: (row.customer_email as string) || '',
        customerPhone: (row.customer_phone as string) || '',
        packageId: (row.package_id as string) || '',
        packageName: (row.package_name as string) || '',
        packagePrice: Number(row.package_price) || 0,
        addonIds: [],
        addonTotal: Number(row.addon_total) || 0,
        eventDate: (row.event_date as string) || '',
        eventLocation: (row.event_location as string) || '',
        eventType: (row.event_type as string) || '',
        serviceType: (row.service_type as string) || '',
        totalAmount: Number(row.total_amount) || 0,
        dpAmount: Number(row.dp_amount) || 0,
        paidAmount: Number(row.paid_amount) || 0,
        remainingAmount: Number(row.remaining_amount) || 0,
        status: (row.status as BookingStatus) || 'pending',
        notes: (row.notes as string) || '',
        createdAt: (row.created_at as string) || '',
        updatedAt: (row.updated_at as string) || '',
      };
    }
  } catch (err) {
    console.warn("[AdminService] getBookingById error:", err);
  }
  return null;
};

export const createBooking = async (
  bookingData: Omit<Booking, "id" | "orderNumber" | "createdAt" | "updatedAt">
): Promise<Booking | null> => {
  try {
    const response = await apiClient.createBooking(bookingData);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        ...bookingData,
        id: row.id as string,
        orderNumber: (row.order_number as string) || '',
        createdAt: (row.created_at as string) || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("[AdminService] createBooking error:", err);
  }
  return null;
};

export const updateBooking = async (
  id: string,
  updates: Partial<Booking>
): Promise<boolean> => {
  try {
    const response = await apiClient.updateBooking(id, updates);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] updateBooking error:", err);
    return false;
  }
};

export const updateBookingStatus = async (
  id: string,
  status: BookingStatus
): Promise<boolean> => {
  return updateBooking(id, { status });
};

export const deleteBooking = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`/bookings/${id}`);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] deleteBooking error:", err);
    return false;
  }
};

// ============================================================================
// Customer Operations (via PHP API)
// ============================================================================

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const response = await apiClient.getCustomers();
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      return (rawData as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        name: (row.name as string) || '',
        email: (row.email as string) || '',
        phone: (row.phone as string) || '',
        address: (row.address as string) || '',
        notes: (row.notes as string) || '',
        createdAt: (row.created_at as string) || '',
      }));
    }
  } catch (err) {
    console.warn("[AdminService] getCustomers error:", err);
  }
  return getLocalData<Customer[]>(STORAGE_KEYS.customers, []);
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const response = await apiClient.getCustomerById(id);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        id: row.id as string,
        name: (row.name as string) || '',
        email: (row.email as string) || '',
        phone: (row.phone as string) || '',
        address: (row.address as string) || '',
        notes: (row.notes as string) || '',
        createdAt: (row.created_at as string) || '',
      };
    }
  } catch (err) {
    console.warn("[AdminService] getCustomerById error:", err);
  }
  return null;
};

export const createCustomer = async (
  customerData: Omit<Customer, "id" | "createdAt">
): Promise<Customer | null> => {
  try {
    const response = await apiClient.createCustomer(customerData);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        ...customerData,
        id: row.id as string || generateId(),
        createdAt: (row.created_at as string) || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("[AdminService] createCustomer error:", err);
  }
  return null;
};

export const updateCustomer = async (
  id: string,
  updates: Partial<Customer>
): Promise<boolean> => {
  try {
    const response = await apiClient.updateCustomer(id, updates);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] updateCustomer error:", err);
    return false;
  }
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] deleteCustomer error:", err);
    return false;
  }
};

// ============================================================================
// Payment Operations (via PHP API)
// ============================================================================

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const response = await apiClient.getPayments();
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      return (rawData as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        bookingId: (row.booking_id as string) || '',
        bookingOrderNumber: (row.booking_order_number as string) || '',
        customerName: (row.customer_name as string) || '',
        amount: Number(row.amount) || 0,
        method: (row.method as "transfer" | "cash" | "other") || 'transfer',
        status: (row.status as PaymentStatus) || 'pending',
        type: (row.payment_type as "dp" | "final_payment") || 'dp',
        proofImage: (row.proof_image_url as string) || (row.proofImage as string) || '',
        notes: (row.notes as string) || '',
        verifiedBy: (row.verified_by as string) || '',
        verifiedAt: (row.verified_at as string) || '',
        createdAt: (row.created_at as string) || '',
      }));
    }
  } catch (err) {
    console.warn("[AdminService] getPayments error:", err);
  }
  return getLocalData<Payment[]>(STORAGE_KEYS.payments, []);
};

export const getPaymentsByBookingId = async (bookingId: string): Promise<Payment[]> => {
  try {
    const response = await apiClient.getPayments({ booking_id: bookingId });
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      return rawData as unknown as Payment[];
    }
  } catch (err) {
    console.warn("[AdminService] getPaymentsByBookingId error:", err);
  }
  const payments = getLocalData<Payment[]>(STORAGE_KEYS.payments, []);
  return payments.filter((p) => p.bookingId === bookingId);
};

export const createPayment = async (
  paymentData: Omit<Payment, "id" | "createdAt">
): Promise<Payment | null> => {
  try {
    const response = await apiClient.createPayment({
      booking_id: paymentData.bookingId,
      booking_order_number: paymentData.bookingOrderNumber,
      customer_name: paymentData.customerName,
      amount: paymentData.amount,
      method: paymentData.method,
      type: paymentData.type,
      proof_image: paymentData.proofImage,
      notes: paymentData.notes,
    });

    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        ...paymentData,
        id: row.id as string || generateId(),
        createdAt: (row.created_at as string) || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("[AdminService] createPayment error:", err);
  }
  return null;
};

export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus,
  verifiedBy?: string
): Promise<boolean> => {
  try {
    const response = status === 'verified'
      ? await apiClient.verifyPayment(id)
      : await apiClient.rejectPayment(id);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] updatePaymentStatus error:", err);
    return false;
  }
};

// ============================================================================
// Calendar Operations (via PHP API)
// ============================================================================

export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  try {
    const response = await apiClient.getCalendarEvents();
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      return (rawData as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        date: (row.event_date as string) || (row.date as string) || '',
        title: (row.title as string) || '',
        type: (row.event_type as "booking" | "blocked" | "event") || 'event',
        bookingId: row.booking_id as string | undefined,
        description: (row.description as string) || '',
        createdBy: (row.created_by as string) || '',
      }));
    }
  } catch (err) {
    console.warn("[AdminService] getCalendarEvents error:", err);
  }
  return getLocalData<CalendarEvent[]>(STORAGE_KEYS.calendar, []);
};

export const getCalendarEventsByRange = async (
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> => {
  try {
    const response = await apiClient.getCalendarEvents({ date_from: startDate, date_to: endDate });
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      return rawData as unknown as CalendarEvent[];
    }
  } catch (err) {
    console.warn("[AdminService] getCalendarEventsByRange error:", err);
  }
  const events = getLocalData<CalendarEvent[]>(STORAGE_KEYS.calendar, []);
  return events.filter((e) => e.date >= startDate && e.date <= endDate);
};

export const createCalendarEvent = async (
  eventData: Omit<CalendarEvent, "id">
): Promise<CalendarEvent | null> => {
  try {
    const response = await apiClient.createCalendarEvent({
      event_date: eventData.date,
      title: eventData.title,
      event_type: eventData.type,
      description: eventData.description,
    });

    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        ...eventData,
        id: row.id as string || generateId(),
      };
    }
  } catch (err) {
    console.warn("[AdminService] createCalendarEvent error:", err);
  }
  return null;
};

export const updateCalendarEvent = async (
  id: string,
  updates: Partial<CalendarEvent>
): Promise<boolean> => {
  try {
    const response = await apiClient.updateCalendarEvent(id, updates);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] updateCalendarEvent error:", err);
    return false;
  }
};

export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.deleteCalendarEvent(id);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] deleteCalendarEvent error:", err);
    return false;
  }
};

// ============================================================================
// Admin User Operations (via PHP API)
// ============================================================================

export const getAdminUsers = async (): Promise<AdminUser[]> => {
  try {
    const response = await apiClient.getStaff();
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      return (rawData as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        username: (row.username as string) || (row.email as string) || '',
        name: (row.name as string) || '',
        role: (row.role as AdminRole) || 'staff',
        isActive: Boolean(row.is_active ?? true),
        lastLogin: row.last_login as string | undefined,
        createdAt: (row.created_at as string) || '',
      }));
    }
  } catch (err) {
    console.warn("[AdminService] getAdminUsers error:", err);
  }
  return getLocalData<AdminUser[]>(STORAGE_KEYS.admins, []);
};

export const getAdminUserById = async (id: string): Promise<AdminUser | null> => {
  try {
    const response = await apiClient.getStaffById(id);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        id: row.id as string,
        username: (row.username as string) || (row.email as string) || '',
        name: (row.name as string) || '',
        role: (row.role as AdminRole) || 'staff',
        isActive: Boolean(row.is_active ?? true),
        lastLogin: row.last_login as string | undefined,
        createdAt: (row.created_at as string) || '',
      };
    }
  } catch (err) {
    console.warn("[AdminService] getAdminUserById error:", err);
  }
  return null;
};

export const createAdminUser = async (
  adminData: Omit<AdminUser, "id" | "createdAt" | "lastLogin">
): Promise<AdminUser | null> => {
  try {
    const response = await apiClient.createStaff(adminData);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        ...adminData,
        id: row.id as string || generateId(),
        createdAt: (row.created_at as string) || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.warn("[AdminService] createAdminUser error:", err);
  }
  return null;
};

export const updateAdminUser = async (
  id: string,
  updates: Partial<AdminUser>
): Promise<boolean> => {
  try {
    const response = await apiClient.updateStaff(id, updates);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] updateAdminUser error:", err);
    return false;
  }
};

export const deleteAdminUser = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.deleteStaff(id);
    return response.success;
  } catch (err) {
    console.warn("[AdminService] deleteAdminUser error:", err);
    return false;
  }
};

// ============================================================================
// Analytics Operations (localStorage fallback)
// ============================================================================

export const getAnalytics = async (): Promise<AnalyticsData[]> => {
  return getLocalData<AnalyticsData[]>(STORAGE_KEYS.analytics, []);
};

export const addAnalytics = async (data: AnalyticsData): Promise<boolean> => {
  const analytics = getLocalData<AnalyticsData[]>(STORAGE_KEYS.analytics, []);
  const existingIndex = analytics.findIndex((a) => a.date === data.date);

  if (existingIndex >= 0) {
    analytics[existingIndex] = {
      ...analytics[existingIndex],
      views: analytics[existingIndex].views + data.views,
      bookings: analytics[existingIndex].bookings + data.bookings,
      revenue: analytics[existingIndex].revenue + data.revenue,
    };
  } else {
    analytics.push(data);
  }

  setLocalData(STORAGE_KEYS.analytics, analytics);
  return true;
};

// ============================================================================
// Stats Helpers
// ============================================================================

export const calculateStats = async (): Promise<{
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalRevenue: number;
  monthlyBookings: number;
  monthlyRevenue: number;
  pendingPayments: number;
}> => {
  const bookings = await getBookings();
  const payments = await getPayments();

  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const monthlyBookingsList = bookings.filter((b) => {
    const date = new Date(b.createdAt);
    return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
  });

  return {
    totalBookings: bookings.length,
    pendingBookings: bookings.filter((b) => b.status === "pending" || b.status === "confirmed").length,
    completedBookings: bookings.filter((b) => b.status === "completed").length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.paidAmount, 0),
    monthlyBookings: monthlyBookingsList.length,
    monthlyRevenue: monthlyBookingsList.reduce((sum, b) => sum + b.paidAmount, 0),
    pendingPayments: payments.filter((p) => p.status === "pending").length,
  };
};