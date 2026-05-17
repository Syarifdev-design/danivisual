import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import {
  Addon,
  DP_AMOUNT,
  PACKING_FEE,
  findAddon,
  findPackage,
  findServiceType,
} from "../data/bookingData";

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
  submitBooking: () => void;
  calculateSubtotal: () => number;
  calculateRemaining: () => number;
  getSelectedPackage: () => ReturnType<typeof findPackage>;
  getSelectedServiceType: () => ReturnType<typeof findServiceType>;
  getSelectedAddonDetails: () => Array<{ addon: Addon; quantity: number; total: number }>;
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

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("danivisual_booking_state");
    if (!stored) return;

    try {
      const state = JSON.parse(stored);
      setSelectedCategoryIdState("wedding");
      setSelectedPackageIdState(state.selectedPackageId || "");
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

  const setSelectedCategoryId = () => setSelectedCategoryIdState("wedding");

  const setSelectedPackageId = (value: string) => {
    setSelectedPackageIdState(value);
    setSelectedServiceTypeIdState("");
    setSelectedAddons([]);
  };

  const setSelectedServiceTypeId = (value: string) => {
    if (!selectedPackageId) return;
    setSelectedServiceTypeIdState(value);
  };

  const setEventData = (value: EventData) => {
    setEventDataState(normalizeEventData(value));
  };

  const toggleAddon = (id: string) => {
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

  const getSelectedPackage = () => findPackage(selectedPackageId);
  const getSelectedServiceType = () => findServiceType(selectedServiceTypeId);

  const getSelectedAddonDetails = () =>
    selectedAddons
      .map((item) => {
        const addon = findAddon(item.id);
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

  const requiredEventDataValid =
    Boolean(eventData.coupleName.trim()) &&
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

  const submitBooking = () => {
    setBookingSubmitted(true);
    setAccountPendingVerification(true);
    setOrderNumber((current) => current || `#DV-${Date.now().toString().slice(-8)}`);
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
      calculateSubtotal,
      calculateRemaining,
      getSelectedPackage,
      getSelectedServiceType,
      getSelectedAddonDetails,
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
