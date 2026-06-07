/**
 * Payment Service
 *
 * Mengelola operasi untuk:
 * - Payment verification
 * - Payment history
 * - Payment proof uploads
 *
 * Menggunakan PHP API sebagai sumber utama dengan localStorage fallback.
 */

import { apiClient, getLocalData, setLocalData, FALLBACK_STORAGE_KEYS, generateId } from "../lib/apiClient";

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

const STORAGE_KEY = FALLBACK_STORAGE_KEYS.payments;

// ============================================================================
// Payment Operations
// ============================================================================

/**
 * Ambil semua payments
 */
export const getPayments = async (): Promise<Payment[]> => {
  try {
    const response = await apiClient.getPayments();
    if (response.success && response.data) {
      setLocalData(STORAGE_KEY, response.data);
      return response.data as Payment[];
    }
  } catch (err) {
    console.warn("[PaymentService] getPayments error:", err);
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
  try {
    const response = await apiClient.getPayments({ order_number: orderNumber });
    if (response.success && response.data) {
      return response.data as Payment[];
    }
  } catch (err) {
    console.warn("[PaymentService] getPaymentsByOrderNumber error:", err);
  }

  const payments = await getPayments();
  return payments.filter((p) => p.bookingOrderNumber === orderNumber);
};

/**
 * Ambil pending payments (yang perlu diverifikasi)
 */
export const getPendingPayments = async (): Promise<Payment[]> => {
  try {
    const response = await apiClient.getPayments({ status: "pending" });
    if (response.success && response.data) {
      return response.data as Payment[];
    }
  } catch (err) {
    console.warn("[PaymentService] getPendingPayments error:", err);
  }

  const payments = await getPayments();
  return payments.filter((p) => p.status === "pending");
};

/**
 * Ambil payment by ID
 */
export const getPaymentById = async (id: string): Promise<Payment | null> => {
  try {
    const response = await apiClient.getPaymentById(id);
    if (response.success && response.data) {
      return response.data as Payment;
    }
  } catch (err) {
    console.warn("[PaymentService] getPaymentById error:", err);
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

  try {
    const response = await apiClient.createPayment({
      booking_id: newPayment.bookingId,
      booking_order_number: newPayment.bookingOrderNumber,
      customer_name: newPayment.customerName,
      amount: newPayment.amount,
      method: newPayment.method,
      payment_type: newPayment.type,
      proof_image: newPayment.proofImage,
      notes: newPayment.notes,
    });

    if (response.success) {
      const payments = getLocalData<Payment[]>(STORAGE_KEY, []);
      payments.unshift(newPayment);
      setLocalData(STORAGE_KEY, payments);
      return newPayment;
    }
  } catch (err) {
    console.warn("[PaymentService] createPayment error:", err);
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
  try {
    const response = await apiClient.verifyPayment(paymentId, notes);
    if (response.success) {
      // Update local cache
      const payments = getLocalData<Payment[]>(STORAGE_KEY, []);
      const updatedPayments = payments.map((p) =>
        p.id === paymentId
          ? { ...p, status: "verified" as PaymentStatus, verifiedBy, verifiedAt: new Date().toISOString() }
          : p
      );
      setLocalData(STORAGE_KEY, updatedPayments);
      return true;
    }
  } catch (err) {
    console.warn("[PaymentService] verifyPayment error:", err);
  }

  return false;
};

/**
 * Tolak payment
 */
export const rejectPayment = async (
  paymentId: string,
  verifiedBy: string,
  notes?: string
): Promise<boolean> => {
  try {
    const response = await apiClient.rejectPayment(paymentId, notes);
    if (response.success) {
      // Update local cache
      const payments = getLocalData<Payment[]>(STORAGE_KEY, []);
      const updatedPayments = payments.map((p) =>
        p.id === paymentId
          ? { ...p, status: "rejected" as PaymentStatus, verifiedBy, verifiedAt: new Date().toISOString(), notes: notes || p.notes }
          : p
      );
      setLocalData(STORAGE_KEY, updatedPayments);
      return true;
    }
  } catch (err) {
    console.warn("[PaymentService] rejectPayment error:", err);
  }

  return false;
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
  if (status === "verified") {
    return verifyPayment(paymentId, verifiedBy || "", notes);
  } else if (status === "rejected") {
    return rejectPayment(paymentId, verifiedBy || "", notes);
  }

  return false;
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
