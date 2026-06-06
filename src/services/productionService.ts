/**
 * Production Service
 *
 * Mengelola operasi untuk:
 * - Production Records
 * - Production Steps Update
 * - Links Management (Google Drive, Gallery)
 * - Photo Selections
 *
 * Menggunakan Supabase dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export type ProductionStepStatus = "waiting" | "in_progress" | "completed";

export interface ProductionStep {
  id: string;
  name: string;
  status: ProductionStepStatus;
  note: string;
  estimatedDate: string | null;
  completedAt: string | null;
}

export interface ProductionSteps {
  pelunasan: ProductionStep;
  photoSorting: ProductionStep;
  editing: ProductionStep;
  printing: ProductionStep;
  finishing: ProductionStep;
  delivery: ProductionStep;
}

export interface ProductionRecord {
  id?: string;
  bookingId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  packageName: string;
  eventDate: string;
  eventLocation: string;
  steps: ProductionSteps;
  googleDriveLink: string | null;
  galleryLink: string | null;
  customerNotes: string;
  updatedAt: string;
}

// Booking info for creating new records
export interface BookingInfo {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  packageName: string;
  eventDate: string;
  eventLocation: string;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEY = "danivisual_production_records";

// ============================================================================
// Default Steps
// ============================================================================

const defaultSteps: ProductionSteps = {
  pelunasan: {
    id: "pelunasan",
    name: "Pelunasan & Sneak Peek",
    status: "waiting",
    note: "",
    estimatedDate: null,
    completedAt: null,
  },
  photoSorting: {
    id: "photoSorting",
    name: "Photo Sorting",
    status: "waiting",
    note: "",
    estimatedDate: null,
    completedAt: null,
  },
  editing: {
    id: "editing",
    name: "Editing",
    status: "waiting",
    note: "",
    estimatedDate: null,
    completedAt: null,
  },
  printing: {
    id: "printing",
    name: "Cetak",
    status: "waiting",
    note: "",
    estimatedDate: null,
    completedAt: null,
  },
  finishing: {
    id: "finishing",
    name: "Finishing",
    status: "waiting",
    note: "",
    estimatedDate: null,
    completedAt: null,
  },
  delivery: {
    id: "delivery",
    name: "Delivery",
    status: "waiting",
    note: "",
    estimatedDate: null,
    completedAt: null,
  },
};

// ============================================================================
// LocalStorage Operations (Fallback)
// ============================================================================

/**
 * Get all production records from localStorage
 */
export const getProductionRecordsFromStorage = (): ProductionRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

/**
 * Save production records to localStorage
 */
export const saveProductionRecordsToStorage = (records: ProductionRecord[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

/**
 * Get single production record by booking ID from localStorage
 */
export const getProductionRecordFromStorage = (bookingId: string): ProductionRecord | null => {
  const records = getProductionRecordsFromStorage();
  return records.find((r) => r.bookingId === bookingId) || null;
};

/**
 * Save single production record to localStorage
 */
export const saveProductionRecordToStorage = (record: ProductionRecord): void => {
  const records = getProductionRecordsFromStorage();
  const index = records.findIndex((r) => r.bookingId === record.bookingId);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  saveProductionRecordsToStorage(records);
};

// ============================================================================
// Supabase Operations
// ============================================================================

/**
 * Get all production records from Supabase
 */
export const getProductionRecords = async (): Promise<ProductionRecord[]> => {
  if (!isSupabaseConfigured()) {
    return getProductionRecordsFromStorage();
  }

  const client = getSupabaseClient();
  if (!client) {
    return getProductionRecordsFromStorage();
  }

  try {
    const { data, error } = await client
      .from("production_records")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[ProductionService] Failed to fetch from Supabase:", error.message);
      return getProductionRecordsFromStorage();
    }

    if (!data || data.length === 0) {
      // No data in Supabase, try localStorage
      return getProductionRecordsFromStorage();
    }

    // Map database records to app format
    const records: ProductionRecord[] = data.map((row) => ({
      id: row.id,
      bookingId: row.booking_id,
      orderNumber: row.order_number,
      customerName: row.customer_name,
      customerPhone: row.customer_phone || "",
      packageName: row.package_name || "",
      eventDate: row.event_date || "",
      eventLocation: row.event_location || "",
      steps: mapStepsFromDb(row.steps),
      googleDriveLink: row.google_drive_link || null,
      galleryLink: row.gallery_link || null,
      customerNotes: row.customer_notes || "",
      updatedAt: row.updated_at,
    }));

    // Sync to localStorage as backup
    saveProductionRecordsToStorage(records);

    return records;
  } catch (err) {
    console.error("[ProductionService] getProductionRecords error:", err);
    return getProductionRecordsFromStorage();
  }
};

/**
 * Get single production record by booking ID
 */
export const getProductionRecord = async (bookingId: string): Promise<ProductionRecord | null> => {
  if (!isSupabaseConfigured()) {
    return getProductionRecordFromStorage(bookingId);
  }

  const client = getSupabaseClient();
  if (!client) {
    return getProductionRecordFromStorage(bookingId);
  }

  try {
    const { data, error } = await client
      .from("production_records")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (error || !data) {
      // Fallback to localStorage
      return getProductionRecordFromStorage(bookingId);
    }

    return {
      id: data.id,
      bookingId: data.booking_id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerPhone: data.customer_phone || "",
      packageName: data.package_name || "",
      eventDate: data.event_date || "",
      eventLocation: data.event_location || "",
      steps: mapStepsFromDb(data.steps),
      googleDriveLink: data.google_drive_link || null,
      galleryLink: data.gallery_link || null,
      customerNotes: data.customer_notes || "",
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error("[ProductionService] getProductionRecord error:", err);
    return getProductionRecordFromStorage(bookingId);
  }
};

/**
 * Create production record from booking
 */
export const createProductionRecordFromBooking = async (
  booking: BookingInfo
): Promise<ProductionRecord | null> => {
  const newRecord: ProductionRecord = {
    bookingId: booking.id,
    orderNumber: booking.orderNumber,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    packageName: booking.packageName,
    eventDate: booking.eventDate,
    eventLocation: booking.eventLocation,
    steps: { ...defaultSteps },
    googleDriveLink: null,
    galleryLink: null,
    customerNotes: "",
    updatedAt: new Date().toISOString(),
  };

  // Always save to localStorage first (backup)
  saveProductionRecordToStorage(newRecord);

  if (!isSupabaseConfigured()) {
    return newRecord;
  }

  const client = getSupabaseClient();
  if (!client) {
    return newRecord;
  }

  try {
    const { data, error } = await client
      .from("production_records")
      .insert({
        booking_id: booking.id,
        order_number: booking.orderNumber,
        customer_name: booking.customerName,
        customer_phone: booking.customerPhone,
        package_name: booking.packageName,
        event_date: booking.eventDate,
        event_location: booking.eventLocation,
        steps: mapStepsToDb(newRecord.steps),
        google_drive_link: null,
        gallery_link: null,
        customer_notes: "",
      })
      .select("id")
      .single();

    if (!error && data) {
      newRecord.id = data.id;
      // Update localStorage with the generated ID
      saveProductionRecordToStorage(newRecord);
    }

    return newRecord;
  } catch (err) {
    console.error("[ProductionService] createProductionRecordFromBooking error:", err);
    // Record is already saved to localStorage
    return newRecord;
  }
};

/**
 * Update production step status
 */
export const updateProductionStep = async (
  bookingId: string,
  stepId: keyof ProductionSteps,
  updates: {
    status?: ProductionStepStatus;
    note?: string;
    estimatedDate?: string | null;
  }
): Promise<ProductionRecord | null> => {
  // Get current record
  const currentRecord = getProductionRecordFromStorage(bookingId);
  if (!currentRecord) {
    console.warn("[ProductionService] Record not found for step update:", bookingId);
    return null;
  }

  // Update step
  const updatedStep: ProductionStep = {
    ...currentRecord.steps[stepId],
    ...updates,
    completedAt:
      updates.status === "completed" ? new Date().toISOString() : currentRecord.steps[stepId].completedAt,
  };

  const updatedRecord: ProductionRecord = {
    ...currentRecord,
    steps: {
      ...currentRecord.steps,
      [stepId]: updatedStep,
    },
    updatedAt: new Date().toISOString(),
  };

  // Save to localStorage immediately
  saveProductionRecordToStorage(updatedRecord);

  if (!isSupabaseConfigured()) {
    return updatedRecord;
  }

  const client = getSupabaseClient();
  if (!client) {
    return updatedRecord;
  }

  try {
    // Update in Supabase
    await client
      .from("production_records")
      .update({
        steps: mapStepsToDb(updatedRecord.steps),
        updated_at: updatedRecord.updatedAt,
      })
      .eq("booking_id", bookingId);

    return updatedRecord;
  } catch (err) {
    console.error("[ProductionService] updateProductionStep error:", err);
    // Record is already saved to localStorage
    return updatedRecord;
  }
};

/**
 * Update production links (Google Drive, Gallery, Notes)
 */
export const updateProductionLinks = async (
  bookingId: string,
  updates: {
    googleDriveLink?: string | null;
    galleryLink?: string | null;
    customerNotes?: string;
  }
): Promise<ProductionRecord | null> => {
  // Get current record
  const currentRecord = getProductionRecordFromStorage(bookingId);
  if (!currentRecord) {
    console.warn("[ProductionService] Record not found for links update:", bookingId);
    return null;
  }

  const updatedRecord: ProductionRecord = {
    ...currentRecord,
    googleDriveLink:
      updates.googleDriveLink !== undefined ? updates.googleDriveLink : currentRecord.googleDriveLink,
    galleryLink: updates.galleryLink !== undefined ? updates.galleryLink : currentRecord.galleryLink,
    customerNotes:
      updates.customerNotes !== undefined ? updates.customerNotes : currentRecord.customerNotes,
    updatedAt: new Date().toISOString(),
  };

  // Save to localStorage immediately
  saveProductionRecordToStorage(updatedRecord);

  if (!isSupabaseConfigured()) {
    return updatedRecord;
  }

  const client = getSupabaseClient();
  if (!client) {
    return updatedRecord;
  }

  try {
    const dbUpdates: Record<string, unknown> = {
      updated_at: updatedRecord.updatedAt,
    };

    if (updates.googleDriveLink !== undefined) {
      dbUpdates.google_drive_link = updates.googleDriveLink;
    }
    if (updates.galleryLink !== undefined) {
      dbUpdates.gallery_link = updates.galleryLink;
    }
    if (updates.customerNotes !== undefined) {
      dbUpdates.customer_notes = updates.customerNotes;
    }

    await client
      .from("production_records")
      .update(dbUpdates)
      .eq("booking_id", bookingId);

    return updatedRecord;
  } catch (err) {
    console.error("[ProductionService] updateProductionLinks error:", err);
    // Record is already saved to localStorage
    return updatedRecord;
  }
};

// ============================================================================
// Helper Functions for DB Mapping
// ============================================================================

function mapStepsFromDb(dbSteps: unknown): ProductionSteps {
  if (!dbSteps || typeof dbSteps !== "object") {
    return { ...defaultSteps };
  }

  const steps = dbSteps as Record<string, unknown>;

  return {
    pelunasan: mapStepFromDb(steps.pelunasan, defaultSteps.pelunasan),
    photoSorting: mapStepFromDb(steps.photoSorting, defaultSteps.photoSorting),
    editing: mapStepFromDb(steps.editing, defaultSteps.editing),
    printing: mapStepFromDb(steps.printing, defaultSteps.printing),
    finishing: mapStepFromDb(steps.finishing, defaultSteps.finishing),
    delivery: mapStepFromDb(steps.delivery, defaultSteps.delivery),
  };
}

function mapStepFromDb(dbStep: unknown, defaultStep: ProductionStep): ProductionStep {
  if (!dbStep || typeof dbStep !== "object") {
    return defaultStep;
  }

  const step = dbStep as Record<string, unknown>;

  return {
    id: (step.id as string) || defaultStep.id,
    name: (step.name as string) || defaultStep.name,
    status: (step.status as ProductionStepStatus) || defaultStep.status,
    note: (step.note as string) || defaultStep.note,
    estimatedDate: step.estimatedDate as string | null,
    completedAt: step.completedAt as string | null,
  };
}

function mapStepsToDb(steps: ProductionSteps): Record<string, unknown> {
  return {
    pelunasan: steps.pelunasan,
    photoSorting: steps.photoSorting,
    editing: steps.editing,
    printing: steps.printing,
    finishing: steps.finishing,
    delivery: steps.delivery,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get current production status based on steps
 */
export const getCurrentProductionStatus = (record: ProductionRecord): string => {
  const stepOrder = ["pelunasan", "photoSorting", "editing", "printing", "finishing", "delivery"] as const;

  for (const stepId of stepOrder) {
    const step = record.steps[stepId];
    if (step.status === "in_progress") return stepId;
    if (step.status === "waiting") return stepId;
  }
  return "completed";
};

/**
 * Calculate progress percentage
 */
export const getProgressPercentage = (record: ProductionRecord): number => {
  const steps = Object.values(record.steps);
  const completedCount = steps.filter((s) => s.status === "completed").length;
  return Math.round((completedCount / steps.length) * 100);
};