/**
 * Admin Service
 *
 * Mengelola operasi CRUD untuk data admin:
 * - Bookings
 * - Customers
 * - Payments
 * - Calendar Events
 * - Admin Users
 * - Analytics
 *
 * Menggunakan Supabase dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

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
const generateOrderNumber = (): string => {
  const date = new Date();
  const dateStr = date.toLocaleDateString("id-ID", { format: "ddMMyy" }).replace(/\//g, "");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `DV-${dateStr}-${random}`;
};

// ============================================================================
// LocalStorage Fallback
// ============================================================================

const getLocalData = <T>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setLocalData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// ============================================================================
// Booking Operations
// ============================================================================

/**
 * Ambil semua bookings
 */
export const getBookings = async (): Promise<Booking[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminService] getBookings error:", error);
      return [];
    }

    return data || [];
  }

  return getLocalData<Booking[]>(STORAGE_KEYS.bookings, []);
};

/**
 * Ambil booking by ID
 */
export const getBookingById = async (id: string): Promise<Booking | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  const bookings = getLocalData<Booking[]>(STORAGE_KEYS.bookings, []);
  return bookings.find((b) => b.id === id) || null;
};

/**
 * Ambil booking by order number
 */
export const getBookingByOrderNumber = async (orderNumber: string): Promise<Booking | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("bookings")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (error || !data) return null;
    return data;
  }

  const bookings = getLocalData<Booking[]>(STORAGE_KEYS.bookings, []);
  return bookings.find((b) => b.orderNumber === orderNumber) || null;
};

/**
 * Buat booking baru
 */
export const createBooking = async (
  bookingData: Omit<Booking, "id" | "orderNumber" | "createdAt" | "updatedAt">
): Promise<Booking | null> => {
  const now = new Date().toISOString();
  const newBooking: Booking = {
    ...bookingData,
    id: generateId(),
    orderNumber: generateOrderNumber(),
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("bookings")
      .insert({
        id: newBooking.id,
        order_number: newBooking.orderNumber,
        customer_id: newBooking.customerId,
        customer_name: newBooking.customerName,
        customer_email: newBooking.customerEmail,
        customer_phone: newBooking.customerPhone,
        package_id: newBooking.packageId,
        package_name: newBooking.packageName,
        package_price: newBooking.packagePrice,
        addon_ids: newBooking.addonIds,
        addon_total: newBooking.addonTotal,
        event_date: newBooking.eventDate,
        event_location: newBooking.eventLocation,
        event_type: newBooking.eventType,
        service_type: newBooking.serviceType,
        total_amount: newBooking.totalAmount,
        dp_amount: newBooking.dpAmount,
        paid_amount: newBooking.paidAmount,
        remaining_amount: newBooking.remainingAmount,
        status: newBooking.status,
        notes: newBooking.notes,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error("[AdminService] createBooking error:", error);
      return null;
    }

    return data;
  }

  // Fallback
  const bookings = getLocalData<Booking[]>(STORAGE_KEYS.bookings, []);
  bookings.unshift(newBooking);
  setLocalData(STORAGE_KEYS.bookings, bookings);
  return newBooking;
};

/**
 * Update booking
 */
export const updateBooking = async (
  id: string,
  updates: Partial<Booking>
): Promise<boolean> => {
  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("bookings")
      .update({ ...updates, updated_at: timestamp })
      .eq("id", id);

    if (error) {
      console.error("[AdminService] updateBooking error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const bookings = getLocalData<Booking[]>(STORAGE_KEYS.bookings, []);
  const updatedBookings = bookings.map((b) =>
    b.id === id ? { ...b, ...updates, updatedAt: timestamp } : b
  );
  setLocalData(STORAGE_KEYS.bookings, updatedBookings);
  return true;
};

/**
 * Update booking status
 */
export const updateBookingStatus = async (
  id: string,
  status: BookingStatus
): Promise<boolean> => {
  return updateBooking(id, { status });
};

/**
 * Hapus booking
 */
export const deleteBooking = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("bookings").delete().eq("id", id);

    if (error) {
      console.error("[AdminService] deleteBooking error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const bookings = getLocalData<Booking[]>(STORAGE_KEYS.bookings, []);
  setLocalData(
    STORAGE_KEYS.bookings,
    bookings.filter((b) => b.id !== id)
  );
  return true;
};

// ============================================================================
// Customer Operations
// ============================================================================

/**
 * Ambil semua customers
 */
export const getCustomers = async (): Promise<Customer[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminService] getCustomers error:", error);
      return [];
    }

    return data || [];
  }

  return getLocalData<Customer[]>(STORAGE_KEYS.customers, []);
};

/**
 * Ambil customer by ID
 */
export const getCustomerById = async (id: string): Promise<Customer | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("customers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  const customers = getLocalData<Customer[]>(STORAGE_KEYS.customers, []);
  return customers.find((c) => c.id === id) || null;
};

/**
 * Buat customer baru
 */
export const createCustomer = async (
  customerData: Omit<Customer, "id" | "createdAt">
): Promise<Customer | null> => {
  const newCustomer: Customer = {
    ...customerData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("customers")
      .insert({
        id: newCustomer.id,
        name: newCustomer.name,
        email: newCustomer.email,
        phone: newCustomer.phone,
        address: newCustomer.address,
        notes: newCustomer.notes,
        created_at: newCustomer.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error("[AdminService] createCustomer error:", error);
      return null;
    }

    return data;
  }

  // Fallback
  const customers = getLocalData<Customer[]>(STORAGE_KEYS.customers, []);
  customers.unshift(newCustomer);
  setLocalData(STORAGE_KEYS.customers, customers);
  return newCustomer;
};

/**
 * Update customer
 */
export const updateCustomer = async (
  id: string,
  updates: Partial<Customer>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("customers")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[AdminService] updateCustomer error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const customers = getLocalData<Customer[]>(STORAGE_KEYS.customers, []);
  const updatedCustomers = customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
  setLocalData(STORAGE_KEYS.customers, updatedCustomers);
  return true;
};

/**
 * Hapus customer
 */
export const deleteCustomer = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("customers").delete().eq("id", id);

    if (error) {
      console.error("[AdminService] deleteCustomer error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const customers = getLocalData<Customer[]>(STORAGE_KEYS.customers, []);
  setLocalData(
    STORAGE_KEYS.customers,
    customers.filter((c) => c.id !== id)
  );
  return true;
};

// ============================================================================
// Payment Operations
// ============================================================================

/**
 * Ambil semua payments
 */
export const getPayments = async (): Promise<Payment[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminService] getPayments error:", error);
      return [];
    }

    return data || [];
  }

  return getLocalData<Payment[]>(STORAGE_KEYS.payments, []);
};

/**
 * Ambil payments by booking ID
 */
export const getPaymentsByBookingId = async (bookingId: string): Promise<Payment[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("payments")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[AdminService] getPaymentsByBookingId error:", error);
      return [];
    }

    return data || [];
  }

  const payments = getLocalData<Payment[]>(STORAGE_KEYS.payments, []);
  return payments.filter((p) => p.bookingId === bookingId);
};

/**
 * Buat payment baru
 */
export const createPayment = async (
  paymentData: Omit<Payment, "id" | "createdAt">
): Promise<Payment | null> => {
  const newPayment: Payment = {
    ...paymentData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("payments")
      .insert({
        id: newPayment.id,
        booking_id: newPayment.bookingId,
        booking_order_number: newPayment.bookingOrderNumber,
        customer_name: newPayment.customerName,
        amount: newPayment.amount,
        method: newPayment.method,
        status: newPayment.status,
        payment_type: newPayment.type,
        proof_image_url: newPayment.proofImage,
        notes: newPayment.notes,
        verified_by: newPayment.verifiedBy,
        verified_at: newPayment.verifiedAt,
        created_at: newPayment.createdAt,
      })
      .select()
      .single();

    if (error) {
      console.error("[AdminService] createPayment error:", error);
      return null;
    }

    return data;
  }

  // Fallback
  const payments = getLocalData<Payment[]>(STORAGE_KEYS.payments, []);
  payments.unshift(newPayment);
  setLocalData(STORAGE_KEYS.payments, payments);
  return newPayment;
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  id: string,
  status: PaymentStatus,
  verifiedBy?: string
): Promise<boolean> => {
  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const updates: Record<string, string> = { status };
    if (verifiedBy) {
      updates.verified_by = verifiedBy;
      updates.verified_at = timestamp;
    }

    const { error } = await client
      .from("payments")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[AdminService] updatePaymentStatus error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const payments = getLocalData<Payment[]>(STORAGE_KEYS.payments, []);
  const updatedPayments = payments.map((p) =>
    p.id === id
      ? {
          ...p,
          status,
          verifiedBy: verifiedBy || p.verifiedBy,
          verifiedAt: status === "verified" || status === "rejected" ? timestamp : p.verifiedAt,
        }
      : p
  );
  setLocalData(STORAGE_KEYS.payments, updatedPayments);
  return true;
};

// ============================================================================
// Calendar Operations
// ============================================================================

/**
 * Ambil semua calendar events
 */
export const getCalendarEvents = async (): Promise<CalendarEvent[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("calendar_events")
      .select("*")
      .order("date", { ascending: true });

    if (error) {
      console.error("[AdminService] getCalendarEvents error:", error);
      return [];
    }

    return data || [];
  }

  return getLocalData<CalendarEvent[]>(STORAGE_KEYS.calendar, []);
};

/**
 * Ambil calendar events by date range
 */
export const getCalendarEventsByRange = async (
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("calendar_events")
      .select("*")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      console.error("[AdminService] getCalendarEventsByRange error:", error);
      return [];
    }

    return data || [];
  }

  const events = getLocalData<CalendarEvent[]>(STORAGE_KEYS.calendar, []);
  return events.filter((e) => e.date >= startDate && e.date <= endDate);
};

/**
 * Buat calendar event baru
 */
export const createCalendarEvent = async (
  eventData: Omit<CalendarEvent, "id">
): Promise<CalendarEvent | null> => {
  const newEvent: CalendarEvent = {
    ...eventData,
    id: generateId(),
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("calendar_events")
      .insert({
        id: newEvent.id,
        date: newEvent.date,
        title: newEvent.title,
        type: newEvent.type,
        booking_id: newEvent.bookingId,
        description: newEvent.description,
        created_by: newEvent.createdBy,
      })
      .select()
      .single();

    if (error) {
      console.error("[AdminService] createCalendarEvent error:", error);
      return null;
    }

    return data;
  }

  // Fallback
  const events = getLocalData<CalendarEvent[]>(STORAGE_KEYS.calendar, []);
  events.push(newEvent);
  setLocalData(STORAGE_KEYS.calendar, events);
  return newEvent;
};

/**
 * Update calendar event
 */
export const updateCalendarEvent = async (
  id: string,
  updates: Partial<CalendarEvent>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("calendar_events")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[AdminService] updateCalendarEvent error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const events = getLocalData<CalendarEvent[]>(STORAGE_KEYS.calendar, []);
  const updatedEvents = events.map((e) => (e.id === id ? { ...e, ...updates } : e));
  setLocalData(STORAGE_KEYS.calendar, updatedEvents);
  return true;
};

/**
 * Hapus calendar event
 */
export const deleteCalendarEvent = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("calendar_events").delete().eq("id", id);

    if (error) {
      console.error("[AdminService] deleteCalendarEvent error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const events = getLocalData<CalendarEvent[]>(STORAGE_KEYS.calendar, []);
  setLocalData(
    STORAGE_KEYS.calendar,
    events.filter((e) => e.id !== id)
  );
  return true;
};

// ============================================================================
// Admin User Operations
// ============================================================================

/**
 * Ambil semua admin users
 */
export const getAdminUsers = async (): Promise<AdminUser[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[AdminService] getAdminUsers error:", error);
      return [];
    }

    return data || [];
  }

  return getLocalData<AdminUser[]>(STORAGE_KEYS.admins, []);
};

/**
 * Ambil admin user by ID
 */
export const getAdminUserById = async (id: string): Promise<AdminUser | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("admin_users")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  const admins = getLocalData<AdminUser[]>(STORAGE_KEYS.admins, []);
  return admins.find((a) => a.id === id) || null;
};

/**
 * Buat admin user baru
 */
export const createAdminUser = async (
  adminData: Omit<AdminUser, "id" | "createdAt" | "lastLogin">
): Promise<AdminUser | null> => {
  const newAdmin: AdminUser = {
    ...adminData,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    console.warn("[AdminService] createAdminUser disabled in Supabase mode. Use staffUserService/create-staff-user Edge Function.");
    return null;
  }

  // Fallback
  const admins = getLocalData<AdminUser[]>(STORAGE_KEYS.admins, []);
  admins.push(newAdmin);
  setLocalData(STORAGE_KEYS.admins, admins);
  return newAdmin;
};

/**
 * Update admin user
 */
export const updateAdminUser = async (
  id: string,
  updates: Partial<AdminUser>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client
      .from("admin_users")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("[AdminService] updateAdminUser error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const admins = getLocalData<AdminUser[]>(STORAGE_KEYS.admins, []);
  const updatedAdmins = admins.map((a) => (a.id === id ? { ...a, ...updates } : a));
  setLocalData(STORAGE_KEYS.admins, updatedAdmins);
  return true;
};

/**
 * Hapus admin user
 */
export const deleteAdminUser = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("admin_users").delete().eq("id", id);

    if (error) {
      console.error("[AdminService] deleteAdminUser error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const admins = getLocalData<AdminUser[]>(STORAGE_KEYS.admins, []);
  setLocalData(
    STORAGE_KEYS.admins,
    admins.filter((a) => a.id !== id)
  );
  return true;
};

// ============================================================================
// Analytics Operations
// ============================================================================

/**
 * Ambil analytics data
 */
export const getAnalytics = async (): Promise<AnalyticsData[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("analytics")
      .select("*")
      .order("date", { ascending: false });

    if (error) {
      console.error("[AdminService] getAnalytics error:", error);
      return [];
    }

    return data || [];
  }

  return getLocalData<AnalyticsData[]>(STORAGE_KEYS.analytics, []);
};

/**
 * Tambah/Update analytics data untuk satu tanggal
 */
export const addAnalytics = async (data: AnalyticsData): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    // Check if exists
    const { data: existing } = await client
      .from("analytics")
      .select("*")
      .eq("date", data.date)
      .single();

    if (existing) {
      // Update
      const { error } = await client
        .from("analytics")
        .update({
          views: existing.views + data.views,
          bookings: existing.bookings + data.bookings,
          revenue: existing.revenue + data.revenue,
        })
        .eq("date", data.date);

      if (error) {
        console.error("[AdminService] addAnalytics update error:", error);
        return false;
      }
    } else {
      // Insert
      const { error } = await client.from("analytics").insert({
        date: data.date,
        views: data.views,
        bookings: data.bookings,
        revenue: data.revenue,
      });

      if (error) {
        console.error("[AdminService] addAnalytics insert error:", error);
        return false;
      }
    }

    return true;
  }

  // Fallback
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

/**
 * Hitung stats untuk dashboard
 */
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
