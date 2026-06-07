/**
 * FAQ Service
 *
 * Mengelola operasi CRUD untuk FAQ content.
 * Menggunakan PHP API sebagai sumber utama dengan localStorage fallback.
 * Default data diambil dari shared defaultFaqs.ts
 */

import { apiClient, getLocalData, setLocalData, FALLBACK_STORAGE_KEYS } from "../lib/apiClient";
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

const STORAGE_KEY = FALLBACK_STORAGE_KEYS.faqs;

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ============================================================================
// FAQ Operations
// ============================================================================

/**
 * Ambil semua FAQs
 * Urutan: PHP API → localStorage → defaultFaqs
 */
export const getFaqs = async (): Promise<FAQ[]> => {
  try {
    const response = await apiClient.getFaqs();
    if (response.success && response.data) {
      // Cache to localStorage for offline
      setLocalData(STORAGE_KEY, response.data);
      return response.data as FAQ[];
    }
  } catch (err) {
    console.warn("[FAQService] API error:", err);
  }

  // Fallback localStorage
  const storedFaqs = getLocalData<FAQ[]>(STORAGE_KEY, []);
  if (storedFaqs && storedFaqs.length > 0) {
    return storedFaqs;
  }

  // Fallback terakhir: defaultFaqs
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
  try {
    const response = await apiClient.getFaqById(id);
    if (response.success && response.data) {
      return response.data as FAQ;
    }
  } catch (err) {
    console.warn("[FAQService] getFaqById error:", err);
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

  try {
    const response = await apiClient.createFaq({
      category: newFaq.category,
      question: newFaq.question,
      answer: newFaq.answer,
      sort_order: newFaq.sortOrder,
      is_published: newFaq.isPublished,
    });

    if (response.success) {
      // Update localStorage cache
      setLocalData(STORAGE_KEY, [...allFaqs, newFaq]);
      return newFaq;
    }
  } catch (err) {
    console.warn("[FAQService] createFaq error:", err);
  }

  // Fallback localStorage
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
  try {
    const response = await apiClient.updateFaq(id, {
      category: updates.category,
      question: updates.question,
      answer: updates.answer,
      sort_order: updates.sortOrder,
      is_published: updates.isPublished,
    });

    if (response.success) {
      // Update localStorage cache
      const allFaqs = await getFaqs();
      const newFaqs = allFaqs.map((f) => (f.id === id ? { ...f, ...updates } : f));
      setLocalData(STORAGE_KEY, newFaqs);
      return newFaqs.find((f) => f.id === id) || null;
    }
  } catch (err) {
    console.warn("[FAQService] updateFaq error:", err);
  }

  // Fallback localStorage
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
  try {
    const response = await apiClient.deleteFaq(id);
    if (response.success) {
      // Update localStorage cache
      const allFaqs = await getFaqs();
      setLocalData(STORAGE_KEY, allFaqs.filter((faq) => faq.id !== id));
      return true;
    }
  } catch (err) {
    console.warn("[FAQService] deleteFaq error:", err);
  }

  // Fallback localStorage
  const allFaqs = await getFaqs();
  setLocalData(
    STORAGE_KEY,
    allFaqs.filter((faq) => faq.id !== id)
  );
  return true;
};

/**
 * Reorder FAQs (update sortOrder berdasarkan array order)
 */
export const reorderFaqs = async (ids: string[]): Promise<boolean> => {
  try {
    for (let i = 0; i < ids.length; i++) {
      await apiClient.updateFaq(ids[i], { sort_order: i + 1 });
    }

    // Update localStorage cache
    const allFaqs = await getFaqs();
    const faqMap = new Map(allFaqs.map((f) => [f.id, f]));
    const reordered = ids.map((id, index) => {
      const faq = faqMap.get(id);
      return faq ? { ...faq, sortOrder: index + 1 } : null;
    }).filter(Boolean) as FAQ[];
    setLocalData(STORAGE_KEY, reordered);
    return true;
  } catch (err) {
    console.warn("[FAQService] reorderFaqs error:", err);
  }

  // Fallback localStorage
  const allFaqs = await getFaqs();
  const faqMap = new Map(allFaqs.map((f) => [f.id, f]));
  const reordered = ids.map((id, index) => {
    const faq = faqMap.get(id);
    return faq ? { ...faq, sortOrder: index + 1 } : null;
  }).filter(Boolean) as FAQ[];
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

// ============================================================================
// Export/Import
// ============================================================================

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
