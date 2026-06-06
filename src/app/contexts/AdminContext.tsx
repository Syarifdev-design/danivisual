import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabaseClient";
import {
  createStaffUser,
  deactivateStaffUser,
  getStaffUsers,
  updateStaffUser,
  type CreateStaffUserInput,
} from "../../services/staffUserService";
import {
  packageCategories as bookingDataCategories,
  addons as bookingDataAddons,
} from "@/app/data/bookingData";
import { defaultFaqs } from "../data/defaultFaqs";

// ============================================================================
// Type Definitions
// ============================================================================

export type BookingStatus = "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
export type PaymentStatus = "pending" | "verified" | "rejected";
export type AdminRole = "super_admin" | "admin" | "finance" | "editor" | "photographer" | "videographer" | "staff" | "customer";

export interface AdminUser {
  id: string;
  userId?: string;
  adminUserId?: string;
  employeeId?: string | null;
  customerId?: string | null;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  role: AdminRole;
  position?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  packageId: string;
  packageName: string;
  packagePrice: number;
  addonIds: string[];
  addonTotal: number;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  serviceType: string;
  totalAmount: number;
  dpAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: BookingStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  bookingOrderNumber: string;
  customerName: string;
  amount: number;
  method: "transfer" | "cash" | "other";
  status: PaymentStatus;
  type: "dp" | "final_payment";
  proofImage: string;
  notes: string;
  senderName: string;
  verifiedBy: string;
  verifiedAt: string;
  createdAt: string;
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

export interface PackageCategory {
  id: string;
  name: string;
  eyebrow: string;
  note?: string;
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

export interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
}

export interface Album {
  id: string;
  title?: string;
  slug?: string;
  name: string;
  coupleName?: string;
  category: string;
  coverImage: string;
  galleryImages?: string[];
  images: string[];
  location?: string;
  story?: string;
  eventDate?: string;
  date: string;
  isFeatured?: boolean;
  isPublished: boolean;
  sortOrder: number;
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  type: "booking" | "blocked" | "event";
  bookingId?: string;
  description: string;
  createdBy: string;
}

export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: "image" | "video";
  size: number;
  uploadedAt: string;
  albumId?: string;
}

export interface AnalyticsData {
  date: string;
  views: number;
  bookings: number;
  revenue: number;
}

// ============================================================================
// Context Type
// ============================================================================

interface AdminContextType {
  // Bookings
  bookings: Booking[];
  bookingsLoading: boolean;
  bookingsError: string | null;
  addBooking: (booking: Omit<Booking, "id" | "orderNumber" | "createdAt" | "updatedAt">) => void;
  updateBooking: (id: string, updates: Partial<Booking>) => void;
  deleteBooking: (id: string) => void;
  refreshBookings: () => Promise<void>;
  verifyPayment: (bookingId: string, paymentId: string) => Promise<boolean>;

  // Customers
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, "id" | "createdAt">) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Payments
  payments: Payment[];
  paymentsLoading: boolean;
  paymentsError: string | null;
  addPayment: (payment: Omit<Payment, "id" | "createdAt">) => void;
  updatePaymentStatus: (id: string, status: PaymentStatus, verifiedBy?: string, notes?: string) => void;
  refreshPayments: () => Promise<void>;

  // Packages
  packages: Package[];
  categories: PackageCategory[];
  packagesLoading: boolean;
  packagesError: string | null;
  addPackage: (pkg: Omit<Package, "id" | "sortOrder">) => void;
  updatePackage: (id: string, updates: Partial<Package>) => void;
  deletePackage: (id: string) => void;
  addCategory: (cat: Omit<PackageCategory, "id" | "sortOrder">) => void;
  updateCategory: (id: string, updates: Partial<PackageCategory>) => void;
  deleteCategory: (id: string) => void;
  refreshPackages: () => Promise<void>;

  // Addons
  addons: Addon[];
  addonsLoading: boolean;
  addonsError: string | null;
  addAddon: (addon: Omit<Addon, "id">) => void;
  updateAddon: (id: string, updates: Partial<Addon>) => void;
  deleteAddon: (id: string) => void;
  refreshAddons: () => Promise<void>;

  // FAQ
  faqs: FAQ[];
  faqsLoading: boolean;
  faqsError: string | null;
  addFAQ: (faq: Omit<FAQ, "id">) => void;
  updateFAQ: (id: string, updates: Partial<FAQ>) => void;
  deleteFAQ: (id: string) => void;
  reorderFAQs: (ids: string[]) => void;
  refreshFAQs: () => Promise<void>;

  // Albums
  albums: Album[];
  albumsLoading: boolean;
  albumsError: string | null;
  uploadProgress: Record<string, number>;
  addAlbum: (album: Omit<Album, "id" | "sortOrder">) => void;
  updateAlbum: (id: string, updates: Partial<Album>) => void;
  deleteAlbum: (id: string) => void;
  reorderAlbums: (ids: string[]) => void;
  refreshAlbums: () => Promise<void>;
  uploadAlbumImage: (albumId: string, field: "coverImage" | "gallery", file: File) => Promise<string | null>;
  uploadAlbumImages: (albumId: string, files: File[]) => Promise<string[]>;
  deleteAlbumImage: (albumId: string, imageUrl: string) => void;

  // Calendar
  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Media
  mediaFiles: MediaFile[];
  addMediaFile: (file: Omit<MediaFile, "id" | "uploadedAt">) => void;
  deleteMediaFile: (id: string) => void;

  // Admins
  admins: AdminUser[];
  addAdmin: (admin: Omit<AdminUser, "id" | "createdAt" | "lastLogin"> & { temporaryPassword?: string }) => Promise<AdminUser>;
  updateAdmin: (id: string, updates: Partial<AdminUser>) => Promise<void>;
  deleteAdmin: (id: string) => Promise<void>;
  refreshAdmins: () => Promise<void>;

  // Analytics
  analytics: AnalyticsData[];
  addAnalytics: (data: AnalyticsData) => void;

  // Stats
  stats: {
    totalBookings: number;
    pendingBookings: number;
    completedBookings: number;
    totalRevenue: number;
    monthlyBookings: number;
    monthlyRevenue: number;
    pendingPayments: number;
  };

  // Reset
  resetAll: () => void;
}

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  bookings: "danivisual_admin_bookings",
  customers: "danivisual_admin_customers",
  payments: "danivisual_admin_payments",
  packages: "danivisual_admin_packages",
  categories: "danivisual_admin_categories",
  addons: "danivisual_admin_addons",
  faqs: "danivisual_admin_faqs",
  albums: "danivisual_admin_albums",
  calendar: "danivisual_admin_calendar",
  media: "danivisual_admin_media",
  admins: "danivisual_admin_admins",
  analytics: "danivisual_admin_analytics",
};

// ============================================================================
// Utility Functions
// ============================================================================

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toLocaleDateString("id-ID", { format: "ddMMyy" }).replace(/\//g, "");
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `DV-${dateStr}-${random}`;
}

// ============================================================================
// Default Data
// ============================================================================

const defaultAdmins: AdminUser[] = [
  {
    id: "admin-1",
    username: "admin",
    name: "Admin Utama",
    role: "super_admin",
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// ============================================================================
// Default Data from Shared Source
// ============================================================================

import {
  DEFAULT_CATEGORIES as SHARED_DEFAULT_CATEGORIES,
  DEFAULT_PACKAGES as SHARED_DEFAULT_PACKAGES,
  DEFAULT_ADDONS as SHARED_DEFAULT_ADDONS,
} from "../data/defaultPackages";

// Transform Shared Default Categories
const defaultCategories: PackageCategory[] = SHARED_DEFAULT_CATEGORIES.map(cat => ({
  id: cat.id,
  name: cat.name,
  eyebrow: cat.eyebrow,
  note: cat.note,
  isActive: cat.isActive,
  sortOrder: cat.sortOrder,
}));

// Transform Shared Default Packages to Admin Package format
const buildDefaultPackagesFromShared = (): Package[] => {
  return SHARED_DEFAULT_PACKAGES.map(pkg => {
    const category = SHARED_DEFAULT_CATEGORIES.find(c => c.id === pkg.categoryId);
    return {
      id: pkg.id,
      categoryId: pkg.categoryId,
      categoryName: category?.name || pkg.categoryId,
      name: pkg.name,
      serviceType: pkg.serviceType as "Photo" | "Video" | "Photo + Video" | undefined,
      isMostSelected: pkg.isMostSelected,
      startingPrice: pkg.startingPrice,
      price: pkg.price,
      description: pkg.description,
      benefits: pkg.benefits,
      isActive: pkg.isActive,
      sortOrder: pkg.sortOrder,
    };
  });
};

// Transform Shared Default Addons to Admin Addon format
const buildDefaultAddonsFromShared = (): Addon[] => {
  return SHARED_DEFAULT_ADDONS.map(addon => ({
    id: addon.id,
    categoryIds: addon.categoryIds,
    name: addon.name,
    description: addon.description || "",
    price: addon.price,
    displayPrice: addon.displayPrice,
    unit: addon.unit || undefined,
    hasQuantity: addon.hasQuantity || false,
    isActive: addon.isActive,
  }));
};

// Pre-compute defaults from shared data source
const BOOKING_DATA_DEFAULT_PACKAGES = buildDefaultPackagesFromShared();
const BOOKING_DATA_DEFAULT_ADDONS = buildDefaultAddonsFromShared();

// Note: defaultFaqs now imported from ../data/defaultFaqs

// ============================================================================
// Default Albums from Shared Source
// ============================================================================

import { DEFAULT_PORTFOLIOS as SHARED_DEFAULT_PORTFOLIOS } from "../data/defaultPortfolio";

// Pre-compute defaults from shared data source
const DEFAULT_ALBUMS = SHARED_DEFAULT_PORTFOLIOS;

const defaultAlbums: Album[] = DEFAULT_ALBUMS;

// ============================================================================
// Context
// ============================================================================

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  // State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);
  const [packages, setPackages] = useState<Package[]>(BOOKING_DATA_DEFAULT_PACKAGES);
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const [categories, setCategories] = useState<PackageCategory[]>(defaultCategories);
  const [addons, setAddons] = useState<Addon[]>(BOOKING_DATA_DEFAULT_ADDONS);
  const [addonsLoading, setAddonsLoading] = useState(false);
  const [addonsError, setAddonsError] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(false);
  const [faqsError, setFaqsError] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>(DEFAULT_ALBUMS);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [albumsError, setAlbumsError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>(defaultAdmins);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);

  // Load from localStorage
  useEffect(() => {
    // Bookings
    const storedBookings = localStorage.getItem(STORAGE_KEYS.bookings);
    if (storedBookings) setBookings(JSON.parse(storedBookings));

    // Customers
    const storedCustomers = localStorage.getItem(STORAGE_KEYS.customers);
    if (storedCustomers) setCustomers(JSON.parse(storedCustomers));

    // Payments - initial load from localStorage
    const storedPayments = localStorage.getItem(STORAGE_KEYS.payments);
    if (storedPayments) setPayments(JSON.parse(storedPayments));

  }, []);

  // ============================================================================
  // Load Admin Users from Supabase or DEV localStorage
  // ============================================================================

  const loadAdmins = async () => {
    try {
      const loadedAdmins = await getStaffUsers();
      if (loadedAdmins.length > 0) {
        setAdmins(loadedAdmins.map((user) => ({
          id: user.adminUserId || user.id,
          userId: user.userId,
          adminUserId: user.adminUserId,
          employeeId: user.employeeId,
          customerId: user.customerId,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role as AdminRole,
          position: user.position,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
        })));
        return;
      }
    } catch (err) {
      console.warn("[AdminContext] Failed to load admin users:", err);
    }

    const storedAdmins = localStorage.getItem(STORAGE_KEYS.admins);
    if (storedAdmins) {
      try {
        setAdmins(JSON.parse(storedAdmins));
        return;
      } catch {
        localStorage.removeItem(STORAGE_KEYS.admins);
      }
    }

    setAdmins(defaultAdmins);
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  // ============================================================================
  // Load Payments from Supabase or localStorage
  // ============================================================================

  const loadPayments = async () => {
    setPaymentsLoading(true);
    setPaymentsError(null);

    // Try Supabase first if configured
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client
            .from("payments")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && data) {
            // Map database rows to Payment type
            const loadedPayments = data.map((row) => ({
              id: row.id,
              bookingId: row.booking_id || "",
              bookingOrderNumber: row.booking_order_number || "",
              customerName: row.customer_name || "",
              amount: row.amount || 0,
              method: (row.method as "transfer" | "cash" | "other") || "transfer",
              type: (row.payment_type as "dp" | "final_payment") || "dp",
              status: (row.status as PaymentStatus) || "pending",
              proofImage: row.proof_image_url || row.proof_image || "",
              notes: row.notes || "",
              verifiedBy: row.verified_by || "",
              verifiedAt: row.verified_at || "",
              senderName: row.sender_name || "",
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));
            setPayments(loadedPayments);
            // Cache to localStorage
            localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(loadedPayments));
            setPaymentsLoading(false);
            return;
          }
          if (error) {
            console.warn("[AdminContext] Failed to load payments from Supabase:", error.message);
          }
        } catch (err) {
          console.warn("[AdminContext] Supabase payments load error:", err);
        }
      }
    }

    // Fallback to localStorage
    const storedPayments = localStorage.getItem(STORAGE_KEYS.payments);
    if (storedPayments) {
      try {
        setPayments(JSON.parse(storedPayments));
      } catch {
        setPaymentsError("Failed to parse localStorage payments");
        setPayments([]);
      }
    } else {
      setPayments([]);
    }

    setPaymentsLoading(false);
  };

  // Load payments on mount
  useEffect(() => {
    loadPayments();
  }, []);

  // Sync payments to localStorage whenever they change
  useEffect(() => {
    if (payments.length > 0) {
      localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments));
    }
  }, [payments]);

  // ============================================================================
  // Load Packages, Categories, Addons from Supabase or localStorage
  // ============================================================================

  const loadPackagesAndAddons = async () => {
    setPackagesLoading(true);
    setPackagesError(null);
    setAddonsLoading(true);
    setAddonsError(null);

    // Try Supabase first
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          // Load categories
          const { data: categoriesData, error: categoriesError } = await client
            .from("package_categories")
            .select("*")
            .order("sort_order", { ascending: true });

          if (!categoriesError && categoriesData) {
            const loadedCategories = categoriesData.map((row) => ({
              id: row.id,
              name: row.name,
              eyebrow: row.eyebrow,
              note: row.note,
              isActive: row.is_active,
              sortOrder: row.sort_order,
            }));
            setCategories(loadedCategories);
          }

          // Load packages
          const { data: packagesData, error: packagesError } = await client
            .from("packages")
            .select("*")
            .order("sort_order", { ascending: true });

          if (!packagesError && packagesData) {
            const loadedPackages = packagesData.map((row) => ({
              id: row.id,
              categoryId: row.category_id,
              categoryName: row.category_name || "",
              name: row.name,
              serviceType: row.service_type,
              isMostSelected: row.is_most_selected,
              startingPrice: row.starting_price,
              price: row.price,
              description: row.description || "",
              benefits: row.benefits || [],
              isActive: row.is_active,
              sortOrder: row.sort_order,
            }));
            setPackages(loadedPackages);
          }

          // Load addons
          const { data: addonsData, error: addonsError } = await client
            .from("addons")
            .select("*")
            .order("sort_order", { ascending: true });

          if (!addonsError && addonsData) {
            const loadedAddons = addonsData.map((row) => ({
              id: row.id,
              categoryIds: row.category_ids || [],
              name: row.name,
              description: row.description || "",
              price: row.price,
              displayPrice: row.display_price || "",
              unit: row.unit,
              hasQuantity: row.has_quantity,
              isActive: row.is_active,
            }));
            setAddons(loadedAddons);
          }

          setPackagesLoading(false);
          setAddonsLoading(false);
          return;
        } catch (err) {
          console.warn("[AdminContext] Supabase packages/addons load error:", err);
        }
      }
    }

    // Fallback to localStorage, then to bookingData defaults
    const storedPackages = localStorage.getItem(STORAGE_KEYS.packages);
    if (storedPackages) {
      try {
        setPackages(JSON.parse(storedPackages));
      } catch {
        setPackagesError("Failed to parse localStorage packages");
        // Fall back to bookingData defaults
        setPackages(BOOKING_DATA_DEFAULT_PACKAGES);
      }
    } else {
      // No localStorage → use bookingData defaults (same source as frontend)
      setPackages(BOOKING_DATA_DEFAULT_PACKAGES);
    }

    const storedCategories = localStorage.getItem(STORAGE_KEYS.categories);
    if (storedCategories) {
      try {
        setCategories(JSON.parse(storedCategories));
      } catch {
        setCategories(defaultCategories);
      }
    } else {
      setCategories(defaultCategories);
    }

    const storedAddons = localStorage.getItem(STORAGE_KEYS.addons);
    if (storedAddons) {
      try {
        setAddons(JSON.parse(storedAddons));
      } catch {
        setAddonsError("Failed to parse localStorage addons");
        // Fall back to bookingData defaults
        setAddons(BOOKING_DATA_DEFAULT_ADDONS);
      }
    } else {
      // No localStorage → use bookingData defaults (same source as frontend)
      setAddons(BOOKING_DATA_DEFAULT_ADDONS);
    }

    setPackagesLoading(false);
    setAddonsLoading(false);
  };

  // ============================================================================
  // Load Albums from Supabase or localStorage
  // ============================================================================

  const loadAlbums = async () => {
    setAlbumsLoading(true);
    setAlbumsError(null);

    // Try Supabase first (use correct table name: portfolio_albums)
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          // Load albums from correct table
          const { data: albumsData, error: albumsError } = await client
            .from("portfolio_albums")
            .select("*")
            .order("sort_order", { ascending: true });

          if (!albumsError && albumsData && albumsData.length > 0) {
            const loadedAlbums = albumsData.map((row) => ({
              id: row.id,
              title: row.title,
              slug: row.slug,
              name: row.name,
              coupleName: row.couple_name,
              category: row.category,
              coverImage: row.cover_image || "",
              galleryImages: row.gallery_images || [],
              images: row.gallery_images || [],
              location: row.location,
              story: row.story,
              eventDate: row.event_date,
              date: row.date,
              isFeatured: row.is_featured,
              isPublished: row.is_published,
              sortOrder: row.sort_order,
            }));
            setAlbums(loadedAlbums);
            // Cache to localStorage
            localStorage.setItem(STORAGE_KEYS.albums, JSON.stringify(loadedAlbums));
            setAlbumsLoading(false);
            return;
          }
          if (albumsError) {
            console.warn("[AdminContext] Failed to load albums from Supabase:", albumsError.message);
          }
        } catch (err) {
          console.warn("[AdminContext] Supabase albums load error:", err);
        }
      }
    }

    // Fallback to localStorage
    const storedAlbums = localStorage.getItem(STORAGE_KEYS.albums);
    if (storedAlbums) {
      try {
        const parsed = JSON.parse(storedAlbums);
        if (parsed.length > 0) {
          setAlbums(parsed);
          setAlbumsLoading(false);
          return;
        }
      } catch {
        setAlbumsError("Failed to parse localStorage albums");
      }
    }

    // Final fallback to shared default albums
    setAlbums(DEFAULT_ALBUMS);
    setAlbumsLoading(false);
  };

  // Load albums on mount
  useEffect(() => {
    loadAlbums();
  }, []);

  // Sync albums to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.albums, JSON.stringify(albums));
  }, [albums]);

  // Load packages and addons on mount
  useEffect(() => {
    loadPackagesAndAddons();
  }, []);

  // Sync packages/categories/addons to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.packages, JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.addons, JSON.stringify(addons));
  }, [addons]);

  // ============================================================================
  // Load Bookings from Supabase or localStorage
  // ============================================================================

  const loadBookings = async () => {
    setBookingsLoading(true);
    setBookingsError(null);

    // Try Supabase first
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client
            .from("bookings")
            .select("*")
            .order("created_at", { ascending: false });

          if (!error && data) {
            const loadedBookings = data.map((row) => ({
              id: row.id,
              orderNumber: row.order_number,
              customerId: row.customer_id,
              customerName: row.customer_name,
              customerEmail: row.customer_email,
              customerPhone: row.customer_phone,
              packageId: row.package_id,
              packageName: row.package_name,
              packagePrice: row.package_price,
              addonIds: row.addon_ids || [],
              addonTotal: row.addon_total || 0,
              eventDate: row.event_date,
              eventLocation: row.event_location,
              eventType: row.event_type,
              serviceType: row.service_type,
              totalAmount: row.total_amount,
              dpAmount: row.dp_amount,
              paidAmount: row.paid_amount,
              remainingAmount: row.remaining_amount,
              status: row.status as BookingStatus,
              notes: row.notes || "",
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }));
            setBookings(loadedBookings);
            setBookingsLoading(false);
            return;
          }
          if (error) {
            console.warn("[AdminContext] Failed to load bookings from Supabase:", error.message);
          }
        } catch (err) {
          console.warn("[AdminContext] Supabase bookings load error:", err);
        }
      }
    }

    // Fallback to localStorage
    const storedBookings = localStorage.getItem(STORAGE_KEYS.bookings);
    if (storedBookings) {
      try {
        setBookings(JSON.parse(storedBookings));
      } catch {
        setBookingsError("Failed to parse localStorage bookings");
        setBookings([]);
      }
    }

    setBookingsLoading(false);
  };

  // Load bookings on mount
  useEffect(() => {
    loadBookings();
  }, []);

  // Sync bookings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
  }, [bookings]);

  const loadFaqs = async () => {
    setFaqsLoading(true);
    setFaqsError(null);

    // Try Supabase first
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data, error } = await client
            .from("faqs")
            .select("*")
            .order("sort_order", { ascending: true });

          if (!error && data && data.length > 0) {
            // Success with data from Supabase
            const loadedFaqs = data.map((row) => ({
              id: row.id,
              category: row.category,
              question: row.question,
              answer: row.answer,
              sortOrder: row.sort_order,
              isPublished: row.is_published ?? true,
            }));
            setFaqs(loadedFaqs);
            // Cache to localStorage for offline access
            localStorage.setItem(STORAGE_KEYS.faqs, JSON.stringify(loadedFaqs));
            setFaqsLoading(false);
            return;
          }
          // Empty data or error → fall through to localStorage
        } catch (err) {
          console.warn("[AdminContext] Supabase FAQ load error:", err);
        }
      }
    }

    // Fallback: localStorage cache
    const storedFaqs = localStorage.getItem(STORAGE_KEYS.faqs);
    if (storedFaqs) {
      try {
        const parsed = JSON.parse(storedFaqs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFaqs(parsed);
          setFaqsLoading(false);
          return;
        }
      } catch {
        setFaqsError("Failed to parse localStorage FAQs");
        // Fall through to defaultFaqs
      }
    }

    // Final fallback: defaultFaqs from shared data file
    setFaqs([...defaultFaqs]);
    setFaqsLoading(false);
  };

  // Load FAQs on mount
  useEffect(() => {
    loadFaqs();
  }, []);

  // Sync FAQs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.faqs, JSON.stringify(faqs));
  }, [faqs]);

  // Sync other data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.bookings, JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.payments, JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.packages, JSON.stringify(packages));
  }, [packages]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.addons, JSON.stringify(addons));
  }, [addons]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.albums, JSON.stringify(albums));
  }, [albums]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.calendar, JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.media, JSON.stringify(mediaFiles));
  }, [mediaFiles]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.admins, JSON.stringify(admins));
  }, [admins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.analytics, JSON.stringify(analytics));
  }, [analytics]);

  // ============================================================================
  // Booking Operations
  // ============================================================================

  const addBooking = async (bookingData: Omit<Booking, "id" | "orderNumber" | "createdAt" | "updatedAt">) => {
    const now = new Date().toISOString();
    const newBooking: Booking = {
      ...bookingData,
      id: generateId(),
      orderNumber: generateOrderNumber(),
      createdAt: now,
      updatedAt: now,
    };

    // Update local state first
    setBookings((prev) => [newBooking, ...prev]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("bookings").insert({
            id: newBooking.id,
            order_number: newBooking.orderNumber,
            customer_id: newBooking.customerId,
            customer_name: newBooking.customerName,
            customer_email: newBooking.customerEmail || null,
            customer_phone: newBooking.customerPhone,
            package_id: newBooking.packageId,
            package_name: newBooking.packageName,
            package_price: newBooking.packagePrice,
            addon_ids: newBooking.addonIds,
            addon_total: newBooking.addonTotal,
            event_date: newBooking.eventDate,
            event_location: newBooking.eventLocation,
            event_type: newBooking.eventType,
            service_type: newBooking.serviceType,
            total_amount: newBooking.totalAmount,
            dp_amount: newBooking.dpAmount,
            paid_amount: newBooking.paidAmount,
            remaining_amount: newBooking.remainingAmount,
            status: newBooking.status,
            notes: newBooking.notes || null,
            created_at: now,
            updated_at: now,
          });
        } catch (err) {
          console.warn("[AdminContext] Failed to sync new booking to Supabase:", err);
        }
      }
    }
  };

  const updateBooking = async (id: string, updates: Partial<Booking>) => {
    // Update local state first
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b))
    );

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.status !== undefined) dbUpdates.status = updates.status;
          if (updates.paidAmount !== undefined) dbUpdates.paid_amount = updates.paidAmount;
          if (updates.remainingAmount !== undefined) dbUpdates.remaining_amount = updates.remainingAmount;
          if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

          await client.from("bookings").update({ ...dbUpdates, updated_at: new Date().toISOString() }).eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to sync updated booking to Supabase:", err);
        }
      }
    }
  };

  const deleteBooking = async (id: string) => {
    // Update local state first
    setBookings((prev) => prev.filter((b) => b.id !== id));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("bookings").delete().eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to delete booking from Supabase:", err);
        }
      }
    }
  };

  // Refresh bookings
  const refreshBookings = async () => {
    await loadBookings();
  };

  // Verify payment (admin action)
  const verifyPayment = async (bookingId: string, paymentId: string): Promise<boolean> => {
    // Update local state
    setBookings((prev) =>
      prev.map((b) =>
        b.id === bookingId ? { ...b, status: "confirmed" as BookingStatus } : b
      )
    );

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          // Update booking status
          await client
            .from("bookings")
            .update({ status: "confirmed", updated_at: new Date().toISOString() })
            .eq("id", bookingId);

          // Update payment status
          await client
            .from("payments")
            .update({
              status: "verified",
              verified_at: new Date().toISOString(),
              verified_by: "admin",
            })
            .eq("id", paymentId);

          return true;
        } catch (err) {
          console.warn("[AdminContext] Failed to verify payment:", err);
          return false;
        }
      }
    }

    return true;
  };

  // ============================================================================
  // Customer Operations
  // ============================================================================

  const addCustomer = (customerData: Omit<Customer, "id" | "createdAt">) => {
    const newCustomer: Customer = {
      ...customerData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCustomer, ...prev]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // ============================================================================
  // Payment Operations
  // ============================================================================

  const addPayment = (paymentData: Omit<Payment, "id" | "createdAt">) => {
    const newPayment: Payment = {
      ...paymentData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus, verifiedBy?: string, notes?: string) => {
    // Find the payment being updated
    const payment = payments.find(p => p.id === id);
    const isVerifying = status === "verified" && payment?.status !== "verified";
    const isRejecting = status === "rejected" && payment?.status !== "rejected";

    setPayments((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              status,
              verifiedBy: verifiedBy || p.verifiedBy,
              verifiedAt: status === "verified" || status === "rejected" ? new Date().toISOString() : p.verifiedAt,
              notes: notes !== undefined ? notes : p.notes,
            }
          : p
      )
    );

    // Handle payment verification
    if (isVerifying && payment) {
      // Update booking's paid_amount
      setBookings((prev) =>
        prev.map((b) => {
          if (b.id === payment.bookingId || b.orderNumber === payment.bookingOrderNumber) {
            const newPaidAmount = b.paidAmount + payment.amount;
            const newRemainingAmount = Math.max(0, b.totalAmount - newPaidAmount);
            const isFullyPaid = newRemainingAmount <= 0;

            // Determine new booking status
            let newStatus = b.status;

            if (payment.type === "dp") {
              // DP approved: booking becomes "confirmed" if it was "pending"
              if (b.status === "pending") {
                newStatus = "confirmed";
              }
              // Create production steps for this booking if not exists
              createProductionSteps(b.id);
            } else if (payment.type === "final_payment") {
              // Final payment approved: mark as "paid_full"
              // Booking status becomes "in_progress" if not already confirmed
              if (b.status === "confirmed" || b.status === "pending") {
                newStatus = "in_progress";
              }
            }

            // If fully paid, status becomes "in_progress"
            if (isFullyPaid && newStatus !== "in_progress") {
              newStatus = "in_progress";
            }

            return {
              ...b,
              paidAmount: newPaidAmount,
              remainingAmount: newRemainingAmount,
              status: newStatus,
              updatedAt: new Date().toISOString(),
            };
          }
          return b;
        })
      );

      // Sync to Supabase
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          // Find booking for this payment
          const booking = bookings.find(b => b.id === payment.bookingId || b.orderNumber === payment.bookingOrderNumber);
          if (booking) {
            updateBookingSupabase(booking.id, booking.orderNumber, payment.type, {
              paid_amount: payment.amount,
            });
          }
        }
      }
    }

    // Handle payment rejection - notify customer
    if (isRejecting && payment && notes) {
      // Store rejection reason for customer to see
      const rejectionKey = `payment_rejection_${payment.id}`;
      localStorage.setItem(rejectionKey, JSON.stringify({
        paymentId: payment.id,
        orderNumber: payment.bookingOrderNumber,
        reason: notes,
        rejectedAt: new Date().toISOString(),
      }));
    }

    // Sync to Supabase - update payment status
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        const timestamp = new Date().toISOString();
        const dbUpdates: Record<string, unknown> = {
          status,
          updated_at: timestamp,
        };

        if (verifiedBy) dbUpdates.verified_by = verifiedBy;
        if (notes) dbUpdates.notes = notes;
        if (status === "verified" || status === "rejected") {
          dbUpdates.verified_at = timestamp;
        }

        client.from("payments").update(dbUpdates).eq("id", id).then(({ error }) => {
          if (error) console.warn("[AdminContext] Failed to sync payment update to Supabase:", error);
        });
      }
    }
  };

  // Refresh payments
  const refreshPayments = async () => {
    await loadPayments();
  };

  // Create production steps for a booking
  const createProductionSteps = (bookingId: string) => {
    const storageKey = "danivisual_production_records";
    const stored = localStorage.getItem(storageKey);
    const records = stored ? JSON.parse(stored) : [];

    // Check if production steps already exist for this booking
    const exists = records.some((r: { bookingId: string }) => r.bookingId === bookingId);

    if (!exists) {
      // Get booking details
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      // Create default production steps
      const newRecord = {
        bookingId,
        orderNumber: booking.orderNumber,
        customerName: booking.customerName,
        customerPhone: booking.customerPhone,
        packageName: booking.packageName,
        eventDate: booking.eventDate,
        eventLocation: booking.eventLocation,
        steps: {
          pelunasan: { id: "pelunasan", name: "Pelunasan & Sneak Peek", status: "waiting", note: "", estimatedDate: null, completedAt: null },
          photoSorting: { id: "photoSorting", name: "Photo Sorting", status: "waiting", note: "", estimatedDate: null, completedAt: null },
          editing: { id: "editing", name: "Editing", status: "waiting", note: "", estimatedDate: null, completedAt: null },
          printing: { id: "printing", name: "Cetak", status: "waiting", note: "", estimatedDate: null, completedAt: null },
          finishing: { id: "finishing", name: "Finishing", status: "waiting", note: "", estimatedDate: null, completedAt: null },
          delivery: { id: "delivery", name: "Delivery", status: "waiting", note: "", estimatedDate: null, completedAt: null },
        },
        googleDriveLink: null,
        customerNotes: "",
        updatedAt: new Date().toISOString(),
      };

      records.push(newRecord);
      localStorage.setItem(storageKey, JSON.stringify(records));

      // Also sync to Supabase if configured
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          client.from("production_records").upsert({
            booking_id: bookingId,
            steps: newRecord.steps,
            google_drive_link: null,
            customer_notes: "",
            updated_at: new Date().toISOString(),
          }).then(({ error }) => {
            if (error) console.warn("[AdminContext] Failed to create production record:", error);
          });
        }
      }
    }
  };

  // Helper to update booking in Supabase
  const updateBookingSupabase = async (
    bookingId: string,
    orderNumber: string,
    paymentType: string,
    updates: { paid_amount?: number }
  ) => {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      // Get current booking
      const { data: bookingData, error: fetchError } = await client
        .from("bookings")
        .select("paid_amount, total_amount, status")
        .eq("id", bookingId)
        .single();

      if (fetchError) {
        // Try by order number
        const { data: bookingByOrder } = await client
          .from("bookings")
          .select("id, paid_amount, total_amount, status")
          .eq("order_number", orderNumber)
          .single();

        if (bookingByOrder) {
          updateBookingData(client, bookingByOrder.id, bookingByOrder, paymentType, updates);
        }
        return;
      }

      updateBookingData(client, bookingId, bookingData, paymentType, updates);
    } catch (err) {
      console.warn("[AdminContext] Update booking payment error:", err);
    }
  };

  const updateBookingData = async (
    client: ReturnType<typeof getSupabaseClient>,
    bookingId: string,
    bookingData: { paid_amount: number; total_amount: number; status: string },
    paymentType: string,
    updates: { paid_amount?: number }
  ) => {
    let newPaidAmount = bookingData.paid_amount || 0;
    let newStatus = bookingData.status;

    if (updates.paid_amount) {
      newPaidAmount += updates.paid_amount;
    }

    const remainingAmount = Math.max(0, (bookingData.total_amount || 0) - newPaidAmount);

    // Determine status based on payment type
    if (paymentType === "dp" && bookingData.status === "pending") {
      newStatus = "confirmed";
    } else if (paymentType === "final_payment") {
      newStatus = "in_progress";
    }

    if (remainingAmount <= 0) {
      newStatus = "in_progress";
    }

    await client
      .from("bookings")
      .update({
        paid_amount: newPaidAmount,
        remaining_amount: remainingAmount,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);
  };

  // ============================================================================
  // Package Operations
  // ============================================================================

  const addPackage = async (pkg: Omit<Package, "id" | "sortOrder">) => {
    const maxSort = Math.max(0, ...packages.map((p) => p.sortOrder));
    const newPackage: Package = { ...pkg, id: generateId(), sortOrder: maxSort + 1 };

    // Update local state first
    setPackages((prev) => [...prev, newPackage]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("packages").insert({
            id: newPackage.id,
            category_id: newPackage.categoryId,
            category_name: newPackage.categoryName,
            package_id: newPackage.id,
            name: newPackage.name,
            service_type: newPackage.serviceType,
            is_most_selected: newPackage.isMostSelected,
            starting_price: newPackage.startingPrice,
            price: newPackage.price,
            description: newPackage.description,
            benefits: newPackage.benefits,
            is_active: newPackage.isActive,
            sort_order: newPackage.sortOrder,
          });
        } catch (err) {
          console.warn("[AdminContext] Failed to sync new package to Supabase:", err);
        }
      }
    }
  };

  const updatePackage = async (id: string, updates: Partial<Package>) => {
    // Update local state first
    setPackages((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
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

          await client.from("packages").update(dbUpdates).eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to sync updated package to Supabase:", err);
        }
      }
    }
  };

  const deletePackage = async (id: string) => {
    // Update local state first
    setPackages((prev) => prev.filter((p) => p.id !== id));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("packages").delete().eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to delete package from Supabase:", err);
        }
      }
    }
  };

  const addCategory = async (cat: Omit<PackageCategory, "id" | "sortOrder">) => {
    const maxSort = Math.max(0, ...categories.map((c) => c.sortOrder));
    const newCategory: PackageCategory = { ...cat, id: generateId(), sortOrder: maxSort + 1 };

    // Update local state first
    setCategories((prev) => [...prev, newCategory]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("package_categories").insert({
            id: newCategory.id,
            category_id: newCategory.id,
            name: newCategory.name,
            eyebrow: newCategory.eyebrow,
            note: newCategory.note,
            is_active: newCategory.isActive,
            sort_order: newCategory.sortOrder,
          });
        } catch (err) {
          console.warn("[AdminContext] Failed to sync new category to Supabase:", err);
        }
      }
    }
  };

  const updateCategory = async (id: string, updates: Partial<PackageCategory>) => {
    // Update local state first
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.eyebrow !== undefined) dbUpdates.eyebrow = updates.eyebrow;
          if (updates.note !== undefined) dbUpdates.note = updates.note;
          if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
          if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

          await client.from("package_categories").update(dbUpdates).eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to sync updated category to Supabase:", err);
        }
      }
    }
  };

  const deleteCategory = async (id: string) => {
    // Update local state first
    setCategories((prev) => prev.filter((c) => c.id !== id));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("package_categories").delete().eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to delete category from Supabase:", err);
        }
      }
    }
  };

  // ============================================================================
  // Addon Operations
  // ============================================================================

  const addAddon = async (addon: Omit<Addon, "id">) => {
    const newAddon: Addon = { ...addon, id: generateId() };

    // Update local state first
    setAddons((prev) => [...prev, newAddon]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("addons").insert({
            id: newAddon.id,
            addon_id: newAddon.id,
            name: newAddon.name,
            description: newAddon.description,
            price: newAddon.price,
            display_price: newAddon.displayPrice,
            unit: newAddon.unit,
            has_quantity: newAddon.hasQuantity,
            is_active: newAddon.isActive,
            category_ids: newAddon.categoryIds,
            sort_order: newAddon.sortOrder || 0,
          });
        } catch (err) {
          console.warn("[AdminContext] Failed to sync new addon to Supabase:", err);
        }
      }
    }
  };

  const updateAddon = async (id: string, updates: Partial<Addon>) => {
    // Update local state first
    setAddons((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.categoryIds !== undefined) dbUpdates.category_ids = updates.categoryIds;
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.description !== undefined) dbUpdates.description = updates.description;
          if (updates.price !== undefined) dbUpdates.price = updates.price;
          if (updates.displayPrice !== undefined) dbUpdates.display_price = updates.displayPrice;
          if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
          if (updates.hasQuantity !== undefined) dbUpdates.has_quantity = updates.hasQuantity;
          if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

          await client.from("addons").update(dbUpdates).eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to sync updated addon to Supabase:", err);
        }
      }
    }
  };

  const deleteAddon = async (id: string) => {
    // Update local state first
    setAddons((prev) => prev.filter((a) => a.id !== id));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("addons").delete().eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to delete addon from Supabase:", err);
        }
      }
    }
  };

  // Refresh packages and addons
  const refreshPackages = async () => {
    await loadPackagesAndAddons();
  };

  const refreshAddons = async () => {
    await loadPackagesAndAddons();
  };

  // ============================================================================
  // FAQ Operations
  // ============================================================================

  const addFAQ = async (faq: Omit<FAQ, "id">) => {
    const maxSort = Math.max(0, ...faqs.map((f) => f.sortOrder));
    const newFAQ: FAQ = { ...faq, id: generateId(), sortOrder: faq.sortOrder || maxSort + 1 };

    // Update local state first
    setFaqs((prev) => [...prev, newFAQ]);

    // Try to sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("faqs").insert({
            id: newFAQ.id,
            category: newFAQ.category,
            question: newFAQ.question,
            answer: newFAQ.answer,
            sort_order: newFAQ.sortOrder,
            is_published: newFAQ.isPublished,
          });
        } catch (err) {
          console.warn("[AdminContext] Failed to sync new FAQ to Supabase:", err);
        }
      }
    }
  };

  const updateFAQ = async (id: string, updates: Partial<FAQ>) => {
    // Update local state first
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));

    // Try to sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.category !== undefined) dbUpdates.category = updates.category;
          if (updates.question !== undefined) dbUpdates.question = updates.question;
          if (updates.answer !== undefined) dbUpdates.answer = updates.answer;
          if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
          if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;

          await client.from("faqs").update(dbUpdates).eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to sync updated FAQ to Supabase:", err);
        }
      }
    }
  };

  const deleteFAQ = async (id: string) => {
    // Update local state first
    setFaqs((prev) => prev.filter((f) => f.id !== id));

    // Try to sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("faqs").delete().eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to delete FAQ from Supabase:", err);
        }
      }
    }
  };

  const reorderFAQs = async (ids: string[]) => {
    // Update local state first
    setFaqs((prev) => {
      const faqMap = new Map(prev.map((f) => [f.id, f]));
      return ids.map((id, index) => {
        const faq = faqMap.get(id);
        return faq ? { ...faq, sortOrder: index + 1 } : null;
      }).filter(Boolean) as FAQ[];
    });

    // Try to sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          for (let i = 0; i < ids.length; i++) {
            await client
              .from("faqs")
              .update({ sort_order: i + 1 })
              .eq("id", ids[i]);
          }
        } catch (err) {
          console.warn("[AdminContext] Failed to sync FAQ order to Supabase:", err);
        }
      }
    }
  };

  // Refresh FAQs
  const refreshFAQs = async () => {
    await loadFaqs();
  };

  // ============================================================================
  // Album Operations
  // ============================================================================

  const addAlbum = async (album: Omit<Album, "id" | "sortOrder">) => {
    const maxSort = Math.max(0, ...albums.map((a) => a.sortOrder));
    const newAlbum: Album = { ...album, id: generateId(), sortOrder: maxSort + 1 };
    const slug = album.slug || album.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || newAlbum.id;

    // Update local state first
    setAlbums((prev) => [...prev, newAlbum]);

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("portfolio_albums").insert({
            id: newAlbum.id,
            slug,
            name: newAlbum.name,
            couple_name: newAlbum.coupleName,
            category: newAlbum.category,
            cover_image: newAlbum.coverImage,
            gallery_images: newAlbum.images || [],
            location: newAlbum.location,
            story: newAlbum.story,
            event_date: newAlbum.eventDate,
            date: newAlbum.date || new Date().toISOString().split("T")[0],
            is_featured: newAlbum.isFeatured || false,
            is_published: newAlbum.isPublished,
            sort_order: newAlbum.sortOrder,
          });
        } catch (err) {
          console.warn("[AdminContext] Failed to sync new album to Supabase:", err);
        }
      }
    }
  };

  const updateAlbum = async (id: string, updates: Partial<Album>) => {
    // Update local state first
    setAlbums((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          const dbUpdates: Record<string, unknown> = {};
          if (updates.title !== undefined) dbUpdates.title = updates.title;
          if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
          if (updates.name !== undefined) dbUpdates.name = updates.name;
          if (updates.coupleName !== undefined) dbUpdates.couple_name = updates.coupleName;
          if (updates.category !== undefined) dbUpdates.category = updates.category;
          if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage;
          if (updates.galleryImages !== undefined) dbUpdates.gallery_images = updates.galleryImages;
          if (updates.images !== undefined) dbUpdates.gallery_images = updates.images;
          if (updates.location !== undefined) dbUpdates.location = updates.location;
          if (updates.story !== undefined) dbUpdates.story = updates.story;
          if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate;
          if (updates.date !== undefined) dbUpdates.date = updates.date;
          if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
          if (updates.isPublished !== undefined) dbUpdates.is_published = updates.isPublished;
          if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

          await client.from("portfolio_albums").update(dbUpdates).eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to sync updated album to Supabase:", err);
        }
      }
    }
  };

  const deleteAlbum = async (id: string) => {
    // Update local state first
    setAlbums((prev) => prev.filter((a) => a.id !== id));

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          await client.from("portfolio_albums").delete().eq("id", id);
        } catch (err) {
          console.warn("[AdminContext] Failed to delete album from Supabase:", err);
        }
      }
    }
  };

  const reorderAlbums = async (ids: string[]) => {
    // Update local state first
    setAlbums((prev) => {
      const albumMap = new Map(prev.map((a) => [a.id, a]));
      return ids.map((id, index) => {
        const album = albumMap.get(id);
        return album ? { ...album, sortOrder: index + 1 } : null;
      }).filter(Boolean) as Album[];
    });

    // Sync to Supabase
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client) {
        try {
          for (let i = 0; i < ids.length; i++) {
            await client
              .from("portfolio_albums")
              .update({ sort_order: i + 1 })
              .eq("id", ids[i]);
          }
        } catch (err) {
          console.warn("[AdminContext] Failed to sync album order to Supabase:", err);
        }
      }
    }
  };

  // Refresh albums
  const refreshAlbums = async () => {
    await loadAlbums();
  };

  // ============================================================================
  // Album Image Upload Operations
  // ============================================================================

  const uploadAlbumImage = async (
    albumId: string,
    field: "coverImage" | "gallery",
    file: File
  ): Promise<string | null> => {
    // Validate file
    if (!file.type.startsWith("image/")) {
      console.error("[AdminContext] Invalid file type:", file.type);
      return null;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error("[AdminContext] File too large:", file.size);
      return null;
    }

    const uploadKey = `album-${albumId}-${field}-${Date.now()}`;
    setUploadProgress((prev) => ({ ...prev, [uploadKey]: 0 }));

    try {
      let imageUrl: string;

      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          // Upload to Supabase Storage
          const ext = file.name.split(".").pop() || "jpg";
          const path = `albums/${albumId}/${field}_${Date.now()}.${ext}`;

          const { data, error } = await client.storage
            .from("portfolio-media")
            .upload(path, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (error) {
            console.warn("[AdminContext] Storage upload error:", error.message);
            // Fallback to base64
            imageUrl = await fileToBase64(file);
          } else {
            const { data: urlData } = client.storage
              .from("portfolio-media")
              .getPublicUrl(data.path);
            imageUrl = urlData.publicUrl;
          }
        } else {
          imageUrl = await fileToBase64(file);
        }
      } else {
        imageUrl = await fileToBase64(file);
      }

      // Update album state
      const album = albums.find((a) => a.id === albumId);
      if (album) {
        if (field === "coverImage") {
          updateAlbum(albumId, { coverImage: imageUrl });
        } else {
          const newImages = [...(album.images || []), imageUrl];
          updateAlbum(albumId, { images: newImages, galleryImages: newImages });
        }
      }

      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[uploadKey];
        return next;
      });

      return imageUrl;
    } catch (err) {
      console.error("[AdminContext] Upload failed:", err);
      setUploadProgress((prev) => {
        const next = { ...prev };
        delete next[uploadKey];
        return next;
      });
      return null;
    }
  };

  const uploadAlbumImages = async (
    albumId: string,
    files: File[]
  ): Promise<string[]> => {
    const results: string[] = [];
    for (const file of files) {
      const url = await uploadAlbumImage(albumId, "gallery", file);
      if (url) results.push(url);
    }
    return results;
  };

  const deleteAlbumImage = (albumId: string, imageUrl: string) => {
    const album = albums.find((a) => a.id === albumId);
    if (!album) return;

    if (album.coverImage === imageUrl) {
      updateAlbum(albumId, { coverImage: "" });
    } else {
      const newImages = album.images?.filter((img) => img !== imageUrl) || [];
      updateAlbum(albumId, { images: newImages, galleryImages: newImages });
    }
  };

  // Helper: Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // ============================================================================
  // Calendar Operations
  // ============================================================================

  const addCalendarEvent = (event: Omit<CalendarEvent, "id">) => {
    const newEvent: CalendarEvent = { ...event, id: generateId() };
    setCalendarEvents((prev) => [...prev, newEvent]);
  };

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    setCalendarEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
  };

  const deleteCalendarEvent = (id: string) => {
    setCalendarEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // ============================================================================
  // Media Operations
  // ============================================================================

  const addMediaFile = (file: Omit<MediaFile, "id" | "uploadedAt">) => {
    const newFile: MediaFile = {
      ...file,
      id: generateId(),
      uploadedAt: new Date().toISOString(),
    };
    setMediaFiles((prev) => [...prev, newFile]);
  };

  const deleteMediaFile = (id: string) => {
    setMediaFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // ============================================================================
  // Admin Operations
  // ============================================================================

  const addAdmin = async (admin: Omit<AdminUser, "id" | "createdAt" | "lastLogin"> & { temporaryPassword?: string }): Promise<AdminUser> => {
    let newAdmin: AdminUser;

    if (admin.email && admin.temporaryPassword) {
      const created = await createStaffUser({
        name: admin.name,
        email: admin.email,
        temporaryPassword: admin.temporaryPassword,
        role: admin.role,
        position: admin.position,
        phone: admin.phone,
        isActive: admin.isActive,
      } satisfies CreateStaffUserInput);

      newAdmin = {
        id: created.adminUserId || created.id,
        userId: created.userId,
        adminUserId: created.adminUserId,
        employeeId: created.employeeId,
        customerId: created.customerId,
        username: created.username,
        name: created.name,
        email: created.email,
        phone: created.phone,
        role: created.role as AdminRole,
        position: created.position,
        isActive: created.isActive,
        createdAt: created.createdAt,
      };
    } else {
      newAdmin = {
        ...admin,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      delete (newAdmin as AdminUser & { temporaryPassword?: string }).temporaryPassword;
    }

    setAdmins((prev) => {
      const existing = prev.find((item) => item.id === newAdmin.id || item.email === newAdmin.email);
      return existing ? prev.map((item) => (item.id === existing.id ? newAdmin : item)) : [...prev, newAdmin];
    });
    return newAdmin;
  };

  const updateAdmin = async (id: string, updates: Partial<AdminUser>): Promise<void> => {
    const updated = await updateStaffUser(id, {
      name: updates.name,
      email: updates.email,
      phone: updates.phone,
      position: updates.position,
      role: updates.role,
      isActive: updates.isActive,
    });

    setAdmins((prev) => prev.map((a) => (
      a.id === id
        ? {
            ...a,
            id: updated.adminUserId || updated.id,
            userId: updated.userId,
            employeeId: updated.employeeId,
            customerId: updated.customerId,
            username: updated.username,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            role: updated.role as AdminRole,
            position: updated.position,
            isActive: updated.isActive,
          }
        : a
    )));
  };

  const deleteAdmin = async (id: string): Promise<void> => {
    await deactivateStaffUser(id);
    setAdmins((prev) => prev.filter((a) => a.id !== id));
  };

  // ============================================================================
  // Analytics Operations
  // ============================================================================

  const addAnalytics = (data: AnalyticsData) => {
    const existing = analytics.find((a) => a.date === data.date);
    if (existing) {
      setAnalytics((prev) =>
        prev.map((a) =>
          a.date === data.date
            ? { ...a, views: a.views + data.views, bookings: a.bookings + data.bookings, revenue: a.revenue + data.revenue }
            : a
        )
      );
    } else {
      setAnalytics((prev) => [...prev, data]);
    }
  };

  // ============================================================================
  // Stats
  // ============================================================================

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const monthlyBookings = bookings.filter((b) => {
      const date = new Date(b.createdAt);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    });

    return {
      totalBookings: bookings.length,
      pendingBookings: bookings.filter((b) => b.status === "pending" || b.status === "confirmed").length,
      completedBookings: bookings.filter((b) => b.status === "completed").length,
      totalRevenue: bookings.reduce((sum, b) => sum + b.paidAmount, 0),
      monthlyBookings: monthlyBookings.length,
      monthlyRevenue: monthlyBookings.reduce((sum, b) => sum + b.paidAmount, 0),
      pendingPayments: payments.filter((p) => p.status === "pending").length,
    };
  }, [bookings, payments]);

  // ============================================================================
  // Reset
  // ============================================================================

  const resetAll = () => {
    setBookings([]);
    setCustomers([]);
    setPayments([]);
    setPackages([]);
    setCategories(defaultCategories);
    setAddons([]);
    setFaqs([]);
    setAlbums([]);
    setCalendarEvents([]);
    setMediaFiles([]);
    setAdmins(defaultAdmins);
    setAnalytics([]);
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value = useMemo(
    () => ({
      // Bookings
      bookings,
      bookingsLoading,
      bookingsError,
      addBooking,
      updateBooking,
      deleteBooking,
      refreshBookings,
      verifyPayment,
      // Customers
      customers,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      // Payments
      payments,
      paymentsLoading,
      paymentsError,
      addPayment,
      updatePaymentStatus,
      refreshPayments,
      // Packages
      packages,
      packagesLoading,
      packagesError,
      addPackage,
      updatePackage,
      deletePackage,
      addCategory,
      updateCategory,
      deleteCategory,
      refreshPackages,
      // Addons
      addons,
      addonsLoading,
      addonsError,
      addAddon,
      updateAddon,
      deleteAddon,
      refreshAddons,
      // FAQs
      faqs,
      faqsLoading,
      faqsError,
      addFAQ,
      updateFAQ,
      deleteFAQ,
      reorderFAQs,
      refreshFAQs,
      // Albums
      albums,
      albumsLoading,
      albumsError,
      uploadProgress,
      addAlbum,
      updateAlbum,
      deleteAlbum,
      reorderAlbums,
      refreshAlbums,
      uploadAlbumImage,
      uploadAlbumImages,
      deleteAlbumImage,
      // Calendar
      calendarEvents,
      addCalendarEvent,
      updateCalendarEvent,
      deleteCalendarEvent,
      // Media
      mediaFiles,
      addMediaFile,
      deleteMediaFile,
      // Admins
      admins,
      addAdmin,
      updateAdmin,
      deleteAdmin,
      refreshAdmins: loadAdmins,
      // Analytics
      analytics,
      addAnalytics,
      // Stats
      stats,
      // Reset
      resetAll,
    }),
    [
      bookings, bookingsLoading, bookingsError,
      customers, payments, paymentsLoading, paymentsError,
      packages, packagesLoading, packagesError,
      categories, addons, addonsLoading, addonsError,
      faqs, faqsLoading, faqsError,
      albums, albumsLoading, albumsError, uploadProgress,
      calendarEvents, mediaFiles, admins, analytics, stats,
    ]
  );

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}
