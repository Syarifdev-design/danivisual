/**
 * Inquiry Service
 *
 * Mengelola operasi CRUD untuk inquiry dari form kontak.
 * Menggunakan Supabase sebagai sumber utama dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export type InquiryStatus = "new" | "contacted" | "converted" | "archived";

export interface Inquiry {
  id: string;
  name: string;
  email?: string;
  whatsapp?: string;
  serviceType?: string;
  message?: string;
  status: InquiryStatus;
  source: string;
  customerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInquiryData {
  name: string;
  email?: string;
  whatsapp?: string;
  serviceType?: string;
  message?: string;
}

export interface ConvertedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: string;
  status: string;
}

export interface ConvertInquiryResult {
  success: boolean;
  customer: ConvertedCustomer | null;
  duplicate: boolean;
  error?: string;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEY = "danivisual_inquiries";
const CUSTOMERS_STORAGE_KEY = "danivisual_admin_customers";

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

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

const normalizeContact = (value?: string | null): string => (value || "").replace(/\D/g, "");

const mapRowToCustomer = (row: Record<string, unknown>): ConvertedCustomer => ({
  id: String(row.id || ""),
  name: String(row.name || ""),
  email: String(row.email || ""),
  phone: String(row.phone || ""),
  source: String(row.source || "manual"),
  status: String(row.status || "lead"),
});

// Map database row to Inquiry interface
const mapRowToInquiry = (row: Record<string, unknown>): Inquiry => ({
  id: row.id as string,
  name: row.name as string,
  email: row.email as string | undefined,
  whatsapp: row.whatsapp as string | undefined,
  serviceType: row.service_type as string | undefined,
  message: row.message as string | undefined,
  status: (row.status as InquiryStatus) || "new",
  source: row.source as string || "contact_page",
  customerId: row.customer_id as string | undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// ============================================================================
// Inquiry Operations
// ============================================================================

/**
 * Ambil semua inquiries
 * Urutan: Supabase → localStorage → []
 */
export const getInquiries = async (): Promise<Inquiry[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("inquiries")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0) {
          const inquiries = data.map(mapRowToInquiry);
          // Cache to localStorage
          setLocalData(STORAGE_KEY, inquiries);
          return inquiries;
        }
      } catch (err) {
        console.warn("[InquiryService] Supabase error:", err);
      }
    }
  }

  // Fallback localStorage
  return getLocalData<Inquiry[]>(STORAGE_KEY, []);
};

/**
 * Ambil inquiries by status
 */
export const getInquiriesByStatus = async (status: InquiryStatus): Promise<Inquiry[]> => {
  const inquiries = await getInquiries();
  return inquiries.filter((inquiry) => inquiry.status === status);
};

/**
 * Ambil inquiries by source
 */
export const getInquiriesBySource = async (source: string): Promise<Inquiry[]> => {
  const inquiries = await getInquiries();
  return inquiries.filter((inquiry) => inquiry.source === source);
};

/**
 * Ambil inquiry by ID
 */
export const getInquiryById = async (id: string): Promise<Inquiry | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("inquiries")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          return mapRowToInquiry(data);
        }
      } catch (err) {
        console.warn("[InquiryService] getInquiryById error:", err);
      }
    }
  }

  const inquiries = await getInquiries();
  return inquiries.find((inquiry) => inquiry.id === id) || null;
};

/**
 * Buat inquiry baru
 */
export const createInquiry = async (
  data: CreateInquiryData
): Promise<Inquiry | null> => {
  const newInquiry: Inquiry = {
    id: generateId(),
    name: data.name,
    email: data.email,
    whatsapp: data.whatsapp,
    serviceType: data.serviceType,
    message: data.message,
    status: "new",
    source: "contact_page",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("inquiries")
          .insert({
            name: newInquiry.name,
            email: newInquiry.email || null,
            whatsapp: newInquiry.whatsapp || null,
            service_type: newInquiry.serviceType || null,
            message: newInquiry.message || null,
            status: newInquiry.status,
            source: newInquiry.source,
          })
          .select()
          .single();

        if (!error && dbData) {
          const created = mapRowToInquiry(dbData);
          // Update localStorage cache
          const allInquiries = await getInquiries();
          setLocalData(STORAGE_KEY, [created, ...allInquiries]);
          return created;
        }
      } catch (err) {
        console.warn("[InquiryService] createInquiry error:", err);
      }
    }
  }

  // Fallback localStorage
  const allInquiries = await getInquiries();
  setLocalData(STORAGE_KEY, [newInquiry, ...allInquiries]);
  return newInquiry;
};

/**
 * Update inquiry status
 */
export const updateInquiryStatus = async (
  id: string,
  status: InquiryStatus
): Promise<Inquiry | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("inquiries")
          .update({ status })
          .eq("id", id)
          .select()
          .single();

        if (!error && dbData) {
          const updated = mapRowToInquiry(dbData);
          // Update localStorage cache
          const allInquiries = await getInquiries();
          const newInquiries = allInquiries.map((inquiry) =>
            inquiry.id === id ? updated : inquiry
          );
          setLocalData(STORAGE_KEY, newInquiries);
          return updated;
        }
      } catch (err) {
        console.warn("[InquiryService] updateInquiryStatus error:", err);
      }
    }
  }

  // Fallback localStorage
  const allInquiries = await getInquiries();
  const updatedInquiries = allInquiries.map((inquiry) =>
    inquiry.id === id
      ? { ...inquiry, status, updatedAt: new Date().toISOString() }
      : inquiry
  );
  setLocalData(STORAGE_KEY, updatedInquiries);
  return updatedInquiries.find((inquiry) => inquiry.id === id) || null;
};

const findExistingCustomer = async (phone?: string, email?: string): Promise<ConvertedCustomer | null> => {
  const normalizedPhone = normalizeContact(phone);
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        if (normalizedPhone) {
          const { data, error } = await client
            .from("customers")
            .select("id,name,email,phone,source,status")
            .eq("is_active", true)
            .eq("phone", phone)
            .limit(1);

          if (!error && data && data.length > 0) return mapRowToCustomer(data[0]);
        }

        if (normalizedEmail) {
          const { data, error } = await client
            .from("customers")
            .select("id,name,email,phone,source,status")
            .eq("is_active", true)
            .eq("email", email)
            .limit(1);

          if (!error && data && data.length > 0) return mapRowToCustomer(data[0]);
        }
      } catch (err) {
        console.warn("[InquiryService] findExistingCustomer error:", err);
      }
    }
  }

  const localCustomers = getLocalData<Record<string, unknown>[]>(CUSTOMERS_STORAGE_KEY, []);
  const existing = localCustomers.find((customer) => {
    const customerPhone = normalizeContact(customer.phone as string | undefined);
    const customerEmail = String(customer.email || "").trim().toLowerCase();
    return (
      (normalizedPhone && customerPhone === normalizedPhone) ||
      (normalizedEmail && customerEmail === normalizedEmail)
    ) && customer.isActive !== false && customer.is_active !== false;
  });

  return existing ? mapRowToCustomer(existing) : null;
};

const createCustomerFromInquiry = async (inquiry: Inquiry): Promise<ConvertedCustomer | null> => {
  const now = new Date().toISOString();
  const customer = {
    id: generateId(),
    name: inquiry.name,
    email: inquiry.email || "",
    phone: inquiry.whatsapp || "",
    address: "",
    instagram: "",
    notes: inquiry.message || "",
    status: "lead",
    source: "inquiry",
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("customers")
          .insert({
            name: customer.name,
            email: customer.email || null,
            phone: customer.phone,
            address: customer.address || null,
            instagram: customer.instagram || null,
            notes: customer.notes || null,
            status: customer.status,
            source: customer.source,
            is_active: true,
            created_at: now,
            updated_at: now,
          })
          .select("id,name,email,phone,source,status")
          .single();

        if (!error && data) return mapRowToCustomer(data);
        if (error) console.warn("[InquiryService] createCustomerFromInquiry error:", error.message);
      } catch (err) {
        console.warn("[InquiryService] createCustomerFromInquiry error:", err);
      }
    }
  }

  const localCustomers = getLocalData<Record<string, unknown>[]>(CUSTOMERS_STORAGE_KEY, []);
  setLocalData(CUSTOMERS_STORAGE_KEY, [customer, ...localCustomers]);
  return mapRowToCustomer({
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    source: customer.source,
    status: customer.status,
  });
};

const markInquiryConverted = async (inquiryId: string, customerId: string): Promise<Inquiry | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("inquiries")
          .update({ status: "converted", customer_id: customerId })
          .eq("id", inquiryId)
          .select()
          .single();

        if (!error && data) return mapRowToInquiry(data);

        // If customer_id migration has not been applied yet, keep conversion working.
        const { data: statusData, error: statusError } = await client
          .from("inquiries")
          .update({ status: "converted" })
          .eq("id", inquiryId)
          .select()
          .single();

        if (!statusError && statusData) return mapRowToInquiry(statusData);
        if (error) console.warn("[InquiryService] markInquiryConverted error:", error.message);
      } catch (err) {
        console.warn("[InquiryService] markInquiryConverted error:", err);
      }
    }
  }

  const allInquiries = await getInquiries();
  const updatedInquiries = allInquiries.map((inquiry) =>
    inquiry.id === inquiryId
      ? { ...inquiry, status: "converted" as InquiryStatus, customerId, updatedAt: new Date().toISOString() }
      : inquiry
  );
  setLocalData(STORAGE_KEY, updatedInquiries);
  return updatedInquiries.find((inquiry) => inquiry.id === inquiryId) || null;
};

/**
 * Convert inquiry into a Customer lead.
 */
export const convertInquiryToCustomer = async (inquiryId: string): Promise<ConvertInquiryResult> => {
  const inquiry = await getInquiryById(inquiryId);
  if (!inquiry) {
    return { success: false, customer: null, duplicate: false, error: "Inquiry tidak ditemukan." };
  }

  const existingCustomer = await findExistingCustomer(inquiry.whatsapp, inquiry.email);
  if (existingCustomer) {
    await markInquiryConverted(inquiry.id, existingCustomer.id);
    return { success: true, customer: existingCustomer, duplicate: true };
  }

  const customer = await createCustomerFromInquiry(inquiry);
  if (!customer) {
    return { success: false, customer: null, duplicate: false, error: "Gagal membuat customer dari inquiry." };
  }

  await markInquiryConverted(inquiry.id, customer.id);
  return { success: true, customer, duplicate: false };
};

/**
 * Delete inquiry
 */
export const deleteInquiry = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from("inquiries")
          .delete()
          .eq("id", id);

        if (!error) {
          // Update localStorage cache
          const allInquiries = await getInquiries();
          setLocalData(
            STORAGE_KEY,
            allInquiries.filter((inquiry) => inquiry.id !== id)
          );
          return true;
        }
      } catch (err) {
        console.warn("[InquiryService] deleteInquiry error:", err);
      }
    }
  }

  // Fallback localStorage
  const allInquiries = await getInquiries();
  setLocalData(
    STORAGE_KEY,
    allInquiries.filter((inquiry) => inquiry.id !== id)
  );
  return true;
};

/**
 * Get inquiry statistics
 */
export const getInquiryStats = async (): Promise<{
  total: number;
  new: number;
  contacted: number;
  converted: number;
  archived: number;
}> => {
  const inquiries = await getInquiries();

  return {
    total: inquiries.length,
    new: inquiries.filter((i) => i.status === "new").length,
    contacted: inquiries.filter((i) => i.status === "contacted").length,
    converted: inquiries.filter((i) => i.status === "converted").length,
    archived: inquiries.filter((i) => i.status === "archived").length,
  };
};

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Export all inquiries
 */
export const exportInquiryData = async (): Promise<string> => {
  const inquiries = await getInquiries();

  return JSON.stringify(
    {
      schema: "danivisual.inquiries.v1",
      exportedAt: new Date().toISOString(),
      inquiries,
    },
    null,
    2
  );
};

/**
 * Import inquiries from JSON
 */
export const importInquiryData = async (payload: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(payload);

    if (!parsed.schema?.includes("danivisual.inquiries")) {
      throw new Error("Invalid format");
    }

    if (parsed.inquiries) {
      setLocalData(STORAGE_KEY, parsed.inquiries);
    }
    return true;
  } catch (err) {
    console.error("[InquiryService] importInquiryData error:", err);
    return false;
  }
};
