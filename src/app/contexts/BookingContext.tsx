import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  Addon,
  DP_AMOUNT,
  PACKING_FEE,
  type PackageItem,
  type ServiceType,
} from "../data/bookingData";
import {
  findCategoryInCatalog,
  findPackageInCatalog,
  findServiceTypeInCatalog,
  getAddonsFromAdmin,
  getPackageCategoriesFromAdmin,
} from "../data/adminPackageCatalog";
import { useAdmin } from "./AdminContext";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabaseClient";

export type SelectedAddon = {
  id: string;
  quantity: number;
};

export type DeliveryMethod = "expedition" | "cod-agent" | "pickup-office" | "";

export type EventData = {
  coupleName: string;
  decorationPlan: string;
  fullAddress: string;
  instagramUsername: string;
  activeWhatsapp: string;
  eventDate: string;
  eventTime: string;
  eventTimePending: boolean;
  eventLocationAddress: string;
  googleMapsLink: string;
  adminNotes: string;
  eventName: string;
  customerName: string;
  whatsapp: string;
  email: string;
  instagram: string;
  location: string;
  mapsLink: string;
  muaPlan: string;
};

export type PaymentData = {
  proofName: string;
};

type BookingContextType = {
  selectedCategoryId: string;
  selectedPackageId: string;
  selectedServiceTypeId: string;
  selectedAddons: SelectedAddon[];
  deliveryMethod: DeliveryMethod;
  eventData: EventData;
  paymentData: PaymentData;
  termsAccepted: boolean;
  reviewAccepted: boolean;
  bookingSubmitted: boolean;
  orderNumber: string;
  accountPendingVerification: boolean;
  isFullyPaid: boolean;
  isCheckoutReady: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  setSelectedCategoryId: (value: string) => void;
  setSelectedPackageId: (value: string) => void;
  setSelectedServiceTypeId: (value: string) => void;
  toggleAddon: (id: string) => void;
  setAddonQuantity: (id: string, quantity: number) => void;
  setDeliveryMethod: (value: DeliveryMethod) => void;
  setEventData: (value: EventData) => void;
  setPaymentData: (value: PaymentData) => void;
  setTermsAccepted: (value: boolean) => void;
  setReviewAccepted: (value: boolean) => void;
  submitBooking: () => Promise<{ success: boolean; orderNumber?: string; error?: string }>;
  uploadPaymentProof: (file: File) => Promise<string | null>;
  calculateSubtotal: () => number;
  calculateRemaining: () => number;
  getSelectedPackage: () => PackageItem | undefined;
  getSelectedServiceType: () => ServiceType | undefined;
  getSelectedAddonDetails: () => Array<{ addon: Addon; quantity: number; total: number }>;
  resetBooking: () => void;
};

const defaultEventData: EventData = {
  coupleName: "",
  decorationPlan: "",
  fullAddress: "",
  instagramUsername: "",
  activeWhatsapp: "",
  eventDate: "",
  eventTime: "",
  eventTimePending: false,
  eventLocationAddress: "",
  googleMapsLink: "",
  adminNotes: "",
  eventName: "",
  customerName: "",
  whatsapp: "",
  email: "",
  instagram: "",
  location: "",
  mapsLink: "",
  muaPlan: "",
};

const defaultPaymentData: PaymentData = {
  proofName: "",
};

const STORAGE_KEY = "danivisual_booking_state_v2";

const BookingContext = createContext<BookingContextType | undefined>(undefined);

function normalizePackageId(value?: string) {
  const legacyMap: Record<string, string> = {
    "wedding-basic": "basic",
    "wedding-premium": "premium",
    "wedding-exclusive": "exclusive",
  };

  return value ? legacyMap[value] || value : "";
}

function normalizeEventData(raw: Partial<EventData> = {}): EventData {
  const coupleName = raw.coupleName || raw.eventName || "";
  const activeWhatsapp = raw.activeWhatsapp || raw.whatsapp || "";
  const instagramUsername = raw.instagramUsername || raw.instagram || "";
  const eventLocationAddress = raw.eventLocationAddress || raw.location || "";
  const googleMapsLink = raw.googleMapsLink || raw.mapsLink || "";

  return {
    ...defaultEventData,
    ...raw,
    coupleName,
    eventName: coupleName,
    customerName: coupleName,
    activeWhatsapp,
    whatsapp: activeWhatsapp,
    instagramUsername,
    instagram: instagramUsername,
    eventLocationAddress,
    location: eventLocationAddress,
    googleMapsLink,
    mapsLink: googleMapsLink,
  };
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const { categories: adminCategories, packages: adminPackages, addons: adminAddons } = useAdmin();
  const packageCatalog = useMemo(
    () => getPackageCategoriesFromAdmin(adminCategories, adminPackages),
    [adminCategories, adminPackages],
  );
  const addonCatalog = useMemo(() => getAddonsFromAdmin(adminAddons), [adminAddons]);
  const [selectedCategoryId, setSelectedCategoryIdState] = useState("wedding");
  const [selectedPackageId, setSelectedPackageIdState] = useState("");
  const [selectedServiceTypeId, setSelectedServiceTypeIdState] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>("");
  const [eventData, setEventDataState] = useState<EventData>(defaultEventData);
  const [paymentData, setPaymentData] = useState<PaymentData>(defaultPaymentData);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [reviewAccepted, setReviewAccepted] = useState(false);
  const [bookingSubmitted, setBookingSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [accountPendingVerification, setAccountPendingVerification] = useState(true);
  const [isFullyPaid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("danivisual_booking_state");
    if (!stored) return;

    try {
      const state = JSON.parse(stored);
      setSelectedCategoryIdState(state.selectedCategoryId || "wedding");
      setSelectedPackageIdState(normalizePackageId(state.selectedPackageId));
      setSelectedServiceTypeIdState(state.selectedServiceTypeId || "");
      setSelectedAddons(state.selectedAddons || []);
      setDeliveryMethod(state.deliveryMethod || "");
      setEventDataState(normalizeEventData(state.eventData || {}));
      setPaymentData({ ...defaultPaymentData, ...(state.paymentData || {}) });
      setTermsAccepted(Boolean(state.termsAccepted));
      setReviewAccepted(Boolean(state.reviewAccepted));
      setBookingSubmitted(Boolean(state.bookingSubmitted));
      setOrderNumber(state.orderNumber || "");
      setAccountPendingVerification(state.accountPendingVerification ?? true);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("danivisual_booking_state");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        selectedCategoryId,
        selectedPackageId,
        selectedServiceTypeId,
        selectedAddons,
        deliveryMethod,
        eventData,
        paymentData,
        termsAccepted,
        reviewAccepted,
        bookingSubmitted,
        orderNumber,
        accountPendingVerification,
      })
    );
  }, [
    selectedCategoryId,
    selectedPackageId,
    selectedServiceTypeId,
    selectedAddons,
    deliveryMethod,
    eventData,
    paymentData,
    termsAccepted,
    reviewAccepted,
    bookingSubmitted,
    orderNumber,
    accountPendingVerification,
  ]);

  const setSelectedCategoryId = (value: string) => {
    const nextCategory = findCategoryInCatalog(packageCatalog, value);
    setSelectedCategoryIdState(nextCategory.id);
    setSelectedPackageIdState("");
    setSelectedServiceTypeIdState("");
    setSelectedAddons([]);
  };

  const setSelectedPackageId = (value: string) => {
    const nextPackage = findPackageInCatalog(packageCatalog, normalizePackageId(value));
    if (!nextPackage) return;
    setSelectedCategoryIdState(nextPackage.categoryId);
    setSelectedPackageIdState(nextPackage.id);
    setSelectedServiceTypeIdState("");
    setSelectedAddons([]);
  };

  const setSelectedServiceTypeId = (value: string) => {
    const selectedPackage = findPackageInCatalog(packageCatalog, selectedPackageId);
    if (!selectedPackage?.serviceTypes.some((service) => service.id === value)) return;
    setSelectedServiceTypeIdState(value);
  };

  const setEventData = (value: EventData) => {
    setEventDataState(normalizeEventData(value));
  };

  const toggleAddon = (id: string) => {
    const addon = addonCatalog.find((item) => item.id === id);
    if (!addon?.categoryIds.includes(selectedCategoryId)) return;

    setSelectedAddons((current) => {
      const exists = current.some((item) => item.id === id);
      if (exists) return current.filter((item) => item.id !== id);
      return [...current, { id, quantity: 1 }];
    });
  };

  const setAddonQuantity = (id: string, quantity: number) => {
    setSelectedAddons((current) =>
      current.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item))
    );
  };

  const getSelectedPackage = () => findPackageInCatalog(packageCatalog, selectedPackageId);
  const getSelectedServiceType = () => findServiceTypeInCatalog(packageCatalog, selectedServiceTypeId);

  const getSelectedAddonDetails = () =>
    selectedAddons
      .map((item) => {
        const addon = addonCatalog.find((addonItem) => addonItem.id === item.id);
        if (!addon) return null;
        return {
          addon,
          quantity: item.quantity,
          total: addon.price * item.quantity,
        };
      })
      .filter(Boolean) as Array<{ addon: Addon; quantity: number; total: number }>;

  const calculateSubtotal = () => {
    const serviceType = getSelectedServiceType();
    const servicePrice = serviceType?.price || 0;
    const addonTotal = getSelectedAddonDetails().reduce((sum, item) => sum + item.total, 0);
    const packingFee = deliveryMethod === "expedition" ? PACKING_FEE : 0;
    return servicePrice + addonTotal + packingFee;
  };

  const calculateRemaining = () => Math.max(0, calculateSubtotal() - DP_AMOUNT);

  const isPreweddingBooking = selectedCategoryId === "prewedding-outdoor" || selectedCategoryId === "prewedding-studio";

  const requiredEventDataValid = isPreweddingBooking
    ? Boolean(eventData.coupleName.trim()) &&
      Boolean(eventData.fullAddress.trim()) &&
      Boolean(eventData.activeWhatsapp.trim()) &&
      Boolean(eventData.instagramUsername.trim()) &&
      Boolean(eventData.eventDate) &&
      Boolean(eventData.eventTime)
    : Boolean(eventData.coupleName.trim()) &&
      Boolean(eventData.activeWhatsapp.trim()) &&
      Boolean(eventData.eventDate) &&
      Boolean(eventData.eventLocationAddress.trim()) &&
      (eventData.eventTimePending || Boolean(eventData.eventTime));

  const isCheckoutReady =
    Boolean(selectedPackageId) &&
    Boolean(selectedServiceTypeId) &&
    requiredEventDataValid &&
    Boolean(deliveryMethod) &&
    Boolean(paymentData.proofName) &&
    termsAccepted;

  // Generate order number
  const generateOrderNumber = () => {
    const date = new Date();
    const dateStr = date.toLocaleDateString("id-ID", { format: "ddMMyy" }).replace(/\//g, "");
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    return `DV-${dateStr}-${random}`;
  };

  // File to base64 for localStorage fallback
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Upload payment proof
  const uploadPaymentProof = async (file: File): Promise<string | null> => {
    try {
      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          const ext = file.name.split(".").pop() || "jpg";
          const path = `payment-proofs/${generateOrderNumber()}_${Date.now()}.${ext}`;

          const { data, error } = await client.storage
            .from("payment-proofs")
            .upload(path, file, { cacheControl: "3600", upsert: false });

          if (error) {
            console.warn("[BookingContext] Storage upload error:", error.message);
            return await fileToBase64(file);
          }

          const { data: urlData } = client.storage
            .from("payment-proofs")
            .getPublicUrl(data.path);
          return urlData.publicUrl;
        }
      }
      // Fallback to base64
      return await fileToBase64(file);
    } catch (err) {
      console.error("[BookingContext] Upload payment proof failed:", err);
      return null;
    }
  };

  // Submit booking to Supabase
  const submitBooking = async (): Promise<{ success: boolean; orderNumber?: string; error?: string }> => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const newOrderNumber = generateOrderNumber();
      const serviceType = getSelectedServiceType();
      const selectedPackage = getSelectedPackage();
      const addonDetails = getSelectedAddonDetails();
      const totalAmount = calculateSubtotal();
      const packingFee = deliveryMethod === "expedition" ? PACKING_FEE : 0;

      // Upload payment proof first
      let proofUrl = "";
      if (paymentData.proofName) {
        // Create a dummy file object from the name (actual file should be uploaded separately)
        // In real app, we'd have the actual File object
        const mockFile = new File([], paymentData.proofName);
        proofUrl = await uploadPaymentProof(mockFile) || "";
      }

      if (isSupabaseConfigured()) {
        const client = getSupabaseClient();
        if (client) {
          // 1. Create or get customer
          let customerId = "";

          // Check if customer exists by phone
          const { data: existingCustomer } = await client
            .from("customers")
            .select("id")
            .eq("phone", eventData.activeWhatsapp)
            .maybeSingle();

          if (existingCustomer) {
            customerId = existingCustomer.id;
          } else {
            // Create new customer
            const { data: newCustomer, error: customerError } = await client
              .from("customers")
              .insert({
                name: eventData.coupleName,
                email: eventData.email || null,
                phone: eventData.activeWhatsapp,
                address: eventData.fullAddress,
                instagram: eventData.instagramUsername,
              })
              .select("id")
              .single();

            if (customerError) {
              throw new Error("Failed to create customer: " + customerError.message);
            }
            customerId = newCustomer.id;
          }

          // 2. Create booking
          const { error: bookingError } = await client
            .from("bookings")
            .insert({
              order_number: newOrderNumber,
              customer_id: customerId,
              customer_name: eventData.coupleName,
              customer_email: eventData.email || null,
              customer_phone: eventData.activeWhatsapp,
              package_id: selectedPackageId,
              package_name: selectedPackage?.name || "",
              package_price: serviceType?.price || 0,
              service_type: serviceType?.name || "",
              addon_ids: selectedAddons.map(a => a.id),
              addon_total: addonDetails.reduce((sum, a) => sum + a.total, 0),
              event_date: eventData.eventDate,
              event_time: eventData.eventTime || null,
              event_location: eventData.eventLocationAddress,
              event_type: selectedCategoryId,
              total_amount: totalAmount,
              dp_amount: DP_AMOUNT,
              paid_amount: 0,
              remaining_amount: totalAmount,
              delivery_method: deliveryMethod,
              packing_fee: packingFee,
              status: "pending",
              notes: eventData.adminNotes || null,
            });

          if (bookingError) {
            throw new Error("Failed to create booking: " + bookingError.message);
          }

          // 3. Create payment record
          if (proofUrl) {
            await client.from("payments").insert({
              booking_order_number: newOrderNumber,
              customer_name: eventData.coupleName,
              amount: DP_AMOUNT,
              method: "transfer",
              status: "pending",
              payment_type: "dp",
              proof_image_url: proofUrl,
            });
          }

          // 4. Create booking event details
          await client.from("booking_event_details").insert({
            couple_name: eventData.coupleName,
            decoration_plan: eventData.decorationPlan || null,
            full_address: eventData.fullAddress,
            google_maps_link: eventData.googleMapsLink || null,
            active_whatsapp: eventData.activeWhatsapp,
            instagram_username: eventData.instagramUsername,
            mua_plan: eventData.muaPlan || null,
            event_time_pending: eventData.eventTimePending,
            admin_notes: eventData.adminNotes || null,
          });

          // Update local state
          setBookingSubmitted(true);
          setAccountPendingVerification(true);
          setOrderNumber(newOrderNumber);
          setIsSubmitting(false);

          return { success: true, orderNumber: newOrderNumber };
        }
      }

      // Fallback: just update local state without Supabase
      setBookingSubmitted(true);
      setAccountPendingVerification(true);
      setOrderNumber(newOrderNumber);
      setIsSubmitting(false);

      return { success: true, orderNumber: newOrderNumber };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("[BookingContext] Submit booking failed:", errorMessage);
      setSubmitError(errorMessage);
      setIsSubmitting(false);
      return { success: false, error: errorMessage };
    }
  };

  // Reset booking
  const resetBooking = () => {
    setSelectedCategoryIdState("wedding");
    setSelectedPackageIdState("");
    setSelectedServiceTypeIdState("");
    setSelectedAddons([]);
    setDeliveryMethod("");
    setEventDataState(defaultEventData);
    setPaymentData(defaultPaymentData);
    setTermsAccepted(false);
    setReviewAccepted(false);
    setBookingSubmitted(false);
    setOrderNumber("");
    setAccountPendingVerification(true);
    setSubmitError(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      selectedCategoryId,
      selectedPackageId,
      selectedServiceTypeId,
      selectedAddons,
      deliveryMethod,
      eventData,
      paymentData,
      termsAccepted,
      reviewAccepted,
      bookingSubmitted,
      orderNumber,
      accountPendingVerification,
      isFullyPaid,
      isCheckoutReady,
      isSubmitting,
      submitError,
      setSelectedCategoryId,
      setSelectedPackageId,
      setSelectedServiceTypeId,
      toggleAddon,
      setAddonQuantity,
      setDeliveryMethod,
      setEventData,
      setPaymentData,
      setTermsAccepted,
      setReviewAccepted,
      submitBooking,
      uploadPaymentProof,
      calculateSubtotal,
      calculateRemaining,
      getSelectedPackage,
      getSelectedServiceType,
      getSelectedAddonDetails,
      resetBooking,
    }),
    [
      selectedCategoryId,
      selectedPackageId,
      selectedServiceTypeId,
      selectedAddons,
      deliveryMethod,
      eventData,
      paymentData,
      termsAccepted,
      reviewAccepted,
      bookingSubmitted,
      orderNumber,
      accountPendingVerification,
      isFullyPaid,
      isCheckoutReady,
      isSubmitting,
      submitError,
    ]
  );

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}
