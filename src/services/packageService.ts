/**
 * Package Service
 *
 * Mengelola operasi CRUD untuk:
 * - Package Categories
 * - Packages
 * - Add-ons
 *
 * Menggunakan Supabase dengan localStorage fallback.
 */

import { getSupabaseClient, isSupabaseConfigured } from "../lib/supabaseClient";

// ============================================================================
// Types
// ============================================================================

export interface PackageCategory {
  id: string;
  name: string;
  eyebrow: string;
  note?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface Package {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  serviceType?: "Photo" | "Video" | "Photo + Video";
  isMostSelected: boolean;
  startingPrice: number;
  price: number;
  description: string;
  benefits: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface Addon {
  id: string;
  categoryIds: string[];
  name: string;
  description: string;
  price: number;
  displayPrice: string;
  unit?: string;
  hasQuantity: boolean;
  isActive: boolean;
}

// ============================================================================
// LocalStorage Keys
// ============================================================================

const STORAGE_KEYS = {
  packages: "danivisual_admin_packages",
  categories: "danivisual_admin_categories",
  addons: "danivisual_admin_addons",
};

// ============================================================================
// Default Data
// ============================================================================

const defaultCategories: PackageCategory[] = [
  { id: "wedding", name: "Wedding", eyebrow: "Dokumentasi Pernikahan", isActive: true, sortOrder: 1 },
  { id: "ngunduh-mantu", name: "Ngunduh Mantu", eyebrow: "Adat Jawa", isActive: true, sortOrder: 2 },
  { id: "prewedding-outdoor", name: "Prewedding Outdoor", eyebrow: "Sesi di Lokasi", isActive: true, sortOrder: 3 },
  { id: "prewedding-studio", name: "Prewedding Studio", eyebrow: "Studio", isActive: true, sortOrder: 4 },
  { id: "engagement", name: "Engagement", eyebrow: "Lamaran", isActive: true, sortOrder: 5 },
  { id: "photo-studio", name: "Photo Studio", eyebrow: "Studio", isActive: true, sortOrder: 6 },
];

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
// Category Operations
// ============================================================================

/**
 * Ambil semua categories
 */
export const getCategories = async (): Promise<PackageCategory[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("package_categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[PackageService] getCategories error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      eyebrow: row.eyebrow,
      note: row.note,
      isActive: row.is_active,
      sortOrder: row.sort_order,
    }));
  }

  return getLocalData<PackageCategory[]>(STORAGE_KEYS.categories, defaultCategories);
};

/**
 * Ambil category by ID
 */
export const getCategoryById = async (id: string): Promise<PackageCategory | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("package_categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      name: data.name,
      eyebrow: data.eyebrow,
      note: data.note,
      isActive: data.is_active,
      sortOrder: data.sort_order,
    };
  }

  const categories = getLocalData<PackageCategory[]>(STORAGE_KEYS.categories, defaultCategories);
  return categories.find((c) => c.id === id) || null;
};

/**
 * Buat category baru
 */
export const createCategory = async (
  categoryData: Omit<PackageCategory, "id" | "sortOrder">
): Promise<PackageCategory | null> => {
  const categories = await getCategories();
  const maxSort = Math.max(0, ...categories.map((c) => c.sortOrder));

  const newCategory: PackageCategory = {
    ...categoryData,
    id: generateId(),
    sortOrder: maxSort + 1,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("package_categories")
      .insert({
        id: newCategory.id,
        name: newCategory.name,
        eyebrow: newCategory.eyebrow,
        note: newCategory.note,
        is_active: newCategory.isActive,
        sort_order: newCategory.sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("[PackageService] createCategory error:", error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      eyebrow: data.eyebrow,
      note: data.note,
      isActive: data.is_active,
      sortOrder: data.sort_order,
    };
  }

  // Fallback
  categories.push(newCategory);
  setLocalData(STORAGE_KEYS.categories, categories);
  return newCategory;
};

/**
 * Update category
 */
export const updateCategory = async (
  id: string,
  updates: Partial<PackageCategory>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.eyebrow !== undefined) dbUpdates.eyebrow = updates.eyebrow;
    if (updates.note !== undefined) dbUpdates.note = updates.note;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

    const { error } = await client
      .from("package_categories")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("[PackageService] updateCategory error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const categories = getLocalData<PackageCategory[]>(STORAGE_KEYS.categories, defaultCategories);
  const updatedCategories = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
  setLocalData(STORAGE_KEYS.categories, updatedCategories);
  return true;
};

/**
 * Hapus category
 */
export const deleteCategory = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("package_categories").delete().eq("id", id);

    if (error) {
      console.error("[PackageService] deleteCategory error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const categories = getLocalData<PackageCategory[]>(STORAGE_KEYS.categories, defaultCategories);
  setLocalData(
    STORAGE_KEYS.categories,
    categories.filter((c) => c.id !== id)
  );
  return true;
};

// ============================================================================
// Package Operations
// ============================================================================

/**
 * Ambil semua packages
 */
export const getPackages = async (): Promise<Package[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("packages")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[PackageService] getPackages error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      name: row.name,
      serviceType: row.service_type,
      isMostSelected: row.is_most_selected,
      startingPrice: row.starting_price,
      price: row.price,
      description: row.description,
      benefits: row.benefits || [],
      isActive: row.is_active,
      sortOrder: row.sort_order,
    }));
  }

  return getLocalData<Package[]>(STORAGE_KEYS.packages, []);
};

/**
 * Ambil packages by category ID
 */
export const getPackagesByCategory = async (categoryId: string): Promise<Package[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("packages")
      .select("*")
      .eq("category_id", categoryId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("[PackageService] getPackagesByCategory error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      categoryName: row.category_name,
      name: row.name,
      serviceType: row.service_type,
      isMostSelected: row.is_most_selected,
      startingPrice: row.starting_price,
      price: row.price,
      description: row.description,
      benefits: row.benefits || [],
      isActive: row.is_active,
      sortOrder: row.sort_order,
    }));
  }

  const packages = getLocalData<Package[]>(STORAGE_KEYS.packages, []);
  return packages.filter((p) => p.categoryId === categoryId);
};

/**
 * Ambil package by ID
 */
export const getPackageById = async (id: string): Promise<Package | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("packages")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      categoryId: data.category_id,
      categoryName: data.category_name,
      name: data.name,
      serviceType: data.service_type,
      isMostSelected: data.is_most_selected,
      startingPrice: data.starting_price,
      price: data.price,
      description: data.description,
      benefits: data.benefits || [],
      isActive: data.is_active,
      sortOrder: data.sort_order,
    };
  }

  const packages = getLocalData<Package[]>(STORAGE_KEYS.packages, []);
  return packages.find((p) => p.id === id) || null;
};

/**
 * Buat package baru
 */
export const createPackage = async (
  packageData: Omit<Package, "id" | "sortOrder">
): Promise<Package | null> => {
  const packages = await getPackages();
  const maxSort = Math.max(0, ...packages.map((p) => p.sortOrder));

  const newPackage: Package = {
    ...packageData,
    id: generateId(),
    sortOrder: maxSort + 1,
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("packages")
      .insert({
        id: newPackage.id,
        category_id: newPackage.categoryId,
        category_name: newPackage.categoryName,
        name: newPackage.name,
        service_type: newPackage.serviceType,
        is_most_selected: newPackage.isMostSelected,
        starting_price: newPackage.startingPrice,
        price: newPackage.price,
        description: newPackage.description,
        benefits: newPackage.benefits,
        is_active: newPackage.isActive,
        sort_order: newPackage.sortOrder,
      })
      .select()
      .single();

    if (error) {
      console.error("[PackageService] createPackage error:", error);
      return null;
    }

    return {
      id: data.id,
      categoryId: data.category_id,
      categoryName: data.category_name,
      name: data.name,
      serviceType: data.service_type,
      isMostSelected: data.is_most_selected,
      startingPrice: data.starting_price,
      price: data.price,
      description: data.description,
      benefits: data.benefits || [],
      isActive: data.is_active,
      sortOrder: data.sort_order,
    };
  }

  // Fallback
  packages.push(newPackage);
  setLocalData(STORAGE_KEYS.packages, packages);
  return newPackage;
};

/**
 * Update package
 */
export const updatePackage = async (
  id: string,
  updates: Partial<Package>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
    if (updates.categoryName !== undefined) dbUpdates.category_name = updates.categoryName;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.serviceType !== undefined) dbUpdates.service_type = updates.serviceType;
    if (updates.isMostSelected !== undefined) dbUpdates.is_most_selected = updates.isMostSelected;
    if (updates.startingPrice !== undefined) dbUpdates.starting_price = updates.startingPrice;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.benefits !== undefined) dbUpdates.benefits = updates.benefits;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

    const { error } = await client.from("packages").update(dbUpdates).eq("id", id);

    if (error) {
      console.error("[PackageService] updatePackage error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const packages = getLocalData<Package[]>(STORAGE_KEYS.packages, []);
  const updatedPackages = packages.map((p) => (p.id === id ? { ...p, ...updates } : p));
  setLocalData(STORAGE_KEYS.packages, updatedPackages);
  return true;
};

/**
 * Hapus package
 */
export const deletePackage = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("packages").delete().eq("id", id);

    if (error) {
      console.error("[PackageService] deletePackage error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const packages = getLocalData<Package[]>(STORAGE_KEYS.packages, []);
  setLocalData(
    STORAGE_KEYS.packages,
    packages.filter((p) => p.id !== id)
  );
  return true;
};

// ============================================================================
// Addon Operations
// ============================================================================

/**
 * Ambil semua addons
 */
export const getAddons = async (): Promise<Addon[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return [];

    const { data, error } = await client
      .from("addons")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("[PackageService] getAddons error:", error);
      return [];
    }

    return (data || []).map((row) => ({
      id: row.id,
      categoryIds: row.category_ids || [],
      name: row.name,
      description: row.description || "",
      price: row.price,
      displayPrice: row.display_price,
      unit: row.unit,
      hasQuantity: row.has_quantity,
      isActive: row.is_active,
    }));
  }

  return getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
};

/**
 * Ambil addons by category ID
 */
export const getAddonsByCategory = async (categoryId: string): Promise<Addon[]> => {
  const addons = await getAddons();
  return addons.filter((a) => a.categoryIds.includes(categoryId));
};

/**
 * Ambil addon by ID
 */
export const getAddonById = async (id: string): Promise<Addon | null> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("addons")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      categoryIds: data.category_ids || [],
      name: data.name,
      description: data.description || "",
      price: data.price,
      displayPrice: data.display_price,
      unit: data.unit,
      hasQuantity: data.has_quantity,
      isActive: data.is_active,
    };
  }

  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  return addons.find((a) => a.id === id) || null;
};

/**
 * Buat addon baru
 */
export const createAddon = async (
  addonData: Omit<Addon, "id">
): Promise<Addon | null> => {
  const newAddon: Addon = {
    ...addonData,
    id: generateId(),
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return null;

    const { data, error } = await client
      .from("addons")
      .insert({
        id: newAddon.id,
        category_ids: newAddon.categoryIds,
        name: newAddon.name,
        description: newAddon.description,
        price: newAddon.price,
        display_price: newAddon.displayPrice,
        unit: newAddon.unit,
        has_quantity: newAddon.hasQuantity,
        is_active: newAddon.isActive,
      })
      .select()
      .single();

    if (error) {
      console.error("[PackageService] createAddon error:", error);
      return null;
    }

    return {
      id: data.id,
      categoryIds: data.category_ids || [],
      name: data.name,
      description: data.description || "",
      price: data.price,
      displayPrice: data.display_price,
      unit: data.unit,
      hasQuantity: data.has_quantity,
      isActive: data.is_active,
    };
  }

  // Fallback
  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  addons.push(newAddon);
  setLocalData(STORAGE_KEYS.addons, addons);
  return newAddon;
};

/**
 * Update addon
 */
export const updateAddon = async (
  id: string,
  updates: Partial<Addon>
): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.categoryIds !== undefined) dbUpdates.category_ids = updates.categoryIds;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.displayPrice !== undefined) dbUpdates.display_price = updates.displayPrice;
    if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
    if (updates.hasQuantity !== undefined) dbUpdates.has_quantity = updates.hasQuantity;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { error } = await client.from("addons").update(dbUpdates).eq("id", id);

    if (error) {
      console.error("[PackageService] updateAddon error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  const updatedAddons = addons.map((a) => (a.id === id ? { ...a, ...updates } : a));
  setLocalData(STORAGE_KEYS.addons, updatedAddons);
  return true;
};

/**
 * Hapus addon
 */
export const deleteAddon = async (id: string): Promise<boolean> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (!client) return false;

    const { error } = await client.from("addons").delete().eq("id", id);

    if (error) {
      console.error("[PackageService] deleteAddon error:", error);
      return false;
    }

    return true;
  }

  // Fallback
  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  setLocalData(
    STORAGE_KEYS.addons,
    addons.filter((a) => a.id !== id)
  );
  return true;
};

// ============================================================================
// Bulk Operations
// ============================================================================

/**
 * Import default data (untuk setup awal)
 */
export const importDefaultPackageData = async (): Promise<void> => {
  // Categories
  setLocalData(STORAGE_KEYS.categories, defaultCategories);

  // Addons - kosong (admin harus input manual)
  setLocalData(STORAGE_KEYS.addons, []);
};

/**
 * Export semua data paket ke JSON
 */
export const exportPackageData = async (): Promise<string> => {
  const categories = await getCategories();
  const packages = await getPackages();
  const addons = await getAddons();

  return JSON.stringify(
    {
      schema: "danivisual.packages.v1",
      exportedAt: new Date().toISOString(),
      categories,
      packages,
      addons,
    },
    null,
    2
  );
};

/**
 * Import data paket dari JSON
 */
export const importPackageData = async (payload: string): Promise<boolean> => {
  try {
    const parsed = JSON.parse(payload);

    if (!parsed.schema?.includes("danivisual.packages")) {
      throw new Error("Format tidak valid");
    }

    if (parsed.categories) setLocalData(STORAGE_KEYS.categories, parsed.categories);
    if (parsed.packages) setLocalData(STORAGE_KEYS.packages, parsed.packages);
    if (parsed.addons) setLocalData(STORAGE_KEYS.addons, parsed.addons);

    return true;
  } catch (err) {
    console.error("[PackageService] importPackageData error:", err);
    return false;
  }
};