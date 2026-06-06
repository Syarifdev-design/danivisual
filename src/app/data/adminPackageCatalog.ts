import type { Addon as AdminAddon, Package as AdminPackage, PackageCategory as AdminPackageCategory } from "../contexts/AdminContext";
import {
  addons as fallbackAddons,
  formatShortPrice,
  packageCategories as fallbackPackageCategories,
  type Addon,
  type PackageCategory,
  type PackageItem,
  type ServiceType,
} from "./bookingData";

// Also import from shared default for consistent fallback
import {
  DEFAULT_PACKAGES as SHARED_DEFAULT_PACKAGES,
  DEFAULT_ADDONS as SHARED_DEFAULT_ADDONS,
  formatShortPrice as sharedFormatShortPrice,
} from "./defaultPackages";

// Convert shared packages to frontend format
const sharedPackagesToFallbackCategories = (): PackageCategory[] => {
  // Group by category
  const categories = new Map<string, { packages: PackageItem[], name: string }>();

  SHARED_DEFAULT_PACKAGES.forEach(pkg => {
    const categoryId = pkg.categoryId;
    if (!categories.has(categoryId)) {
      categories.set(categoryId, { packages: [], name: categoryId });
    }
    const cat = categories.get(categoryId)!;

    // Create package item
    const packageItem: PackageItem = {
      id: pkg.id,
      categoryId: pkg.categoryId,
      name: pkg.name,
      isMostSelected: pkg.isMostSelected,
      startingPrice: pkg.startingPrice,
      price: pkg.price,
      description: pkg.description,
      benefits: pkg.benefits,
      serviceTypes: [{
        id: `${pkg.id}-${pkg.serviceType?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "photo"}`,
        name: pkg.serviceType || "Photo",
        price: pkg.price,
        includes: pkg.benefits,
        sampleImages: [],
        sampleVideoUrl: "",
      }],
    };
    cat.packages.push(packageItem);
  });

  // Convert to PackageCategory format
  return Array.from(categories.entries()).map(([id, data]) => ({
    id,
    name: data.name.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
    eyebrow: data.name,
    packages: data.packages,
  }));
};

// Use shared defaults as fallback
const SHARED_FALLBACK_CATEGORIES = sharedPackagesToFallbackCategories();
const SHARED_FALLBACK_ADDONS = SHARED_DEFAULT_ADDONS.map(a => ({
  id: a.id,
  categoryIds: a.categoryIds,
  name: a.name,
  description: a.description || "",
  price: a.price,
  displayPrice: a.displayPrice,
  unit: a.unit || undefined,
  hasQuantity: a.hasQuantity || false,
}));

const fallbackSamples = fallbackPackageCategories[0]?.packages[0]?.serviceTypes[0]?.sampleImages || [];

function getServiceType(packageItem: AdminPackage): ServiceType["name"] {
  if (packageItem.serviceType) return packageItem.serviceType;

  const text = `${packageItem.name} ${packageItem.description}`.toLowerCase();
  if (text.includes("photo") && text.includes("video")) return "Photo + Video";
  if (text.includes("video")) return "Video";
  return "Photo";
}

function toPackageItem(packageItem: AdminPackage): PackageItem {
  const serviceName = getServiceType(packageItem);
  const price = packageItem.price || packageItem.startingPrice || 0;
  const includes = packageItem.benefits.length
    ? packageItem.benefits
    : packageItem.description
      ? [packageItem.description]
      : ["Detail benefit dapat diatur dari admin panel."];

  return {
    id: packageItem.id,
    categoryId: packageItem.categoryId,
    name: packageItem.name,
    isMostSelected: packageItem.isMostSelected,
    startingPrice: packageItem.startingPrice || price,
    price,
    description: packageItem.description,
    benefits: packageItem.benefits,
    serviceTypes: [
      {
        id: `${packageItem.id}-${serviceName.toLowerCase().replaceAll(" + ", "-").replaceAll(" ", "-")}`,
        name: serviceName,
        price,
        includes,
        sampleImages: fallbackSamples,
        sampleVideoUrl: "",
      },
    ],
  };
}

export function getPackageCategoriesFromAdmin(
  adminCategories: AdminPackageCategory[] = [],
  adminPackages: AdminPackage[] = [],
): PackageCategory[] {
  const activePackages = adminPackages
    .filter((packageItem) => packageItem.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Use fallback - try bookingData first, then shared defaults
  const fallback = fallbackPackageCategories.length > 0
    ? fallbackPackageCategories
    : SHARED_FALLBACK_CATEGORIES;

  if (activePackages.length === 0) return fallback;

  const categories = adminCategories
    .filter((category) => category.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((category) => ({
      id: category.id,
      name: category.name,
      eyebrow: category.eyebrow,
      note: category.note,
      packages: activePackages
        .filter((packageItem) => packageItem.categoryId === category.id)
        .map(toPackageItem),
    }))
    .filter((category) => category.packages.length > 0);

  return categories.length ? categories : fallback;
}

export function getAddonsFromAdmin(adminAddons: AdminAddon[] = []): Addon[] {
  const activeAddons = adminAddons.filter((addon) => addon.isActive);
  if (activeAddons.length === 0) {
    return fallbackAddons.length > 0 ? fallbackAddons : SHARED_FALLBACK_ADDONS;
  }

  return activeAddons.map((addon) => ({
    id: addon.id,
    categoryIds: addon.categoryIds,
    name: addon.name,
    description: addon.description,
    price: addon.price,
    displayPrice: addon.displayPrice || formatShortPrice(addon.price),
    unit: addon.unit,
    hasQuantity: addon.hasQuantity,
  }));
}

export function findCategoryInCatalog(categories: PackageCategory[], categoryId?: string) {
  const allFallbacks = fallbackPackageCategories.length > 0
    ? fallbackPackageCategories
    : SHARED_FALLBACK_CATEGORIES;
  return categories.find((category) => category.id === categoryId) || categories[0] || allFallbacks[0];
}

export function findPackageInCatalog(categories: PackageCategory[], packageId?: string) {
  return categories.flatMap((category) => category.packages).find((packageItem) => packageItem.id === packageId);
}

export function findServiceTypeInCatalog(categories: PackageCategory[], serviceTypeId?: string) {
  return categories
    .flatMap((category) => category.packages)
    .flatMap((packageItem) => packageItem.serviceTypes)
    .find((serviceType) => serviceType.id === serviceTypeId);
}

