/**
 * Default Payment Accounts Data
 *
 * Shared payment account data untuk frontend dan admin panel.
 * Dipakai sebagai fallback terakhir jika Supabase dan localStorage kosong/tidak tersedia.
 *
 * Data diambil dari bookingData.ts yang sebelumnya hardcoded.
 */

import type { PaymentAccount } from "../../services/paymentAccountService";

export type { PaymentAccount } from "../../services/paymentAccountService";
export type { PaymentType } from "../../services/paymentAccountService";

// Default payment account from bookingData.ts
export const defaultPaymentAccounts: PaymentAccount[] = [
  {
    id: "acc-bri-default",
    bankName: "BRI",
    accountNumber: "645201020316531",
    accountHolderName: "DANI INDRA FIRMANSYAH",
    branch: undefined,
    paymentType: "all",
    isDefault: true,
    isActive: true,
    sortOrder: 1,
    notes: "Rekening utama untuk terima pembayaran DP dan pelunasan",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Bank options for dropdown
export const bankOptions = [
  { value: "BRI", label: "BRI" },
  { value: "BCA", label: "BCA" },
  { value: "Mandiri", label: "Mandiri" },
  { value: "BNI", label: "BNI" },
  { value: "BTN", label: "BTN" },
  { value: "Permata", label: "Permata" },
  { value: "CIMB Niaga", label: "CIMB Niaga" },
  { value: "SeaBank", label: "SeaBank" },
  { value: "BSI", label: "BSI" },
  { value: " Lainnya", label: "Lainnya" },
] as const;

// Payment type options for dropdown
export const paymentTypeOptions = [
  { value: "all", label: "Semua tipe" },
  { value: "dp", label: "Hanya DP" },
  { value: "final_payment", label: "Hanya Pelunasan" },
] as const;
