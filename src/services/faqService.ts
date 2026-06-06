/**
 * FAQ Service
 *
 * Mengelola operasi CRUD untuk FAQ content.
 * Menggunakan Supabase sebagai sumber utama dengan localStorage fallback.
 * Default data diambil dari shared defaultFaqs.ts
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";
import { defaultFaqs } from "../app/data/defaultFaqs";

// ============================================================================
// Types
// ============================================================================

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEY = "danivisual_admin_faqs";

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
// FAQ Operations
// ============================================================================

/**
 * Ambil semua FAQs
 * Urutan: Supabase -> localStorage -> defaultFaqs
 */
export const getFaqs = async (): Promise<FAQ[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("faqs")
          .select("*")
          .order("sort_order", { ascending: true });

        if (!error && data && data.length > 0) {
          const faqs = (data || []).map((row) => ({
            id: row.id,
            category: row.category,
            question: row.question,
            answer: row.answer,
            sortOrder: row.sort_order,
            isPublished: row.is_published ?? true,
          }));
          setLocalData(STORAGE_KEY, faqs);
          return faqs;
        }
      } catch (err) {
        console.warn("[FAQService] Supabase error:", err);
      }
    }
  }

  const storedFaqs = getLocalData<FAQ[]>(STORAGE_KEY, []);
  if (storedFaqs && storedFaqs.length > 0) {
    return storedFaqs;
  }

  return defaultFaqs as FAQ[];
};

/**
 * Ambil published FAQs saja
 */
export const getPublishedFaqs = async (): Promise<FAQ[]> => {
  const faqs = await getFaqs();
  return faqs
    .filter((faq) => faq.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Ambil FAQs by category
 */
export const getFaqsByCategory = async (category: string): Promise<FAQ[]> => {
  const faqs = await getFaqs();
  return faqs
    .filter((faq) => faq.category === category && faq.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

/**
 * Ambil semua categories yang ada
 */
export const getFaqCategories = async (): Promise<string[]> => {
  const faqs = await getFaqs();
  const categories = [...new Set(faqs.map((faq) => faq.category))];
  return categories.sort();
};

/**
 * Ambil FAQ by ID
 */
export const getFaqById = async (id: string): Promise<FAQ | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("faqs")
          .select("*")
          .eq("id", id)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            category: data.category,
            question: data.question,
            answer: data.answer,
            sortOrder: data.sort_order,
            isPublished: data.is_published ?? true,
          };
        }
      } catch (err) {
        console.warn("[FAQService] getFaqById error:", err);
      }
    }
  }

  const faqs = await getFaqs();
  return faqs.find((faq) => faq.id === id) || null;
};

/**
 * Buat FAQ baru
 */
export const createFaq = async (
  faqData: Omit<FAQ, "id">
): Promise<FAQ | null> => {
  const allFaqs = await getFaqs();
  const maxSort = Math.max(0, ...allFaqs.map((faq) => faq.sortOrder));

  const newFaq: FAQ = {
    ...faqData,
    id: generateId(),
    sortOrder: faqData.sortOrder || maxSort + 1,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client
          .from("faqs")
          .insert({
            id: newFaq.id,
            category: newFaq.category,
            question: newFaq.question,
            answer: newFaq.answer,
            sort_order: newFaq.sortOrder,
            is_published: newFaq.isPublished,
          })
          .select()
          .single();

        if (!error && data) {
          const created = {
            id: data.id,
            category: data.category,
            question: data.question,
            answer: data.answer,
            sortOrder: data.sort_order,
            isPublished: data.is_published ?? true,
          };
          setLocalData(STORAGE_KEY, [...allFaqs, created]);
          return created;
        }
      } catch (err) {
        console.warn("[FAQService] createFaq error:", err);
      }
    }
  }

  const allNewFaqs = [...allFaqs, newFaq];
  setLocalData(STORAGE_KEY, allNewFaqs);
  return newFaq;
};

/**
 * Update FAQ
 */
export const updateFaq = async (
  id: string,
  updates: Partial<FAQ>
): Promise<FAQ | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const dbUpdates: Record<string, unknown> = {};
        if (updates.category !== undefined) dbUpdates.category = updates.category;
        if (updates.question !== undefined) dbUpdates.question = updates.question;
        if (updates.answer !== undefined) dbUpdates.answer = updates.answer;
        if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
        if (updates.isPublished !== undefined)
          dbUpdates.is_published = updates.isPublished;
        dbUpdates.updated_at = new Date().toISOString();

        const { data, error } = await client
          .from("faqs")
          .update(dbUpdates)
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          const updated = {
            id: data.id,
            category: data.category,
            question: data.question,
            answer: data.answer,
            sortOrder: data.sort_order,
            isPublished: data.is_published ?? true,
          };
          const allFaqs = await getFaqs();
          const newFaqs = allFaqs.map((f) => (f.id === id ? updated : f));
          setLocalData(STORAGE_KEY, newFaqs);
          return updated;
        }
      } catch (err) {
        console.warn("[FAQService] updateFaq error:", err);
      }
    }
  }

  const allFaqs = await getFaqs();
  const updatedFaqs = allFaqs.map((faq) =>
    faq.id === id ? { ...faq, ...updates } : faq
  );
  setLocalData(STORAGE_KEY, updatedFaqs);
  return updatedFaqs.find((faq) => faq.id === id) || null;
};

/**
 * Hapus FAQ
 */
export const deleteFaq = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client
          .from("faqs")
          .delete()
          .eq("id", id);

        if (!error) {
          const allFaqs = await getFaqs();
          setLocalData(
            STORAGE_KEY,
            allFaqs.filter((faq) => faq.id !== id)
          );
          return true;
        }
      } catch (err) {
        console.warn("[FAQService] deleteFaq error:", err);
      }
    }
  }

  const allFaqs = await getFaqs();
  setLocalData(
    STORAGE_KEY,
    allFaqs.filter((faq) => faq.id !== id)
  );
  return true;
};

/**
 * Reorder FAQs
 */
export const reorderFaqs = async (ids: string[]): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        for (let i = 0; i < ids.length; i++) {
          await client
            .from("faqs")
            .update({
              sort_order: i + 1,
              updated_at: new Date().toISOString(),
            })
            .eq("id", ids[i]);
        }
        const allFaqs = await getFaqs();
        const faqMap = new Map(allFaqs.map((f) => [f.id, f]));
        const reordered = ids
          .map((id, index) => {
            const faq = faqMap.get(id);
            return faq ? { ...faq, sortOrder: index + 1 } : null;
          })
          .filter(Boolean) as FAQ[];
        setLocalData(STORAGE_KEY, reordered);
        return true;
      } catch (err) {
        console.warn("[FAQService] reorderFaqs error:", err);
      }
    }
  }

  const allFaqs = await getFaqs();
  const faqMap = new Map(allFaqs.map((f) => [f.id, f]));
  const reordered = ids
    .map((id, index) => {
      const faq = faqMap.get(id);
      return faq ? { ...faq, sortOrder: index + 1 } : null;
    })
    .filter(Boolean) as FAQ[];
  setLocalData(STORAGE_KEY, reordered);
  return true;
};

/**
 * Toggle FAQ published status
 */
export const toggleFaqPublished = async (id: string): Promise<boolean> => {
  const faq = await getFaqById(id);
  if (!faq) return false;
  const result = await updateFaq(id, { isPublished: !faq.isPublished });
  return result !== null;
};

/**
 * Export FAQ data ke JSON
 */
export const exportFaqData = async (): Promise<string> => {
  const faqs = await getFaqs();
  return JSON.stringify(
    {
      schema: "danivisual.faqs.v1",
      exportedAt: new Date().toISOString(),
      faqs,
    },
    null,
    2
  );
};

/**
 * Import FAQ data dari JSON
 */
export const importFaqData = async (payload: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(payload);
    if (!parsed.schema?.includes("danivisual.faqs")) {
      throw new Error("Format tidak valid");
    }
    if (parsed.faqs) {
      setLocalData(STORAGE_KEY, parsed.faqs);
    }
    return true;
  } catch (err) {
    console.error("[FAQService] importFaqData error:", err);
    return false;
  }
};

/**
 * Reset ke default FAQs
 */
export const resetFaqs = async (): Promise<void> => {
  setLocalData(STORAGE_KEY, defaultFaqs);
};
