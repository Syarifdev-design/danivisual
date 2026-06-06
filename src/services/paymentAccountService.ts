/**
 * Payment Account Service
 *
 * Mengelola operasi CRUD untuk rekening pembayaran.
 * Menggunakan Supabase sebagai sumber utama dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";
import { defaultPaymentAccounts } from "../app/data/paymentAccounts";

// ============================================================================
// Types
// ============================================================================

export type PaymentType = "all" | "dp" | "final_payment";

export interface PaymentAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branch?: string;
  paymentType: PaymentType;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEY = "danivisual_payment_accounts";

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

// Map database row to PaymentAccount interface
const mapRowToPaymentAccount = (row: Record<string, unknown>): PaymentAccount => ({
  id: row.id as string,
  bankName: row.bank_name as string,
  accountNumber: row.account_number as string,
  accountHolderName: row.account_holder_name as string,
  branch: row.branch as string | undefined,
  paymentType: (row.payment_type as PaymentType) || "all",
  isDefault: row.is_default as boolean || false,
  isActive: row.is_active as boolean || true,
  sortOrder: row.sort_order as number || 0,
  notes: row.notes as string | undefined,
  createdAt: row.created_at as string,
  updatedAt: row.updated_at as string,
});

// ============================================================================
// Payment Account Operations
// ============================================================================

/**
 * Ambil semua payment accounts
 * Urutan: Supabase → localStorage → defaultPaymentAccounts
 */
export const getPaymentAccounts = async (): Promise<PaymentAccount[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("payment_accounts")
          .select("*")
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          const accounts = data.map(row => mapRowToPaymentAccount(row));
          // Cache to localStorage
          setLocalData(STORAGE_KEY, accounts);
          return accounts;
        }
      } catch (err) {
        console.warn("[PaymentAccountService] Supabase error:", err);
      }
    }
  }

  // Fallback localStorage
  const storedAccounts = getLocalData<PaymentAccount[]>(STORAGE_KEY, []);
  if (storedAccounts && storedAccounts.length > 0) {
    return storedAccounts;
  }

  // Fallback terakhir: defaultPaymentAccounts
  return defaultPaymentAccounts;
};

/**
 * Ambil semua active payment accounts
 */
export const getActivePaymentAccounts = async (): Promise<PaymentAccount[]> => {
  const accounts = await getPaymentAccounts();
  return accounts.filter(acc => acc.isActive);
};

/**
 * Ambil active accounts berdasarkan payment type
 */
export const getActiveAccountsByType = async (type: PaymentType): Promise<PaymentAccount[]> => {
  const accounts = await getActivePaymentAccounts();
  return accounts.filter(acc =>
    acc.paymentType === type || acc.paymentType === "all"
  );
};

/**
 * Ambil default payment account berdasarkan payment type
 * Jika tidak ada yang sesuai, ambil default pertama
 */
export const getDefaultPaymentAccount = async (type?: PaymentType): Promise<PaymentAccount | null> => {
  const accounts = await getActivePaymentAccounts();

  // Prioritize matching payment type with isDefault
  if (type) {
    const defaultByType = accounts.find(acc => acc.isDefault && (acc.paymentType === type || acc.paymentType === "all"));
    if (defaultByType) return defaultByType;
  }

  // Find any default account
  const anyDefault = accounts.find(acc => acc.isDefault);
  if (anyDefault) return anyDefault;

  // Return first active account
  return accounts[0] || null;
};

/**
 * Ambil payment account by ID
 */
export const getPaymentAccountById = async (id: string): Promise<PaymentAccount | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("payment_accounts")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          return mapRowToPaymentAccount(data);
        }
      } catch (err) {
        console.warn("[PaymentAccountService] getPaymentAccountById error:", err);
      }
    }
  }

  const accounts = await getPaymentAccounts();
  return accounts.find(acc => acc.id === id) || null;
};

/**
 * Buat payment account baru
 */
export const createPaymentAccount = async (
  data: Omit<PaymentAccount, "id" | "createdAt" | "updatedAt">
): Promise<PaymentAccount | null> => {
  const newAccount: PaymentAccount = {
    ...data,
    id: generateId(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data: dbData, error } = await client
          .from("payment_accounts")
          .insert({
            bank_name: newAccount.bankName,
            account_number: newAccount.accountNumber,
            account_holder_name: newAccount.accountHolderName,
            branch: newAccount.branch || null,
            payment_type: newAccount.paymentType,
            is_default: newAccount.isDefault,
            is_active: newAccount.isActive,
            sort_order: newAccount.sortOrder,
            notes: newAccount.notes || null,
          })
          .select()
          .single();

        if (!error && dbData) {
          const created = mapRowToPaymentAccount(dbData);
          // Update localStorage cache
          const allAccounts = await getPaymentAccounts();
          setLocalData(STORAGE_KEY, [...allAccounts, created]);
          return created;
        }
      } catch (err) {
        console.warn("[PaymentAccountService] createPaymentAccount error:", err);
      }
    }
  }

  // Fallback localStorage
  const allAccounts = await getPaymentAccounts();

  // If new account is default, unset other defaults
  if (newAccount.isDefault) {
    const updated = allAccounts.map(acc => ({ ...acc, isDefault: false }));
    setLocalData(STORAGE_KEY, [...updated, newAccount]);
  } else {
    setLocalData(STORAGE_KEY, [...allAccounts, newAccount]);
  }

  return newAccount;
};

/**
 * Update payment account
 */
export const updatePaymentAccount = async (
  id: string,
  updates: Partial<Omit<PaymentAccount, "id" | "createdAt" | "updatedAt">>
): Promise<PaymentAccount | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
        if (updates.accountNumber !== undefined) dbUpdates.account_number = updates.accountNumber;
        if (updates.accountHolderName !== undefined) dbUpdates.account_holder_name = updates.accountHolderName;
        if (updates.branch !== undefined) dbUpdates.branch = updates.branch || null;
        if (updates.paymentType !== undefined) dbUpdates.payment_type = updates.paymentType;
        if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
        if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
        if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
        if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

        const { data: dbData, error } = await client
          .from("payment_accounts")
          .update(dbUpdates)
          .eq("id", id)
          .select()
          .single();

        if (!error && dbData) {
          const updated = mapRowToPaymentAccount(dbData);
          // Update localStorage cache
          const allAccounts = await getPaymentAccounts();
          const newAccounts = allAccounts.map(acc => acc.id === id ? updated : acc);
          setLocalData(STORAGE_KEY, newAccounts);

          // If this account is set as default, ensure others are not default
          if (updated.isDefault) {
            await setDefaultPaymentAccount(id);
          }

          return updated;
        }
      } catch (err) {
        console.warn("[PaymentAccountService] updatePaymentAccount error:", err);
      }
    }
  }

  // Fallback localStorage
  const allAccounts = await getPaymentAccounts();
  const updatedAccounts = allAccounts.map(acc => {
    if (acc.id !== id) return acc;
    return {
      ...acc,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  });

  // If updated account is default, unset others
  if (updates.isDefault) {
    const finalAccounts = updatedAccounts.map(acc => ({
      ...acc,
      isDefault: acc.id === id ? true : false,
    }));
    setLocalData(STORAGE_KEY, finalAccounts);
    return finalAccounts.find(acc => acc.id === id) || null;
  }

  setLocalData(STORAGE_KEY, updatedAccounts);
  return updatedAccounts.find(acc => acc.id === id) || null;
};

/**
 * Hapus payment account
 */
export const deletePaymentAccount = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from("payment_accounts")
          .delete()
          .eq("id", id);

        if (!error) {
          // Update localStorage cache
          const allAccounts = await getPaymentAccounts();
          setLocalData(STORAGE_KEY, allAccounts.filter(acc => acc.id !== id));
          return true;
        }
      } catch (err) {
        console.warn("[PaymentAccountService] deletePaymentAccount error:", err);
      }
    }
  }

  // Fallback localStorage
  const allAccounts = await getPaymentAccounts();
  setLocalData(STORAGE_KEY, allAccounts.filter(acc => acc.id !== id));
  return true;
};

/**
 * Set account sebagai default (unset others)
 */
export const setDefaultPaymentAccount = async (id: string): Promise<PaymentAccount | null> => {
  // Get all accounts
  const allAccounts = await getPaymentAccounts();

  // Find the account to set as default
  const accountToSet = allAccounts.find(acc => acc.id === id);
  if (!accountToSet) return null;

  // Update in Supabase
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        // First, unset all defaults
        await client
          .from("payment_accounts")
          .update({ is_default: false })
          .neq("id", ""); // This won't work well, need to update individually

        // Then set this one as default
        await client
          .from("payment_accounts")
          .update({ is_default: true })
          .eq("id", id);
      } catch (err) {
        console.warn("[PaymentAccountService] setDefaultPaymentAccount error:", err);
      }
    }
  }

  // Update localStorage
  const updatedAccounts = allAccounts.map(acc => ({
    ...acc,
    isDefault: acc.id === id,
  }));
  setLocalData(STORAGE_KEY, updatedAccounts);

  return updatedAccounts.find(acc => acc.id === id) || null;
};

/**
 * Toggle active status of a payment account
 */
export const togglePaymentAccountActive = async (id: string, isActive: boolean): Promise<PaymentAccount | null> => {
  return updatePaymentAccount(id, { isActive });
};

// ============================================================================
// Export/Import
// ============================================================================

/**
 * Export all payment accounts
 */
export const exportPaymentAccountsData = async (): Promise<string> => {
  const accounts = await getPaymentAccounts();

  return JSON.stringify(
    {
      schema: "danivisual.payment_accounts.v1",
      exportedAt: new Date().toISOString(),
      accounts,
    },
    null,
    2
  );
};

/**
 * Import payment accounts from JSON
 */
export const importPaymentAccountsData = async (payload: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(payload);

    if (!parsed.schema?.includes("danivisual.payment_accounts")) {
      throw new Error("Invalid format");
    }

    if (parsed.accounts) {
      setLocalData(STORAGE_KEY, parsed.accounts);
    }
    return true;
  } catch (err) {
    console.error("[PaymentAccountService] importPaymentAccountsData error:", err);
    return false;
  }
};
