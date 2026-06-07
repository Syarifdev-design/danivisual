/**
 * Package Service
 *
 * Mengelola operasi CRUD untuk:
 * - Package Categories
 * - Packages
 * - Add-ons
 *
 * Sumber utama: PHP API
 * Fallback: localStorage (untuk development offline)
 */

import { apiClient, getLocalData, setLocalData } from "../lib/apiClient";

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

// ============================================================================
// Category Operations (via PHP API)
// ============================================================================

export const getCategories = async (): Promise<PackageCategory[]> => {
  try {
    const response = await apiClient.get('/packages');
    if (response.success && response.data) {
      // Extract unique categories from packages
      const categoriesMap = new Map<string, PackageCategory>();
      const rawData = response.data as Array<Record<string, unknown>>;
      for (const pkg of rawData) {
        const catId = pkg.category_id as string;
        if (!categoriesMap.has(catId)) {
          categoriesMap.set(catId, {
            id: catId,
            name: (pkg.category_name as string) || catId,
            eyebrow: '',
            isActive: true,
            sortOrder: categoriesMap.size + 1,
          });
        }
      }
      const categories = Array.from(categoriesMap.values());
      if (categories.length > 0) {
        setLocalData(STORAGE_KEYS.categories, categories);
        return categories;
      }
    }
  } catch (err) {
    console.warn("[PackageService] getCategories API error:", err);
  }

  return getLocalData<PackageCategory[]>(STORAGE_KEYS.categories, defaultCategories);
};

export const getCategoryById = async (id: string): Promise<PackageCategory | null> => {
  const categories = await getCategories();
  return categories.find((c) => c.id === id) || null;
};

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

  // Save to localStorage (API doesn't have separate category endpoint)
  categories.push(newCategory);
  setLocalData(STORAGE_KEYS.categories, categories);
  return newCategory;
};

export const updateCategory = async (
  id: string,
  updates: Partial<PackageCategory>
): Promise<boolean> => {
  const categories = await getCategories();
  const updatedCategories = categories.map((c) => (c.id === id ? { ...c, ...updates } : c));
  setLocalData(STORAGE_KEYS.categories, updatedCategories);
  return true;
};

export const deleteCategory = async (id: string): Promise<boolean> => {
  const categories = await getCategories();
  setLocalData(STORAGE_KEYS.categories, categories.filter((c) => c.id !== id));
  return true;
};

// ============================================================================
// Package Operations (via PHP API)
// ============================================================================

export const getPackages = async (): Promise<Package[]> => {
  try {
    const response = await apiClient.getPackages();
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      const packages: Package[] = (rawData as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        categoryId: row.category_id as string,
        categoryName: (row.category_name as string) || '',
        name: row.name as string,
        serviceType: (row.service_type as "Photo" | "Video" | "Photo + Video") || 'Photo',
        isMostSelected: Boolean(row.is_most_selected),
        startingPrice: Number(row.starting_price) || 0,
        price: Number(row.price) || 0,
        description: (row.description as string) || '',
        benefits: [],
        isActive: Boolean(row.is_active ?? row.isActive ?? true),
        sortOrder: Number(row.sort_order || 0),
      }));
      setLocalData(STORAGE_KEYS.packages, packages);
      return packages;
    }
  } catch (err) {
    console.warn("[PackageService] getPackages API error:", err);
  }

  return getLocalData<Package[]>(STORAGE_KEYS.packages, []);
};

export const getPackagesByCategory = async (categoryId: string): Promise<Package[]> => {
  const packages = await getPackages();
  return packages.filter((p) => p.categoryId === categoryId);
};

export const getPackageById = async (id: string): Promise<Package | null> => {
  try {
    const response = await apiClient.getPackageById(id);
    if (response.success && response.data) {
      const row = response.data as Record<string, unknown>;
      return {
        id: row.id as string,
        categoryId: row.category_id as string,
        categoryName: (row.category_name as string) || '',
        name: row.name as string,
        serviceType: (row.service_type as "Photo" | "Video" | "Photo + Video") || 'Photo',
        isMostSelected: Boolean(row.is_most_selected),
        startingPrice: Number(row.starting_price) || 0,
        price: Number(row.price) || 0,
        description: (row.description as string) || '',
        benefits: [],
        isActive: Boolean(row.is_active ?? true),
        sortOrder: Number(row.sort_order || 0),
      };
    }
  } catch (err) {
    console.warn("[PackageService] getPackageById error:", err);
  }

  const packages = getLocalData<Package[]>(STORAGE_KEYS.packages, []);
  return packages.find((p) => p.id === id) || null;
};

export const createPackage = async (
  packageData: Omit<Package, "id" | "sortOrder">
): Promise<Package | null> => {
  try {
    const response = await apiClient.createPackage({
      category_id: packageData.categoryId,
      package_id: packageData.name.toLowerCase().replace(/\s+/g, '-'),
      name: packageData.name,
      service_type: packageData.serviceType || 'Photo',
      is_most_selected: packageData.isMostSelected ? 1 : 0,
      starting_price: packageData.startingPrice,
      price: packageData.price,
      description: packageData.description,
      is_active: packageData.isActive ? 1 : 0,
    });

    if (response.success && response.data) {
      const id = (response.data as { id?: string }).id || generateId();
      const packages = await getPackages();
      const newPkg: Package = { ...packageData, id, sortOrder: packages.length + 1 };
      return newPkg;
    }
  } catch (err) {
    console.warn("[PackageService] createPackage API error:", err);
  }

  // Fallback
  const packages = await getPackages();
  const newPkg: Package = {
    ...packageData,
    id: generateId(),
    sortOrder: packages.length + 1,
  };
  packages.push(newPkg);
  setLocalData(STORAGE_KEYS.packages, packages);
  return newPkg;
};

export const updatePackage = async (
  id: string,
  updates: Partial<Package>
): Promise<boolean> => {
  try {
    const response = await apiClient.updatePackage(id, {
      name: updates.name,
      service_type: updates.serviceType,
      is_most_selected: updates.isMostSelected ? 1 : 0,
      starting_price: updates.startingPrice,
      price: updates.price,
      description: updates.description,
      is_active: updates.isActive ? 1 : 0,
    });

    if (response.success) return true;
  } catch (err) {
    console.warn("[PackageService] updatePackage API error:", err);
  }

  // Fallback
  const packages = getLocalData<Package[]>(STORAGE_KEYS.packages, []);
  const updatedPackages = packages.map((p) => (p.id === id ? { ...p, ...updates } : p));
  setLocalData(STORAGE_KEYS.packages, updatedPackages);
  return true;
};

export const deletePackage = async (id: string): Promise<boolean> => {
  try {
    const response = await apiClient.delete(`/packages/${id}`);
    if (response.success) return true;
  } catch (err) {
    console.warn("[PackageService] deletePackage API error:", err);
  }

  const packages = getLocalData<Package[]>(STORAGE_KEYS.packages, []);
  setLocalData(STORAGE_KEYS.packages, packages.filter((p) => p.id !== id));
  return true;
};

// ============================================================================
// Addon Operations (via PHP API)
// ============================================================================

export const getAddons = async (): Promise<Addon[]> => {
  try {
    const response = await apiClient.getServices();
    if (response.success && response.data) {
      const rawData = Array.isArray(response.data) ? response.data : [];
      const addons: Addon[] = (rawData as Array<Record<string, unknown>>).map((row) => ({
        id: row.id as string,
        categoryIds: [],
        name: row.name as string,
        description: (row.description as string) || '',
        price: 0,
        displayPrice: '',
        unit: row.duration as string | undefined,
        hasQuantity: false,
        isActive: Boolean(row.is_active ?? true),
      }));
      setLocalData(STORAGE_KEYS.addons, addons);
      return addons;
    }
  } catch (err) {
    console.warn("[PackageService] getAddons API error:", err);
  }

  return getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
};

export const getAddonsByCategory = async (categoryId: string): Promise<Addon[]> => {
  const addons = await getAddons();
  return addons.filter((a) => a.categoryIds.includes(categoryId));
};

export const getAddonById = async (id: string): Promise<Addon | null> => {
  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  return addons.find((a) => a.id === id) || null;
};

export const createAddon = async (
  addonData: Omit<Addon, "id">
): Promise<Addon | null> => {
  const newAddon: Addon = { ...addonData, id: generateId() };
  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  addons.push(newAddon);
  setLocalData(STORAGE_KEYS.addons, addons);
  return newAddon;
};

export const updateAddon = async (
  id: string,
  updates: Partial<Addon>
): Promise<boolean> => {
  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  const updatedAddons = addons.map((a) => (a.id === id ? { ...a, ...updates } : a));
  setLocalData(STORAGE_KEYS.addons, updatedAddons);
  return true;
};

export const deleteAddon = async (id: string): Promise<boolean> => {
  const addons = getLocalData<Addon[]>(STORAGE_KEYS.addons, []);
  setLocalData(STORAGE_KEYS.addons, addons.filter((a) => a.id !== id));
  return true;
};

// ============================================================================
// Bulk Operations
// ============================================================================

export const importDefaultPackageData = async (): Promise<void> => {
  setLocalData(STORAGE_KEYS.categories, defaultCategories);
  setLocalData(STORAGE_KEYS.addons, []);
};

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