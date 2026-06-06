/**
 * Payment Service
 *
 * Mengelola operasi untuk:
 * - Payment verification
 * - Payment history
 * - Payment proof uploads
 *
 * Menggunakan Supabase dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export type PaymentStatus = "pending" | "verified" | "rejected";
export type PaymentMethod = "transfer" | "cash" | "other";
export type PaymentType = "dp" | "final_payment";

export interface Payment {
  id: string;
  bookingId: string;
  bookingOrderNumber: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  type: PaymentType;
  proofImage: string;
  notes: string;
  verifiedBy: string;
  verifiedAt: string;
  createdAt: string;
}

export interface PaymentVerification {
  paymentId: string;
  status: PaymentStatus;
  verifiedBy: string;
  verifiedAt: string;
  notes?: string;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEY = "danivisual_admin_payments";

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
      console.error("[PaymentService] getPayments error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      bookingId: row.booking_id,
      bookingOrderNumber: row.booking_order_number,
      customerName: row.customer_name,
      amount: row.amount,
      method: row.method as PaymentMethod,
      status: row.status as PaymentStatus,
      type: (row.payment_type || "dp") as PaymentType,
      proofImage: row.proof_image_url || row.proof_image || "",
      notes: row.notes || "",
      verifiedBy: row.verified_by || "",
      verifiedAt: row.verified_at || "",
      createdAt: row.created_at,
    }));
  }

  return getLocalData<Payment[]>(STORAGE_KEY, []);
};

/**
 * Ambil payments by booking ID
 */
export const getPaymentsByBookingId = async (bookingId: string): Promise<Payment[]> => {
  const payments = await getPayments();
  return payments.filter((p) => p.bookingId === bookingId);
};

/**
 * Ambil payments by order number
 */
export const getPaymentsByOrderNumber = async (orderNumber: string): Promise<Payment[]> => {
  const payments = await getPayments();
  return payments.filter((p) => p.bookingOrderNumber === orderNumber);
};

/**
 * Ambil pending payments (yang perlu diverifikasi)
 */
export const getPendingPayments = async (): Promise<Payment[]> => {
  const payments = await getPayments();
  return payments.filter((p) => p.status === "pending");
};

/**
 * Ambil payment by ID
 */
export const getPaymentById = async (id: string): Promise<Payment | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("payments")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      bookingId: data.booking_id,
      bookingOrderNumber: data.booking_order_number,
      customerName: data.customer_name,
      amount: data.amount,
      method: data.method as PaymentMethod,
      status: data.status as PaymentStatus,
      type: (data.payment_type || "dp") as PaymentType,
      proofImage: data.proof_image_url || data.proof_image || "",
      notes: data.notes || "",
      verifiedBy: data.verified_by || "",
      verifiedAt: data.verified_at || "",
      createdAt: data.created_at,
    };
  }

  const payments = getLocalData<Payment[]>(STORAGE_KEY, []);
  return payments.find((p) => p.id === id) || null;
};

/**
 * Buat payment baru (biasanya dari client upload)
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
      console.error("[PaymentService] createPayment error:", error);
      return null;
    }

    return {
      id: data.id,
      bookingId: data.booking_id,
      bookingOrderNumber: data.booking_order_number,
      customerName: data.customer_name,
      amount: data.amount,
      method: data.method as PaymentMethod,
      status: data.status as PaymentStatus,
      type: (data.payment_type || "dp") as PaymentType,
      proofImage: data.proof_image_url || data.proof_image || "",
      notes: data.notes || "",
      verifiedBy: data.verified_by || "",
      verifiedAt: data.verified_at || "",
      createdAt: data.created_at,
    };
  }

  // Fallback
  const payments = getLocalData<Payment[]>(STORAGE_KEY, []);
  payments.unshift(newPayment);
  setLocalData(STORAGE_KEY, payments);
  return newPayment;
};

// ============================================================================
// Payment Verification
// ============================================================================

/**
 * Verifikasi payment (accept)
 */
export const verifyPayment = async (
  paymentId: string,
  verifiedBy: string,
  notes?: string
): Promise<boolean> => {
  return updatePaymentStatus(paymentId, "verified", verifiedBy, notes);
};

/**
 * Tolak payment
 */
export const rejectPayment = async (
  paymentId: string,
  verifiedBy: string,
  notes?: string
): Promise<boolean> => {
  return updatePaymentStatus(paymentId, "rejected", verifiedBy, notes);
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  paymentId: string,
  status: PaymentStatus,
  verifiedBy?: string,
  notes?: string
): Promise<boolean> => {
  const timestamp = new Date().toISOString();

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const updates: Record<string, string> = { status };
    if (verifiedBy) updates.verified_by = verifiedBy;
    if (notes) updates.notes = notes;

    if (status === "verified" || status === "rejected") {
      updates.verified_at = timestamp;
    }

    const { error } = await client
      .from("payments")
      .update(updates)
      .eq("id", paymentId);

    if (error) {
      console.error("[PaymentService] updatePaymentStatus error:", error);
      return false;
    }

    // If verified, also update booking paid amount
    if (status === "verified" && verifiedBy) {
      const payment = await getPaymentById(paymentId);
      if (payment) {
        await client.rpc("add_booking_payment", {
          p_order_number: payment.bookingOrderNumber,
          p_amount: payment.amount,
        }).catch(() => {
          // RPC might not exist, ignore
        });
      }
    }

    return true;
  }

  // Fallback
  const payments = getLocalData<Payment[]>(STORAGE_KEY, []);
  const updatedPayments = payments.map((p) =>
    p.id === paymentId
      ? {
          ...p,
          status,
          verifiedBy: verifiedBy || p.verifiedBy,
          verifiedAt: (status === "verified" || status === "rejected") ? timestamp : p.verifiedAt,
          notes: notes !== undefined ? notes : p.notes,
        }
      : p
  );
  setLocalData(STORAGE_KEY, updatedPayments);
  return true;
};

// ============================================================================
// Payment Proof Upload
// ============================================================================

/**
 * Upload bukti pembayaran
 */
export const uploadPaymentProof = async (
  orderNumber: string,
  customerName: string,
  amount: number,
  file: File,
  type: PaymentType = "dp"
): Promise<{ success: boolean; payment?: Payment; error?: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      let proofUrl = base64;

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

              proofUrl = data.publicUrl;
            }
          } catch (err) {
            console.error("[PaymentService] upload payment proof error:", err);
          }
        }
      }

      // Create payment record
      const payment = await createPayment({
        bookingId: "",
        bookingOrderNumber: orderNumber,
        customerName,
        amount,
        method: "transfer",
        status: "pending",
        type,
        proofImage: proofUrl,
        notes: "",
        verifiedBy: "",
        verifiedAt: "",
      });

      if (payment) {
        resolve({ success: true, payment });
      } else {
        resolve({ success: false, error: "Failed to create payment record" });
      }
    };

    reader.onerror = () => resolve({ success: false, error: "Failed to read file" });
    reader.readAsDataURL(file);
  });
};

// ============================================================================
// Payment Summary
// ============================================================================

/**
 * Hitung total payment untuk booking
 */
export const calculateTotalPaid = async (orderNumber: string): Promise<number> => {
  const payments = await getPaymentsByOrderNumber(orderNumber);
  return payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);
};

/**
 * Check apakah booking sudah lunas
 */
export const isBookingPaidOff = async (
  orderNumber: string,
  totalAmount: number
): Promise<boolean> => {
  const totalPaid = await calculateTotalPaid(orderNumber);
  return totalPaid >= totalAmount;
};

/**
 * Ambil payment statistics
 */
export const getPaymentStats = async (): Promise<{
  totalPayments: number;
  pendingPayments: number;
  verifiedPayments: number;
  rejectedPayments: number;
  totalAmount: number;
  pendingAmount: number;
  verifiedAmount: number;
}> => {
  const payments = await getPayments();

  return {
    totalPayments: payments.length,
    pendingPayments: payments.filter((p) => p.status === "pending").length,
    verifiedPayments: payments.filter((p) => p.status === "verified").length,
    rejectedPayments: payments.filter((p) => p.status === "rejected").length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    pendingAmount: payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0),
    verifiedAmount: payments.filter((p) => p.status === "verified").reduce((sum, p) => sum + p.amount, 0),
  };
};

// ============================================================================
// Export
// ============================================================================

/**
 * Export payment data ke JSON
 */
export const exportPaymentData = async (): Promise<string> => {
  const payments = await getPayments();

  return JSON.stringify(
    {
      schema: "danivisual.payments.v1",
      exportedAt: new Date().toISOString(),
      payments,
    },
    null,
    2
  );
};
