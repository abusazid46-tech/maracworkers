"use client";

import { ApiClientError, createApiClient } from "@the-wings/api-client";
import type {
  AdminDashboard,
  AdminReport,
  AdminReportFilters,
  AdminReportPeriod,
  AdminReportRow,
  AuthSession,
  AuthUser,
  Booking,
  BookingStatus,
  CrmNote,
  CustomerSummary,
  Lead,
  LeadStatus,
  OfferBanner,
  OfferBannerCreateInput,
  PaymentMode,
  PaymentStatus,
  Service,
  ServiceCategory,
  ServiceCreateInput
} from "@the-wings/types";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { normalizeServiceIconKey, resolveServiceIconKey, ServiceIcon, serviceIconOptions } from "./ServiceIcon";

type TabId = "dashboard" | "bookings" | "reports" | "services" | "offers" | "customers" | "leads" | "whatsapp";
type DataMode = "loading" | "live" | "demo";
type AuthMode = "checking" | "unauthenticated" | "forbidden" | "authenticated";
type LiveStatus = "idle" | "connecting" | "connected" | "syncing" | "reconnecting" | "offline";
type ActivityTone = "info" | "success" | "warning" | "danger";
type ActivityEvent = {
  id: string;
  title: string;
  detail: string;
  at: string;
  tone: ActivityTone;
};
type AlertToast = {
  id: string;
  title: string;
  detail: string;
  at: string;
};
type AdminEventSnapshot = {
  revision: string;
  timestamp: string;
  metrics: {
    bookingCount: number;
    pendingBookings: number;
    activeServices: number;
    openLeads: number;
  };
  latest: {
    booking: {
      bookingCode: string;
      customerName: string;
      status: BookingStatus;
      totalAmount: number;
      updatedAt: string;
    } | null;
    lead: {
      id: string;
      name?: string | null;
      phone: string;
      status: LeadStatus;
      updatedAt: string;
    } | null;
    service: {
      id: string;
      name: string;
      isActive: boolean;
      updatedAt: string;
    } | null;
  };
};

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
    renderButton: (element: HTMLElement, options: Record<string, string | number | boolean>) => void;
  };
};

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const adminAlertsStorageKey = "twg_admin_alerts_enabled";

type ServiceForm = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  imageUrl: string;
  basePrice: string;
  groupLabel: string;
  priceLabel: string;
  originalPrice: string;
  originalPriceLabel: string;
  discountLabel: string;
  durationMin: string;
  isActive: boolean;
};

type LeadForm = {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  notes: string;
};

type NoteForm = {
  title: string;
  body: string;
};

type OfferForm = {
  id: string;
  title: string;
  subtitle: string;
  serviceId: string;
  categoryId: string;
  imageUrl: string;
  ctaLabel: string;
  offerPrice: string;
  originalPrice: string;
  discountText: string;
  sortOrder: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

const bookingStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"];
const leadStatuses: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];
const paymentStatuses: PaymentStatus[] = ["PENDING", "PAID", "FAILED", "REFUNDED"];
const paymentModes: PaymentMode[] = ["COD", "RAZORPAY", "STRIPE"];
const reportPeriods: Array<{ value: AdminReportPeriod; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom" }
];
const initialReportFilters: AdminReportFilters = {
  period: "monthly",
  status: "ALL",
  paymentStatus: "ALL",
  paymentMode: "ALL",
  search: ""
};

const fallbackCategories: ServiceCategory[] = [
  { id: "toilet-bath", name: "Toilet & Bath", slug: "toilet-bath", sortOrder: 1, isActive: true },
  { id: "tank-wash", name: "Tank Wash", slug: "tank-wash", sortOrder: 2, isActive: true },
  { id: "ac-repair", name: "AC & Repair", slug: "ac-repair", sortOrder: 3, isActive: true },
  { id: "sofa-clean", name: "Sofa Clean", slug: "sofa-clean", sortOrder: 4, isActive: true },
  { id: "deep-clean", name: "Deep Clean", slug: "deep-clean", sortOrder: 5, isActive: true },
  { id: "kitchen-appliances", name: "Kitchen & Appliances", slug: "kitchen-appliances", sortOrder: 6, isActive: true },
  { id: "aya-housemaid", name: "Aya and Housemaid", slug: "aya-housemaid", sortOrder: 7, isActive: true },
  { id: "pest-control", name: "Pest Control", slug: "pest-control", sortOrder: 8, isActive: true },
  { id: "painter-plumber", name: "Painter & Plumber", slug: "painter-plumber", sortOrder: 9, isActive: true },
  { id: "saloon-spa", name: "Saloon & Spa", slug: "saloon-spa", sortOrder: 10, isActive: true },
  { id: "security", name: "Security", slug: "security", sortOrder: 11, isActive: true }
];

const fallbackServices: Service[] = [
  {
    id: "svc-1",
    categoryId: "toilet-bath",
    name: "Bathroom Deep Cleaning",
    slug: "bathroom-deep-cleaning",
    description: "Tiles, sink, toilet, mirror, fixtures, and floor sanitization.",
    icon: "bathroom",
    basePrice: 299,
    durationMin: 90,
    sortOrder: 1,
    isActive: true
  },
  {
    id: "svc-2",
    categoryId: "ac-repair",
    name: "AC Regular Servicing",
    slug: "ac-regular-servicing",
    description: "Filter cleaning, coil wash, drainage check, and basic cooling inspection.",
    icon: "ac",
    basePrice: 499,
    durationMin: 60,
    sortOrder: 2,
    isActive: true
  },
  {
    id: "svc-3",
    categoryId: "deep-clean",
    name: "Deep Home Cleaning - 2BHK",
    slug: "deep-home-cleaning-2bhk",
    description: "Full 2BHK home cleaning with bathrooms, kitchen, rooms, corridor, and fans.",
    icon: "home",
    basePrice: 2299,
    durationMin: 360,
    sortOrder: 3,
    isActive: true
  }
];

const fallbackBookings: Booking[] = [
  {
    id: "bk-1",
    bookingCode: "TWG-260517-A104",
    customerName: "Rahul Deb",
    customerPhone: "9774887803",
    addressLine: "Post Office Chowmuhani, Agartala",
    city: "Agartala",
    preferredDate: "2026-05-17T09:00:00.000Z",
    preferredTimeSlot: "9:00 AM - 11:00 AM",
    notes: "Call before arriving.",
    status: "CONFIRMED",
    paymentMode: "COD",
    totalAmount: 2299,
    createdAt: "2026-05-17T03:20:00.000Z",
    updatedAt: "2026-05-17T03:20:00.000Z",
    items: [{ id: "bki-1", serviceName: "Deep Home Cleaning - 2BHK", quantity: 1, unitPrice: 2299, lineTotal: 2299 }],
    payments: []
  },
  {
    id: "bk-2",
    bookingCode: "TWG-260517-A105",
    customerName: "Madhumita Saha",
    customerPhone: "9876543210",
    addressLine: "HGB Road, Agartala",
    city: "Agartala",
    preferredDate: "2026-05-17T15:00:00.000Z",
    preferredTimeSlot: "3:00 PM - 5:00 PM",
    notes: null,
    status: "PENDING",
    paymentMode: "COD",
    totalAmount: 499,
    createdAt: "2026-05-17T04:15:00.000Z",
    updatedAt: "2026-05-17T04:15:00.000Z",
    items: [{ id: "bki-2", serviceName: "AC Regular Servicing", quantity: 1, unitPrice: 499, lineTotal: 499 }],
    payments: []
  }
];

const fallbackLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Apartment Welfare Committee",
    phone: "9123456789",
    email: "committee@example.com",
    source: "Website",
    status: "QUALIFIED",
    notes: "Interested in monthly deep cleaning plan for 20 flats.",
    createdAt: "2026-05-16T08:00:00.000Z",
    updatedAt: "2026-05-17T08:00:00.000Z"
  },
  {
    id: "lead-2",
    name: "Mitali Roy",
    phone: "9988776655",
    email: null,
    source: "WhatsApp",
    status: "NEW",
    notes: "Asked for sofa cleaning and bathroom cleaning package.",
    createdAt: "2026-05-17T07:00:00.000Z",
    updatedAt: "2026-05-17T07:00:00.000Z"
  }
];

const fallbackCustomers: CustomerSummary[] = [
  {
    name: "Rahul Deb",
    phone: "9774887803",
    bookingsCount: 4,
    totalSpend: 7496,
    lastBookingAt: "2026-05-17T03:20:00.000Z",
    lastService: "Deep Home Cleaning - 2BHK",
    city: "Agartala",
    status: "CONFIRMED"
  },
  {
    name: "Madhumita Saha",
    phone: "9876543210",
    bookingsCount: 1,
    totalSpend: 499,
    lastBookingAt: "2026-05-17T04:15:00.000Z",
    lastService: "AC Regular Servicing",
    city: "Agartala",
    status: "PENDING"
  }
];

const fallbackNotes: CrmNote[] = [
  {
    id: "note-1",
    title: "Follow up for society plan",
    body: "Send proposal for monthly bathroom and common-area cleaning.",
    createdAt: "2026-05-17T08:00:00.000Z"
  }
];

const fallbackDashboard: AdminDashboard = {
  metrics: {
    todayBookings: fallbackBookings.length,
    pendingBookings: fallbackBookings.filter((booking) => ["PENDING", "CONFIRMED", "ASSIGNED"].includes(booking.status)).length,
    monthRevenue: fallbackBookings.reduce((sum, booking) => sum + booking.totalAmount, 0),
    activeServices: fallbackServices.filter((service) => service.isActive).length,
    openLeads: fallbackLeads.filter((lead) => ["NEW", "CONTACTED", "QUALIFIED"].includes(lead.status)).length,
    customers: fallbackCustomers.length
  },
  recentBookings: fallbackBookings,
  hotLeads: fallbackLeads,
  customers: fallbackCustomers
};

const initialServiceForm: ServiceForm = {
  id: "",
  categoryId: fallbackCategories[0]?.id ?? "",
  name: "",
  slug: "",
  description: "",
  icon: "cleaning",
  imageUrl: "",
  basePrice: "",
  groupLabel: "",
  priceLabel: "",
  originalPrice: "",
  originalPriceLabel: "",
  discountLabel: "",
  durationMin: "",
  isActive: true
};

const initialOfferForm: OfferForm = {
  id: "",
  title: "",
  subtitle: "",
  serviceId: "",
  categoryId: "",
  imageUrl: "",
  ctaLabel: "Book now",
  offerPrice: "",
  originalPrice: "",
  discountText: "",
  sortOrder: "0",
  startsAt: "",
  endsAt: "",
  isActive: true
};

const initialLeadForm: LeadForm = {
  id: "",
  name: "",
  phone: "",
  email: "",
  source: "Website",
  status: "NEW",
  notes: ""
};

export function AdminCrmDashboard() {
  const [authMode, setAuthMode] = useState<AuthMode>("checking");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [mode, setMode] = useState<DataMode>("loading");
  const [notice, setNotice] = useState("Loading admin CRM...");
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [alertToast, setAlertToast] = useState<AlertToast | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [dashboard, setDashboard] = useState<AdminDashboard>(fallbackDashboard);
  const [bookings, setBookings] = useState<Booking[]>(fallbackBookings);
  const [services, setServices] = useState<Service[]>(fallbackServices);
  const [categories, setCategories] = useState<ServiceCategory[]>(fallbackCategories);
  const [customers, setCustomers] = useState<CustomerSummary[]>(fallbackCustomers);
  const [leads, setLeads] = useState<Lead[]>(fallbackLeads);
  const [offers, setOffers] = useState<OfferBanner[]>([]);
  const [notes, setNotes] = useState<CrmNote[]>(fallbackNotes);
  const [report, setReport] = useState<AdminReport | null>(null);
  const [reportFilters, setReportFilters] = useState<AdminReportFilters>(initialReportFilters);
  const [reportLoading, setReportLoading] = useState(false);
  const [serviceForm, setServiceForm] = useState<ServiceForm>(initialServiceForm);
  const [offerForm, setOfferForm] = useState<OfferForm>(initialOfferForm);
  const [leadForm, setLeadForm] = useState<LeadForm>(initialLeadForm);
  const [noteForm, setNoteForm] = useState<NoteForm>({ title: "", body: "" });
  const [query, setQuery] = useState("");
  const serviceEditorRef = useRef<HTMLElement | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastBookingCountRef = useRef<number | null>(null);
  const alertToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pushActivity = useCallback((event: Omit<ActivityEvent, "id" | "at"> & { at?: string }) => {
    const entry: ActivityEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      at: event.at ?? new Date().toISOString(),
      title: event.title,
      detail: event.detail,
      tone: event.tone
    };

    setActivityEvents((current) => [entry, ...current].slice(0, 12));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAlertsEnabled(window.localStorage.getItem(adminAlertsStorageKey) === "true");
    setNotificationPermission("Notification" in window ? window.Notification.permission : "unsupported");

    return () => {
      if (alertToastTimerRef.current) clearTimeout(alertToastTimerRef.current);
      if (alertAudioRef.current) alertAudioRef.current.pause();
    };
  }, []);

  async function enableAdminAlerts() {
    await playBookingAlertSound(alertAudioRef, 0.35);
    window.localStorage.setItem(adminAlertsStorageKey, "true");
    setAlertsEnabled(true);

    if ("Notification" in window && window.Notification.permission === "default") {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
    } else {
      setNotificationPermission("Notification" in window ? window.Notification.permission : "unsupported");
    }

    setAlertToast({
      id: `alerts-enabled-${Date.now()}`,
      title: "Booking alerts enabled",
      detail: "This admin browser will ring when a new booking arrives.",
      at: new Date().toISOString()
    });
    scheduleAlertToastDismiss();
  }

  function disableAdminAlerts() {
    window.localStorage.removeItem(adminAlertsStorageKey);
    setAlertsEnabled(false);
    setAlertToast({
      id: `alerts-disabled-${Date.now()}`,
      title: "Booking alerts muted",
      detail: "New bookings will still appear in the live feed.",
      at: new Date().toISOString()
    });
    scheduleAlertToastDismiss();
  }

  const scheduleAlertToastDismiss = useCallback(() => {
    if (alertToastTimerRef.current) clearTimeout(alertToastTimerRef.current);
    alertToastTimerRef.current = setTimeout(() => setAlertToast(null), 6500);
  }, []);

  const triggerNewBookingAlert = useCallback((snapshot: AdminEventSnapshot) => {
    const booking = snapshot.latest.booking;
    const title = "New booking received";
    const detail = booking
      ? `${booking.bookingCode} from ${booking.customerName} - Rs. ${booking.totalAmount.toLocaleString()}`
      : "A new booking arrived in the admin CRM.";

    setAlertToast({
      id: `booking-alert-${snapshot.revision}`,
      title,
      detail,
      at: snapshot.timestamp
    });
    scheduleAlertToastDismiss();
    pushActivity({ title, detail, tone: "success", at: snapshot.timestamp });

    if (!alertsEnabled) return;
    void playBookingAlertSound(alertAudioRef, 1).catch((error) => {
      adminConsole("warn", "Admin alert sound could not play", error);
    });

    if (typeof window !== "undefined" && "Notification" in window && window.Notification.permission === "granted") {
      new window.Notification(title, {
        body: detail,
        icon: "/the-wings-logo.png",
        tag: booking?.bookingCode ?? snapshot.revision
      });
    }
  }, [alertsEnabled, pushActivity, scheduleAlertToastDismiss]);

  const loadAdminData = useCallback(async (reason = "manual") => {
    try {
      const api = createApiClient();
      const [dashboardRes, bookingsRes, servicesRes, categoriesRes, customersRes, leadsRes, offersRes, notesRes] = await Promise.all([
        api.getAdminDashboard(),
        api.getBookings(),
        api.getServices({ includeInactive: true }),
        api.getServiceCategories(),
        api.getCustomers(),
        api.getLeads(),
        api.getOfferBanners().catch(() => ({ data: [] as OfferBanner[] })),
        api.getCrmNotes()
      ]);

      setDashboard(dashboardRes.data);
      setBookings(bookingsRes.data);
      setServices(servicesRes.data);
      const nextCategories = categoriesRes.data.length > 0 ? categoriesRes.data : fallbackCategories;
      setCategories(nextCategories);
      setServiceForm((current) =>
        nextCategories.some((category) => category.id === current.categoryId)
          ? current
          : { ...current, categoryId: nextCategories[0]?.id ?? current.categoryId }
      );
      setCustomers(customersRes.data);
      setLeads(leadsRes.data);
      setOffers(offersRes.data);
      setNotes(notesRes.data);
      setMode("live");
      setLastSyncedAt(new Date().toISOString());
      setNotice(reason === "event-stream" ? "Live update received. CRM data refreshed." : "Connected to backend API.");
      adminConsole("info", "Admin CRM data loaded", {
        reason,
        bookings: bookingsRes.data.length,
        services: servicesRes.data.length,
        offers: offersRes.data.length,
        leads: leadsRes.data.length
      });
      return true;
    } catch (error) {
      setMode("loading");
      setNotice(`Live CRM data could not be loaded. ${getApiErrorMessage(error)}`);
      adminConsole("error", "Admin CRM data load failed", error);
      return false;
    }
  }, []);

  const loadReportData = useCallback(async (filters = reportFilters) => {
    setReportLoading(true);
    try {
      const response = await createApiClient().getAdminReport(filters);
      setReport(response.data);
      setMode("live");
      setNotice("Report loaded from backend.");
      adminConsole("info", "Admin report loaded", {
        filters: response.data.filters,
        rows: response.data.rows.length,
        metrics: response.data.metrics
      });
    } catch (error) {
      const fallbackReport = buildLocalReport(bookings, filters);
      setReport(fallbackReport);
      setMode("loading");
      setNotice(`Report backend unavailable. Showing report from currently loaded bookings. ${getApiErrorMessage(error)}`);
      pushActivity({
        title: "Report loaded from local data",
        detail: "Backend report endpoint was not reachable, so the report used loaded booking data.",
        tone: "warning"
      });
      adminConsole("error", "Admin report load failed", error);
    } finally {
      setReportLoading(false);
    }
  }, [bookings, pushActivity, reportFilters]);

  useEffect(() => {
    let mounted = true;

    async function restoreAdminSession() {
      try {
        const response = await createApiClient().getMe();
        if (!mounted) return;
        if (!isAdminUser(response.data)) {
          setAuthMode("forbidden");
          setAuthUser(response.data);
          return;
        }

        setAuthUser(response.data);
        setAuthMode("authenticated");
      } catch {
        if (!mounted) return;
        setAuthMode("unauthenticated");
        setAuthUser(null);
      }
    }

    restoreAdminSession();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (authMode !== "authenticated") return;
    let mounted = true;

    loadAdminData("initial").then((ok) => {
      if (!mounted || !ok) return;
      pushActivity({
        title: "CRM data connected",
        detail: "Bookings, services, customers, leads, and notes are loaded from the backend.",
        tone: "success"
      });
    });
    return () => {
      mounted = false;
    };
  }, [authMode, loadAdminData, pushActivity]);

  useEffect(() => {
    if (authMode !== "authenticated") return;
    void loadReportData(initialReportFilters);
  }, [authMode]);

  useEffect(() => {
    if (authMode !== "authenticated") return;

    const api = createApiClient();
    const source = new EventSource(api.getAdminEventsUrl(), { withCredentials: true });
    let currentRevision = "";
    let reconnectNoticeShown = false;

    setLiveStatus("connecting");
    adminConsole("info", "Opening admin event stream", { url: api.getAdminEventsUrl() });

    source.addEventListener("connected", (event) => {
      const snapshot = parseAdminEventSnapshot(event);
      if (!snapshot) return;
      currentRevision = snapshot.revision;
      lastBookingCountRef.current = snapshot.metrics.bookingCount;
      reconnectNoticeShown = false;
      setLiveStatus("connected");
      setLastSyncedAt(snapshot.timestamp);
      pushActivity({
        title: "Live event stream connected",
        detail: summarizeAdminSnapshot(snapshot),
        tone: "success",
        at: snapshot.timestamp
      });
      adminConsole("info", "Admin event stream connected", snapshot);
    });

    source.addEventListener("admin:update", (event) => {
      const snapshot = parseAdminEventSnapshot(event);
      if (!snapshot || snapshot.revision === currentRevision) return;
      const previousBookingCount = lastBookingCountRef.current;
      currentRevision = snapshot.revision;
      lastBookingCountRef.current = snapshot.metrics.bookingCount;
      reconnectNoticeShown = false;
      setLiveStatus("syncing");
      setLastSyncedAt(snapshot.timestamp);
      if (previousBookingCount !== null && snapshot.metrics.bookingCount > previousBookingCount) {
        triggerNewBookingAlert(snapshot);
      }
      pushActivity({
        title: "Live CRM update received",
        detail: summarizeAdminSnapshot(snapshot),
        tone: "info",
        at: snapshot.timestamp
      });
      adminConsole("info", "Admin live update received", snapshot);
      loadAdminData("event-stream").then(() => setLiveStatus("connected"));
    });

    source.addEventListener("heartbeat", (event) => {
      const heartbeat = parseAdminHeartbeat(event);
      if (!heartbeat) return;
      setLastSyncedAt(heartbeat.timestamp);
      if (source.readyState === EventSource.OPEN) setLiveStatus("connected");
    });

    source.addEventListener("admin:error", (event) => {
      const heartbeat = parseAdminHeartbeat(event);
      setLiveStatus("reconnecting");
      pushActivity({
        title: "Live stream backend warning",
        detail: "The API event stream reported a polling error and will retry automatically.",
        tone: "warning",
        at: heartbeat?.timestamp
      });
      adminConsole("warn", "Admin event stream backend warning", event);
    });

    source.onerror = (error) => {
      setLiveStatus("reconnecting");
      adminConsole("warn", "Admin event stream interrupted. Browser will retry automatically.", error);
      if (!reconnectNoticeShown) {
        reconnectNoticeShown = true;
        pushActivity({
          title: "Live connection interrupted",
          detail: "The browser is reconnecting to the admin event stream.",
          tone: "warning"
        });
      }
    };

    return () => {
      source.close();
      setLiveStatus("offline");
      adminConsole("info", "Admin event stream closed");
    };
  }, [authMode, loadAdminData, pushActivity, triggerNewBookingAlert]);

  const filteredBookings = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return bookings;
    return bookings.filter((booking) =>
      [booking.bookingCode, booking.customerName, booking.customerPhone, booking.city, booking.status]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [bookings, query]);

  const filteredCustomers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return customers;
    return customers.filter((customer) => [customer.name, customer.phone, customer.city, customer.lastService].join(" ").toLowerCase().includes(value));
  }, [customers, query]);

  const filteredLeads = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return leads;
    return leads.filter((lead) => [lead.name, lead.phone, lead.email, lead.source, lead.status].join(" ").toLowerCase().includes(value));
  }, [leads, query]);

  const filteredOffers = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return offers;
    return offers.filter((offer) =>
      [offer.title, offer.subtitle, offer.discountText, offer.service?.name, offer.category?.name, offer.isActive ? "active" : "inactive"]
        .join(" ")
        .toLowerCase()
        .includes(value)
    );
  }, [offers, query]);

  function setServiceField(field: keyof ServiceForm, value: string | boolean) {
    setServiceForm((current) => ({
      ...current,
      [field]: value,
      slug: field === "name" && !current.id ? slugify(String(value)) : current.slug
    }));
  }

  function setLeadField(field: keyof LeadForm, value: string) {
    setLeadForm((current) => ({ ...current, [field]: value }));
  }

  function setOfferField(field: keyof OfferForm, value: string | boolean) {
    setOfferForm((current) => ({ ...current, [field]: value }));
  }

  function setReportFilter(field: keyof AdminReportFilters, value: string) {
    setReportFilters((current) => {
      const next = { ...current, [field]: value };
      if (field === "period" && value !== "custom") {
        next.dateFrom = "";
        next.dateTo = "";
      }
      return next;
    });
  }

  function applyReportFilters() {
    void loadReportData(reportFilters);
  }

  function resetReportFilters() {
    setReportFilters(initialReportFilters);
    void loadReportData(initialReportFilters);
  }

  function exportReport(format: "csv" | "xls") {
    if (!report) return;
    const rows = buildReportExportRows(report.rows);
    const filename = `marac-workers-report-${report.filters.period}-${new Date().toISOString().slice(0, 10)}`;
    downloadTextFile(`${filename}.csv`, toCsv(rows), "text/csv;charset=utf-8");
    downloadTextFile(`${filename}.xls`, toExcelTable(rows, "Marac Workers Report"), "application/vnd.ms-excel;charset=utf-8");
  }

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const categoryId = categories.some((category) => category.id === serviceForm.categoryId)
      ? serviceForm.categoryId
      : categories[0]?.id || fallbackCategories[0]?.id || "";
    const basePrice = parseAdminInteger(serviceForm.basePrice);
    const originalPrice = serviceForm.originalPrice.trim() ? parseAdminInteger(serviceForm.originalPrice) : serviceForm.id ? null : undefined;
    const durationMin = serviceForm.durationMin.trim() === "" ? undefined : parseAdminInteger(serviceForm.durationMin);
    const optionalText = (value: string) => value.trim() || (serviceForm.id ? null : undefined);
    const payload: ServiceCreateInput = {
      categoryId,
      name: serviceForm.name.trim(),
      slug: serviceForm.slug.trim() || slugify(serviceForm.name),
      description: serviceForm.description.trim() || `${serviceForm.name.trim()} service by Marac Workers.`,
      icon: normalizeServiceIconKey(serviceForm.icon),
      imageUrl: serviceForm.imageUrl.trim() || undefined,
      basePrice,
      groupLabel: optionalText(serviceForm.groupLabel),
      priceLabel: optionalText(serviceForm.priceLabel),
      originalPrice,
      originalPriceLabel: optionalText(serviceForm.originalPriceLabel),
      discountLabel: optionalText(serviceForm.discountLabel),
      durationMin,
      isActive: serviceForm.isActive
    };

    const serviceError = validateServicePayload(payload);
    if (serviceError) {
      setNotice(serviceError);
      return;
    }

    try {
      const api = createApiClient();
      adminConsole("info", "Saving service payload", payload);
      const response = serviceForm.id ? await api.updateService(serviceForm.id, payload) : await api.createService(payload);
      upsertService(response.data);
      await loadAdminData("service-save");
      setMode("live");
      setNotice(serviceForm.id ? "Service updated." : "Service created.");
      pushActivity({
        title: serviceForm.id ? "Service updated" : "Service created",
        detail: `${response.data.name} is ${response.data.isActive ? "active" : "inactive"} at Rs. ${response.data.basePrice.toLocaleString()}.`,
        tone: "success"
      });
      adminConsole("info", serviceForm.id ? "Service updated" : "Service created", response.data);
    } catch (error) {
      setMode("loading");
      setNotice(`Service was not saved. ${getApiErrorMessage(error)}`);
      adminConsole("error", "Service save failed", error);
      return;
    }

    setServiceForm({ ...initialServiceForm, categoryId });
  }

  async function deleteService(service: Service) {
    try {
      const response = await createApiClient().deleteService(service.id);
      upsertService(response.data);
      setMode("live");
      setNotice("Service disabled.");
      pushActivity({
        title: "Service disabled",
        detail: `${service.name} is now hidden from customer browsing.`,
        tone: "warning"
      });
      adminConsole("warn", "Service disabled", response.data);
    } catch (error) {
      setMode("loading");
      setNotice(`Service was not disabled. ${getApiErrorMessage(error)}`);
      adminConsole("error", "Service disable failed", error);
    }
  }

  function editService(service: Service) {
    const searchableText = [service.name, service.description].filter(Boolean).join(" ");
    const icon = resolveServiceIconKey(service.icon, searchableText);
    setServiceForm({
      id: service.id,
      categoryId: service.categoryId,
      name: service.name,
      slug: service.slug,
      description: service.description,
      icon,
      imageUrl: service.imageUrl ?? "",
      basePrice: String(service.basePrice),
      groupLabel: service.groupLabel ?? "",
      priceLabel: service.priceLabel ?? "",
      originalPrice: service.originalPrice != null ? String(service.originalPrice) : "",
      originalPriceLabel: service.originalPriceLabel ?? "",
      discountLabel: service.discountLabel ?? "",
      durationMin: service.durationMin ? String(service.durationMin) : "",
      isActive: service.isActive
    });
    setActiveTab("services");
    setNotice(`Editing ${service.name}. Update the fields and click Update Service.`);
    pushActivity({
      title: "Service edit mode opened",
      detail: `${service.name} is loaded in the service editor.`,
      tone: "info"
    });
    window.requestAnimationFrame(() => {
      serviceEditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function upsertService(service: Service) {
    setServices((current) => {
      const exists = current.some((item) => item.id === service.id);
      return exists ? current.map((item) => (item.id === service.id ? service : item)) : [service, ...current];
    });
  }

  async function saveOffer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const offerPrice = parseOptionalAdminInteger(offerForm.offerPrice);
    const originalPrice = parseOptionalAdminInteger(offerForm.originalPrice);
    const sortOrder = parseOptionalAdminInteger(offerForm.sortOrder);
    const payload: OfferBannerCreateInput = {
      title: offerForm.title.trim(),
      subtitle: offerForm.subtitle.trim() || null,
      serviceId: offerForm.serviceId || null,
      categoryId: offerForm.categoryId || null,
      imageUrl: offerForm.imageUrl.trim() || null,
      ctaLabel: offerForm.ctaLabel.trim() || "Book now",
      offerPrice: offerPrice ?? null,
      originalPrice: originalPrice ?? null,
      discountText: offerForm.discountText.trim() || null,
      sortOrder: sortOrder ?? 0,
      startsAt: offerForm.startsAt ? new Date(offerForm.startsAt).toISOString() : null,
      endsAt: offerForm.endsAt ? new Date(offerForm.endsAt).toISOString() : null,
      isActive: offerForm.isActive
    };
    const offerError = validateOfferPayload(payload, { offerPrice, originalPrice, sortOrder });
    if (offerError) {
      setNotice(offerError);
      return;
    }

    try {
      const api = createApiClient();
      adminConsole("info", "Saving offer payload", payload);
      const response = offerForm.id ? await api.updateOfferBanner(offerForm.id, payload) : await api.createOfferBanner(payload);
      upsertOffer(response.data);
      await loadAdminData("offer-save");
      setMode("live");
      setNotice(offerForm.id ? "Offer banner updated." : "Offer banner created.");
      pushActivity({
        title: offerForm.id ? "Offer updated" : "Offer created",
        detail: `${response.data.title} is ${response.data.isActive ? "active" : "inactive"} on the customer website.`,
        tone: "success"
      });
      adminConsole("info", offerForm.id ? "Offer updated" : "Offer created", response.data);
    } catch (error) {
      setMode("loading");
      setNotice(`Offer was not saved. ${getApiErrorMessage(error)}`);
      pushActivity({
        title: "Offer save failed",
        detail: getApiErrorMessage(error),
        tone: "danger"
      });
      adminConsole("error", "Offer save failed", error);
      return;
    }

    setOfferForm(initialOfferForm);
  }

  function editOffer(offer: OfferBanner) {
    setOfferForm({
      id: offer.id,
      title: offer.title,
      subtitle: offer.subtitle ?? "",
      serviceId: offer.serviceId ?? "",
      categoryId: offer.categoryId ?? "",
      imageUrl: offer.imageUrl ?? "",
      ctaLabel: offer.ctaLabel,
      offerPrice: offer.offerPrice != null ? String(offer.offerPrice) : "",
      originalPrice: offer.originalPrice != null ? String(offer.originalPrice) : "",
      discountText: offer.discountText ?? "",
      sortOrder: String(offer.sortOrder ?? 0),
      startsAt: toDateTimeLocalValue(offer.startsAt),
      endsAt: toDateTimeLocalValue(offer.endsAt),
      isActive: offer.isActive
    });
    setActiveTab("offers");
    setNotice(`Editing offer ${offer.title}.`);
    pushActivity({
      title: "Offer edit mode opened",
      detail: `${offer.title} is loaded in the offer editor.`,
      tone: "info"
    });
  }

  async function deleteOffer(offer: OfferBanner) {
    try {
      const response = await createApiClient().deleteOfferBanner(offer.id);
      upsertOffer(response.data);
      setMode("live");
      setNotice("Offer banner disabled.");
      pushActivity({
        title: "Offer disabled",
        detail: `${offer.title} is now hidden from the customer website.`,
        tone: "warning"
      });
      adminConsole("warn", "Offer disabled", response.data);
    } catch (error) {
      setMode("loading");
      setNotice(`Offer was not disabled. ${getApiErrorMessage(error)}`);
      pushActivity({
        title: "Offer disable failed",
        detail: getApiErrorMessage(error),
        tone: "danger"
      });
      adminConsole("error", "Offer disable failed", error);
    }
  }

  function upsertOffer(offer: OfferBanner) {
    setOffers((current) => {
      const exists = current.some((item) => item.id === offer.id);
      return exists ? current.map((item) => (item.id === offer.id ? offer : item)) : [offer, ...current];
    });
  }

  async function updateBookingStatus(booking: Booking, status: BookingStatus) {
    try {
      const response = await createApiClient().updateBookingStatus(booking.bookingCode, {
        status,
        note: `Admin changed status to ${status}`
      });
      replaceBooking(response.data);
      setMode("live");
      setNotice(`Booking ${booking.bookingCode} moved to ${status}.`);
      pushActivity({
        title: "Booking status changed",
        detail: `${booking.bookingCode} moved to ${status}.`,
        tone: "info"
      });
      adminConsole("info", "Booking status changed", response.data);
    } catch {
      replaceBooking({ ...booking, status, updatedAt: new Date().toISOString() });
      setMode("demo");
      setNotice("API offline. Booking status changed in local preview.");
      pushActivity({
        title: "Booking status changed locally",
        detail: `${booking.bookingCode} changed in preview only. Backend did not confirm it.`,
        tone: "warning"
      });
    }
  }

  function replaceBooking(booking: Booking) {
    setBookings((current) => current.map((item) => (item.bookingCode === booking.bookingCode ? booking : item)));
    setDashboard((current) => ({
      ...current,
      recentBookings: current.recentBookings.map((item) => (item.bookingCode === booking.bookingCode ? booking : item))
    }));
  }

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      name: leadForm.name.trim() || undefined,
      phone: leadForm.phone.trim(),
      email: leadForm.email.trim() || undefined,
      source: leadForm.source.trim() || undefined,
      status: leadForm.status,
      notes: leadForm.notes.trim() || undefined
    };

    if (!/^[6-9]\d{9}$/.test(payload.phone)) {
      setNotice("Enter a valid 10-digit lead phone number.");
      return;
    }

    try {
      const api = createApiClient();
      const response = leadForm.id ? await api.updateLead(leadForm.id, payload) : await api.createLead(payload);
      upsertLead(response.data);
      setMode("live");
      setNotice(leadForm.id ? "Lead updated." : "Lead created.");
      pushActivity({
        title: leadForm.id ? "Lead updated" : "Lead created",
        detail: `${response.data.name || response.data.phone} is now ${response.data.status}.`,
        tone: "success"
      });
      adminConsole("info", leadForm.id ? "Lead updated" : "Lead created", response.data);
    } catch (error) {
      setMode("loading");
      setNotice(`Lead was not saved. ${getApiErrorMessage(error)}`);
      pushActivity({
        title: "Lead save failed",
        detail: getApiErrorMessage(error),
        tone: "danger"
      });
      adminConsole("error", "Lead save failed", error);
      return;
    }

    setLeadForm(initialLeadForm);
  }

  async function updateLeadStatus(lead: Lead, status: LeadStatus) {
    try {
      const response = await createApiClient().updateLead(lead.id, { status });
      upsertLead(response.data);
      setMode("live");
      setNotice(`Lead moved to ${status}.`);
      pushActivity({
        title: "Lead status changed",
        detail: `${response.data.name || response.data.phone} moved to ${status}.`,
        tone: "info"
      });
      adminConsole("info", "Lead status changed", response.data);
    } catch (error) {
      setMode("loading");
      setNotice(`Lead status was not saved. ${getApiErrorMessage(error)}`);
      pushActivity({
        title: "Lead status save failed",
        detail: getApiErrorMessage(error),
        tone: "danger"
      });
      adminConsole("error", "Lead status save failed", error);
    }
  }

  async function deleteLead(lead: Lead) {
    try {
      await createApiClient().deleteLead(lead.id);
      setMode("live");
      setNotice("Lead deleted.");
      pushActivity({
        title: "Lead deleted",
        detail: `${lead.name || lead.phone} was removed from the CRM pipeline.`,
        tone: "warning"
      });
      adminConsole("warn", "Lead deleted", lead);
    } catch (error) {
      setMode("loading");
      setNotice(`Lead was not deleted. ${getApiErrorMessage(error)}`);
      pushActivity({
        title: "Lead delete failed",
        detail: getApiErrorMessage(error),
        tone: "danger"
      });
      adminConsole("error", "Lead delete failed", error);
      return;
    }
    setLeads((current) => current.filter((item) => item.id !== lead.id));
  }

  function editLead(lead: Lead) {
    setLeadForm({
      id: lead.id,
      name: lead.name ?? "",
      phone: lead.phone,
      email: lead.email ?? "",
      source: lead.source ?? "Website",
      status: lead.status,
      notes: lead.notes ?? ""
    });
    setActiveTab("leads");
  }

  function upsertLead(lead: Lead) {
    setLeads((current) => {
      const exists = current.some((item) => item.id === lead.id);
      return exists ? current.map((item) => (item.id === lead.id ? lead : item)) : [lead, ...current];
    });
  }

  async function saveNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteForm.title.trim() || !noteForm.body.trim()) {
      setNotice("Note title and body are required.");
      return;
    }

    try {
      const response = await createApiClient().createCrmNote(noteForm);
      setNotes((current) => [response.data, ...current]);
      setMode("live");
      setNotice("CRM note saved.");
      pushActivity({
        title: "CRM note saved",
        detail: response.data.title,
        tone: "success"
      });
      adminConsole("info", "CRM note saved", response.data);
    } catch {
      setNotes((current) => [
        {
          id: `local-note-${Date.now()}`,
          title: noteForm.title,
          body: noteForm.body,
          createdAt: new Date().toISOString()
        },
        ...current
      ]);
      setMode("demo");
      setNotice("API offline. Note saved in local preview.");
      pushActivity({
        title: "CRM note saved locally",
        detail: noteForm.title,
        tone: "warning"
      });
    }

    setNoteForm({ title: "", body: "" });
  }

  async function sendWhatsapp(phone: string, message: string) {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);
    const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener");

    try {
      await createApiClient().logWhatsappMessage({ phone: cleanPhone, message, template: "admin_follow_up" });
      setMode("live");
      setNotice("WhatsApp message logged.");
      pushActivity({
        title: "WhatsApp message logged",
        detail: `Outbound message opened for ${cleanPhone}.`,
        tone: "success"
      });
      adminConsole("info", "WhatsApp message logged", { phone: cleanPhone, message });
    } catch {
      setMode("demo");
      setNotice("WhatsApp opened. API offline, so message log is local-only for now.");
      pushActivity({
        title: "WhatsApp opened without API log",
        detail: `Message opened for ${cleanPhone}, but the backend log failed.`,
        tone: "warning"
      });
    }
  }

  function handleAdminSession(session: AuthSession) {
    if (!isAdminUser(session.user)) {
      setAuthUser(session.user);
      setAuthMode("forbidden");
      setNotice("This account is not allowed to access the admin CRM.");
      return;
    }

    setAuthUser(session.user);
    setAuthMode("authenticated");
    setMode("loading");
    setNotice("Admin session verified. Loading live CRM data...");
  }

  async function refreshAdminData() {
    setLiveStatus("syncing");
    const ok = await loadAdminData("manual-refresh");
    setLiveStatus(ok ? "connected" : "reconnecting");
    pushActivity({
      title: ok ? "Manual refresh completed" : "Manual refresh failed",
      detail: ok ? "Admin CRM data was refreshed from the backend." : "Check the API connection, session, and deployment logs.",
      tone: ok ? "success" : "danger"
    });
  }

  async function signOut() {
    try {
      await createApiClient().logout();
    } catch {
      // Clearing UI state is still safe if the network request fails.
    }
    setAuthUser(null);
    setAuthMode("unauthenticated");
    setMode("loading");
    setNotice("Signed out.");
  }

  if (authMode !== "authenticated") {
    return (
      <AdminLoginScreen
        mode={authMode}
        user={authUser}
        onSuccess={handleAdminSession}
        onRetry={() => {
          setAuthUser(null);
          setAuthMode("unauthenticated");
        }}
        onSignOut={signOut}
      />
    );
  }

  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/favicon.png" alt="Marac Workers logo" />
          <strong>Marac Workers</strong>
        </div>
        <nav>
          {[
            ["dashboard", "Dashboard"],
            ["bookings", "Bookings"],
            ["reports", "Reports"],
            ["services", "Services"],
            ["offers", "Offers"],
            ["customers", "Customers"],
            ["leads", "CRM Leads"],
            ["whatsapp", "WhatsApp"]
          ].map(([id, label]) => (
            <button className={`nav-item ${activeTab === id ? "active" : ""}`} type="button" key={id} onClick={() => setActiveTab(id as TabId)}>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      <section className="main">
        <header className="topbar">
          <div>
            <div className="eyebrow">Operations CRM</div>
            <h1>Admin panel for bookings, services, customers, and leads.</h1>
          </div>
          <div className="topbar-actions">
            <button className={`alert-toggle ${alertsEnabled ? "enabled" : ""}`} type="button" onClick={alertsEnabled ? disableAdminAlerts : enableAdminAlerts}>
              <span className="alert-toggle-dot" />
              {alertsEnabled ? "Alerts On" : "Enable Alerts"}
            </button>
            <div className={`live-pill ${liveStatus}`}>
              <span />
              {getLiveStatusLabel(liveStatus)}
            </div>
            <div className={`mode-pill ${mode}`}>{mode === "live" ? "Live API" : mode === "loading" ? "Loading" : "Demo fallback"}</div>
            <button className="admin-user-pill" type="button" onClick={signOut}>
              {authUser?.name || authUser?.email || authUser?.phone || "Admin"} · Sign out
            </button>
          </div>
        </header>

        <div className="notice-row">
          <span>{notice}</span>
          {lastSyncedAt && <strong>Last sync {formatRelativeTime(lastSyncedAt)}</strong>}
        </div>

        <div className="alert-helper-row">
          <span>{alertsEnabled ? "Sound alerts are active for new bookings in this browser." : "Click Enable Alerts once after login to allow booking ring notifications."}</span>
          <strong>Browser notifications: {formatNotificationPermission(notificationPermission)}</strong>
        </div>

        {alertToast && (
          <div className="booking-alert-toast" role="status" aria-live="polite">
            <div className="booking-alert-icon">
              <span />
            </div>
            <div>
              <strong>{alertToast.title}</strong>
              <span>{alertToast.detail}</span>
              <small>{formatRelativeTime(alertToast.at)}</small>
            </div>
            <button type="button" onClick={() => setAlertToast(null)} aria-label="Dismiss booking alert">×</button>
          </div>
        )}

        <div className="toolbar">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings, customers, leads..." />
          <button type="button" onClick={refreshAdminData}>Refresh Live Data</button>
          <button type="button" onClick={() => setActiveTab("services")}>Add Service</button>
          <button type="button" onClick={() => setActiveTab("offers")}>Add Offer</button>
          <button type="button" onClick={() => setActiveTab("leads")}>Add Lead</button>
        </div>

        {activeTab === "dashboard" && (
          <>
            <LiveOpsBar liveStatus={liveStatus} lastSyncedAt={lastSyncedAt} activityEvents={activityEvents} onRefresh={refreshAdminData} />
            <MetricGrid dashboard={dashboard} />
            <div className="work-grid">
              <section className="panel">
                <PanelHead title="Recent Bookings" action="Manage" onAction={() => setActiveTab("bookings")} />
                <BookingTable bookings={dashboard.recentBookings} compact onStatusChange={updateBookingStatus} onWhatsapp={sendWhatsapp} />
              </section>
              <section className="panel">
                <PanelHead title="Hot Leads" action="Open CRM" onAction={() => setActiveTab("leads")} />
                <LeadList leads={dashboard.hotLeads} onEdit={editLead} onStatusChange={updateLeadStatus} onWhatsapp={sendWhatsapp} />
              </section>
              <ActivityFeed events={activityEvents} />
            </div>
          </>
        )}

        {activeTab === "bookings" && (
          <section className="panel">
            <PanelHead title="Booking Operations" subtitle="Confirm, assign, complete, cancel, and message customers." />
            <BookingTable bookings={filteredBookings} onStatusChange={updateBookingStatus} onWhatsapp={sendWhatsapp} />
          </section>
        )}

        {activeTab === "reports" && (
          <section className="panel">
            <PanelHead title="Reports" subtitle="Filter booking, payment, confirmed, cancelled, pending, and completed work by period." />
            <ReportPanel
              report={report}
              filters={reportFilters}
              loading={reportLoading}
              onFilterChange={setReportFilter}
              onApply={applyReportFilters}
              onReset={resetReportFilters}
              onExport={exportReport}
            />
          </section>
        )}

        {activeTab === "services" && (
          <div className="split-grid">
            <section className={`panel ${serviceForm.id ? "editing-panel" : ""}`} ref={serviceEditorRef}>
              <PanelHead title={serviceForm.id ? "Edit Service" : "Add Service"} subtitle="Create and update services shown by the backend catalog." />
              <ServiceFormView
                form={serviceForm}
                categories={categories}
                onChange={setServiceField}
                onSubmit={saveService}
                onReset={() => setServiceForm({ ...initialServiceForm, categoryId: categories[0]?.id ?? fallbackCategories[0]?.id ?? "" })}
              />
            </section>
            <section className="panel">
              <PanelHead title="Service Catalog" subtitle="Inactive services stay hidden from customer browsing." />
              <ServiceTable services={services} categories={categories} onEdit={editService} onDelete={deleteService} />
            </section>
          </div>
        )}

        {activeTab === "offers" && (
          <div className="split-grid">
            <section className={`panel ${offerForm.id ? "editing-panel" : ""}`}>
              <PanelHead title={offerForm.id ? "Edit Offer" : "Add Offer"} subtitle="Create homepage banners that can be general, category-specific, or service-specific." />
              <OfferFormView
                form={offerForm}
                services={services}
                categories={categories}
                onChange={setOfferField}
                onSubmit={saveOffer}
                onReset={() => setOfferForm(initialOfferForm)}
              />
            </section>
            <section className="panel">
              <PanelHead title="Offer Banners" subtitle="Active banners appear on the customer website when the schedule allows." />
              <OfferList offers={filteredOffers} services={services} categories={categories} onEdit={editOffer} onDelete={deleteOffer} />
            </section>
          </div>
        )}

        {activeTab === "customers" && (
          <section className="panel">
            <PanelHead title="Customer Data" subtitle="Booking-derived customer profiles and lifetime value." />
            <CustomerTable customers={filteredCustomers} onWhatsapp={sendWhatsapp} />
          </section>
        )}

        {activeTab === "leads" && (
          <div className="split-grid">
            <section className="panel">
              <PanelHead title={leadForm.id ? "Edit Lead" : "Add CRM Lead"} subtitle="Capture leads from calls, WhatsApp, website, and referrals." />
              <LeadFormView form={leadForm} onChange={setLeadField} onSubmit={saveLead} onReset={() => setLeadForm(initialLeadForm)} />
            </section>
            <section className="panel">
              <PanelHead title="Lead Pipeline" subtitle="Move prospects through contact, qualification, win, or lost." />
              <LeadList leads={filteredLeads} onEdit={editLead} onDelete={deleteLead} onStatusChange={updateLeadStatus} onWhatsapp={sendWhatsapp} />
            </section>
          </div>
        )}

        {activeTab === "whatsapp" && (
          <div className="split-grid">
            <section className="panel">
              <PanelHead title="CRM Notes" subtitle="Keep internal follow-up notes for operations." />
              <form className="form-grid" onSubmit={saveNote}>
                <label>
                  Title
                  <input value={noteForm.title} onChange={(event) => setNoteForm((current) => ({ ...current, title: event.target.value }))} />
                </label>
                <label>
                  Note
                  <textarea value={noteForm.body} onChange={(event) => setNoteForm((current) => ({ ...current, body: event.target.value }))} rows={4} />
                </label>
                <button className="primary-button" type="submit">Save Note</button>
              </form>
              <div className="note-list">
                {notes.map((note) => (
                  <div className="note-row" key={note.id}>
                    <strong>{note.title}</strong>
                    <span>{note.body}</span>
                    <small>{formatDate(note.createdAt)}</small>
                  </div>
                ))}
              </div>
            </section>
            <section className="panel">
              <PanelHead title="WhatsApp Shortcuts" subtitle="Open customer messages and log outbound communication." />
              <div className="shortcut-list">
                {[...bookings.slice(0, 4), ...leads.slice(0, 4)].map((item) => {
                  const phone = "customerPhone" in item ? item.customerPhone : item.phone;
                  const name = "customerName" in item ? item.customerName : item.name ?? "Lead";
                  const message =
                    "bookingCode" in item
                      ? `Hi ${name}, your booking ${item.bookingCode} is ${item.status}. Our team will update you shortly.`
                      : `Hi ${name}, this is Marac Workers following up on your service enquiry.`;

                  return (
                    <button className="shortcut-row" type="button" key={`${phone}-${name}`} onClick={() => sendWhatsapp(phone, message)}>
                      <span>{name}</span>
                      <strong>{phone}</strong>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function isAdminUser(user: AuthUser) {
  return user.role === "ADMIN" || user.role === "MANAGER";
}

function AdminLoginScreen({
  mode,
  user,
  onSuccess,
  onRetry,
  onSignOut
}: {
  mode: AuthMode;
  user: AuthUser | null;
  onSuccess: (session: AuthSession) => void;
  onRetry: () => void;
  onSignOut: () => void | Promise<void>;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Use an admin or manager account to continue.");
  const [error, setError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleRenderedRef = useRef(false);

  useEffect(() => {
    if (!googleClientId || googleRenderedRef.current) return;

    let active = true;
    loadGoogleIdentity().then((loaded) => {
      if (!active || !loaded || !window.google || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          if (!response.credential) {
            setError("Google did not return a login credential.");
            return;
          }

          setBusy(true);
          setError("");
          setMessage("Verifying Google account...");
          try {
            const result = await createApiClient().loginWithGoogle({ credential: response.credential });
            onSuccess(result.data);
          } catch {
            setError("Google admin login failed. Check Google OAuth env and admin role.");
          } finally {
            setBusy(false);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "pill"
      });
      googleRenderedRef.current = true;
    });

    return () => {
      active = false;
    };
  }, [onSuccess]);

  async function requestOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^[6-9]\d{9}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit Indian mobile number.");
      return;
    }

    setBusy(true);
    setMessage("Sending OTP...");
    try {
      const response = await createApiClient().requestOtp({
        phone: phone.trim(),
        name: name.trim() || undefined
      });
      setOtpSent(true);
      setMessage(response.data.debugOtp ? `OTP ready for local testing: ${response.data.debugOtp}` : response.data.message);
    } catch {
      setError("Could not request OTP. Check backend availability.");
      setMessage("Use an admin or manager account to continue.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit OTP.");
      return;
    }

    setBusy(true);
    setMessage("Verifying OTP...");
    try {
      const response = await createApiClient().verifyOtp({
        phone: phone.trim(),
        code: code.trim(),
        name: name.trim() || undefined
      });
      onSuccess(response.data);
    } catch {
      setError("Invalid OTP or this account is not configured.");
      setMessage("Request a new OTP if needed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-shell">
      <div className="login-card">
        <div className="brand">
          <img src="/favicon.png" alt="Marac Workers logo" />
          <strong>Marac Workers</strong>
        </div>
        <div className="eyebrow">Protected CRM</div>
        <h1>Sign in to manage bookings, services, customers, and leads.</h1>
        {mode === "checking" ? (
          <div className="notice-row">Checking admin session...</div>
        ) : mode === "forbidden" ? (
          <div className="auth-denied">
            <strong>Admin access required</strong>
            <span>{user?.email || user?.phone || "This account"} is signed in but does not have an admin or manager role.</span>
            <div className="form-actions">
              <button className="primary-button" type="button" onClick={onSignOut}>Sign out</button>
              <button type="button" onClick={onRetry}>Try another account</button>
            </div>
          </div>
        ) : (
          <div className="admin-auth-grid">
            <form className="admin-auth-card" onSubmit={otpSent ? verifyOtp : requestOtp}>
              <h2>OTP Login</h2>
              <p>{message}</p>
              <label>
                Name
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Admin name" />
              </label>
              <label>
                Mobile Number
                <input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" placeholder="10-digit mobile number" />
              </label>
              {otpSent && (
                <label>
                  OTP
                  <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" placeholder="6-digit OTP" />
                </label>
              )}
              {error && <div className="auth-error">{error}</div>}
              <button className="primary-button" type="submit" disabled={busy}>
                {busy ? "Please wait..." : otpSent ? "Verify OTP" : "Send OTP"}
              </button>
            </form>
            <div className="admin-auth-card">
              <h2>Google Login</h2>
              <p>{googleClientId ? "Continue with an admin Google account." : "Add Google client ID env to enable Google login."}</p>
              <div className="google-button-wrap" ref={googleButtonRef} />
              {!googleClientId && <div className="auth-error">Google login is not configured yet.</div>}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function loadGoogleIdentity() {
  if (window.google?.accounts?.id) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function LiveOpsBar({
  liveStatus,
  lastSyncedAt,
  activityEvents,
  onRefresh
}: {
  liveStatus: LiveStatus;
  lastSyncedAt: string | null;
  activityEvents: ActivityEvent[];
  onRefresh: () => void | Promise<void>;
}) {
  const latestEvent = activityEvents[0];

  return (
    <section className="live-ops-bar">
      <div className="live-ops-primary">
        <div className={`live-dot ${liveStatus}`} />
        <div>
          <strong>{getLiveStatusLabel(liveStatus)}</strong>
          <span>{lastSyncedAt ? `Last backend sync ${formatRelativeTime(lastSyncedAt)}` : "Waiting for backend event stream."}</span>
        </div>
      </div>
      <div className="live-ops-secondary">
        <span>{latestEvent ? latestEvent.detail : "No live events received in this browser session yet."}</span>
        <button type="button" onClick={onRefresh}>Force Sync</button>
      </div>
    </section>
  );
}

function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  return (
    <section className="panel activity-panel">
      <PanelHead title="Live Event Feed" subtitle="Browser event listener output from the protected admin stream." />
      {events.length === 0 ? (
        <div className="empty-activity">Waiting for admin events.</div>
      ) : (
        <div className="activity-list">
          {events.map((event) => (
            <div className={`activity-row ${event.tone}`} key={event.id}>
              <div>
                <strong>{event.title}</strong>
                <span>{event.detail}</span>
              </div>
              <small>{formatRelativeTime(event.at)}</small>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function MetricGrid({ dashboard }: { dashboard: AdminDashboard }) {
  const metrics = [
    ["Today's Bookings", dashboard.metrics.todayBookings],
    ["Pending Work", dashboard.metrics.pendingBookings],
    ["Month Revenue", `Rs. ${dashboard.metrics.monthRevenue.toLocaleString()}`],
    ["Active Services", dashboard.metrics.activeServices],
    ["Open Leads", dashboard.metrics.openLeads],
    ["Customers", dashboard.metrics.customers]
  ];

  return (
    <div className="metric-grid">
      {metrics.map(([label, value]) => (
        <div className="metric-card" key={label}>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function ReportPanel({
  report,
  filters,
  loading,
  onFilterChange,
  onApply,
  onReset,
  onExport
}: {
  report: AdminReport | null;
  filters: AdminReportFilters;
  loading: boolean;
  onFilterChange: (field: keyof AdminReportFilters, value: string) => void;
  onApply: () => void;
  onReset: () => void;
  onExport: (format: "csv" | "xls") => void;
}) {
  const rows = report?.rows ?? [];
  const metrics = report?.metrics;

  return (
    <div className="report-shell">
      <div className="report-filter-grid">
        <label>
          Period
          <select value={filters.period ?? "monthly"} onChange={(event) => onFilterChange("period", event.target.value)}>
            {reportPeriods.map((period) => <option value={period.value} key={period.value}>{period.label}</option>)}
          </select>
        </label>
        <label>
          From
          <input
            type="date"
            value={filters.dateFrom ?? ""}
            disabled={filters.period !== "custom"}
            onChange={(event) => onFilterChange("dateFrom", event.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            value={filters.dateTo ?? ""}
            disabled={filters.period !== "custom"}
            onChange={(event) => onFilterChange("dateTo", event.target.value)}
          />
        </label>
        <label>
          Booking Status
          <select value={filters.status ?? "ALL"} onChange={(event) => onFilterChange("status", event.target.value)}>
            <option value="ALL">All bookings</option>
            {bookingStatuses.map((status) => <option value={status} key={status}>{status}</option>)}
          </select>
        </label>
        <label>
          Payment Status
          <select value={filters.paymentStatus ?? "ALL"} onChange={(event) => onFilterChange("paymentStatus", event.target.value)}>
            <option value="ALL">All payments</option>
            {paymentStatuses.map((status) => <option value={status} key={status}>{status}</option>)}
          </select>
        </label>
        <label>
          Payment Mode
          <select value={filters.paymentMode ?? "ALL"} onChange={(event) => onFilterChange("paymentMode", event.target.value)}>
            <option value="ALL">All modes</option>
            {paymentModes.map((mode) => <option value={mode} key={mode}>{mode}</option>)}
          </select>
        </label>
        <label className="report-search-field">
          Search
          <input value={filters.search ?? ""} onChange={(event) => onFilterChange("search", event.target.value)} placeholder="Booking, customer, phone, service..." />
        </label>
        <div className="report-actions">
          <button type="button" onClick={onApply}>{loading ? "Loading..." : "Apply Filter"}</button>
          <button type="button" onClick={onReset}>Reset</button>
        </div>
      </div>

      {report && (
        <div className="report-range-note">
          <span>Showing {formatDate(report.filters.dateFrom)} to {formatDate(report.filters.dateTo)}</span>
          <strong>{rows.length} row{rows.length === 1 ? "" : "s"}</strong>
        </div>
      )}

      <div className="report-summary-grid">
        {[
          ["Bookings", metrics?.totalBookings ?? 0],
          ["Confirmed", metrics?.confirmedBookings ?? 0],
          ["Completed", metrics?.completedBookings ?? 0],
          ["Cancelled", metrics?.cancelledBookings ?? 0],
          ["Revenue", `Rs. ${(metrics?.totalRevenue ?? 0).toLocaleString()}`],
          ["Paid", `Rs. ${(metrics?.paidAmount ?? 0).toLocaleString()}`],
          ["Due", `Rs. ${(metrics?.dueAmount ?? 0).toLocaleString()}`],
          ["COD / Online", `${metrics?.codBookings ?? 0} / ${metrics?.onlineBookings ?? 0}`]
        ].map(([label, value]) => (
          <div className="report-summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="report-export-row">
        <button type="button" disabled={!rows.length} onClick={() => onExport("csv")}>Export CSV</button>
        <button type="button" disabled={!rows.length} onClick={() => onExport("xls")}>Export Excel</button>
      </div>

      <ReportTable rows={rows} />
    </div>
  );
}

function ReportTable({ rows }: { rows: AdminReportRow[] }) {
  return (
    <div className="data-table report-table">
      <div className="table-head">
        <span>Booking</span>
        <span>Date</span>
        <span>Customer</span>
        <span>Services</span>
        <span>Status</span>
        <span>Payment</span>
        <span>Total</span>
        <span>Paid / Due</span>
      </div>
      {rows.length === 0 ? (
        <div className="empty-activity">No report rows match the selected filters.</div>
      ) : rows.map((row) => (
        <div className="table-row" key={row.bookingCode}>
          <strong>{row.bookingCode}</strong>
          <span>{formatDate(row.createdAt)}<small>Service {formatDate(row.preferredDate)} - {row.preferredTimeSlot}</small></span>
          <span>{row.customerName}<small>{row.customerPhone} - {row.city}</small></span>
          <span>{row.services || "Service booking"}</span>
          <span className={`status-pill ${row.bookingStatus.toLowerCase()}`}>{row.bookingStatus}</span>
          <span className={`payment-pill ${row.paymentStatus.toLowerCase()}`}>{row.paymentMode} - {row.paymentStatus}</span>
          <strong>Rs. {row.totalAmount.toLocaleString()}</strong>
          <span>Rs. {row.paidAmount.toLocaleString()}<small>Due Rs. {row.dueAmount.toLocaleString()}</small></span>
        </div>
      ))}
    </div>
  );
}

function PanelHead({ title, subtitle, action, onAction }: { title: string; subtitle?: string; action?: string; onAction?: () => void }) {
  return (
    <div className="panel-head">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <button type="button" onClick={onAction}>{action}</button>}
    </div>
  );
}

function BookingTable({
  bookings,
  compact,
  onStatusChange,
  onWhatsapp
}: {
  bookings: Booking[];
  compact?: boolean;
  onStatusChange: (booking: Booking, status: BookingStatus) => void;
  onWhatsapp: (phone: string, message: string) => void;
}) {
  return (
    <div className={`data-table booking-table ${compact ? "compact" : ""}`}>
      <div className="table-head">
        <span>Booking</span>
        <span>Customer</span>
        <span>Service</span>
        <span>Status</span>
        <span>Payment</span>
        <span>Total</span>
        <span>Action</span>
      </div>
      {bookings.map((booking) => {
        const serviceSummary = booking.items.map((item) => item.serviceName).join(", ") || "Service booking";
        const paidPayment = booking.payments?.find((payment) => payment.status === "PAID");
        const paymentLabel = paidPayment ? "PAID" : booking.paymentMode;
        return (
          <div className="table-row" key={booking.bookingCode}>
            <strong>{booking.bookingCode}</strong>
            <span>{booking.customerName}<small>{booking.customerPhone}</small></span>
            <span>{serviceSummary}<small>{formatDate(booking.preferredDate)} - {booking.preferredTimeSlot}</small></span>
            <select value={booking.status} onChange={(event) => onStatusChange(booking, event.target.value as BookingStatus)}>
              {bookingStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <span className={`payment-pill ${paymentLabel.toLowerCase()}`}>{paymentLabel}</span>
            <strong>Rs. {booking.totalAmount.toLocaleString()}</strong>
            <button type="button" onClick={() => onWhatsapp(booking.customerPhone, `Hi ${booking.customerName}, your booking ${booking.bookingCode} is ${booking.status}.`)}>
              WhatsApp
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ServiceFormView({
  form,
  categories,
  onChange,
  onSubmit,
  onReset
}: {
  form: ServiceForm;
  categories: ServiceCategory[];
  onChange: (field: keyof ServiceForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Category
        <select value={form.categoryId} onChange={(event) => onChange("categoryId", event.target.value)}>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
      </label>
      <label>
        Service Name
        <input value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Bathroom Deep Cleaning" />
      </label>
      <label>
        Slug
        <input value={form.slug} onChange={(event) => onChange("slug", event.target.value)} placeholder="bathroom-deep-cleaning" />
      </label>
      <label>
        Base Price
        <input value={form.basePrice} onChange={(event) => onChange("basePrice", event.target.value)} inputMode="numeric" placeholder="299" />
      </label>
      <label>
        Popup Group Heading
        <input value={form.groupLabel} onChange={(event) => onChange("groupLabel", event.target.value)} placeholder="Bathroom Cleaning" />
      </label>
      <label>
        Display Price Label
        <input value={form.priceLabel} onChange={(event) => onChange("priceLabel", event.target.value)} placeholder="1188.3" />
      </label>
      <label>
        Old Price
        <input value={form.originalPrice} onChange={(event) => onChange("originalPrice", event.target.value)} inputMode="numeric" placeholder="1398" />
      </label>
      <label>
        Old Price Label
        <input value={form.originalPriceLabel} onChange={(event) => onChange("originalPriceLabel", event.target.value)} placeholder="1398" />
      </label>
      <label>
        Discount Label
        <input value={form.discountLabel} onChange={(event) => onChange("discountLabel", event.target.value)} placeholder="15% discount" />
      </label>
      <label>
        Duration Minutes
        <input value={form.durationMin} onChange={(event) => onChange("durationMin", event.target.value)} inputMode="numeric" placeholder="90" />
      </label>
      <label className="wide">
        Service Image URL
        <input value={form.imageUrl} onChange={(event) => onChange("imageUrl", event.target.value)} placeholder="https://example.com/service-photo.jpg" />
      </label>
      <div className="wide icon-picker-field">
        <span className="field-label">Service Icon</span>
        <div className="icon-picker-grid" role="radiogroup" aria-label="Service icon">
          {serviceIconOptions.map((option) => {
            const selected = normalizeServiceIconKey(form.icon) === option.key;
            return (
              <button
                aria-checked={selected}
                className={`icon-choice ${selected ? "selected" : ""}`}
                key={option.key}
                onClick={() => onChange("icon", option.key)}
                role="radio"
                title={option.label}
                type="button"
              >
                <ServiceIcon className="admin-service-vector" name={option.key} title={option.label} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <label className="wide">
        Description
        <textarea value={form.description} onChange={(event) => onChange("description", event.target.value)} rows={4} />
      </label>
      <label className="check-row">
        <input checked={form.isActive} onChange={(event) => onChange("isActive", event.target.checked)} type="checkbox" />
        Active service
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit">{form.id ? "Update Service" : "Create Service"}</button>
        <button type="button" onClick={onReset}>{form.id ? "Cancel Edit" : "Reset"}</button>
      </div>
    </form>
  );
}

function ServiceTable({
  services,
  categories,
  onEdit,
  onDelete
}: {
  services: Service[];
  categories: ServiceCategory[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}) {
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div className="service-list">
      {services.map((service) => (
        <div className={`service-row ${service.isActive ? "" : "inactive"}`} key={service.id}>
          <div className="service-row-main">
            <span className="service-row-icon">
              <ServiceIcon className="admin-service-vector" name={resolveServiceIconKey(service.icon, [service.name, service.description].filter(Boolean).join(" "))} title={service.name} />
            </span>
            <div>
              <strong>{service.name}</strong>
              <span>{categoryMap.get(service.categoryId) ?? "Uncategorized"} - Rs. {service.basePrice.toLocaleString()}</span>
              {(service.groupLabel || service.discountLabel || service.originalPrice != null) && (
                <small>
                  {[service.groupLabel, service.originalPrice != null ? `was Rs. ${service.originalPrice.toLocaleString()}` : "", service.discountLabel]
                    .filter(Boolean)
                    .join(" - ")}
                </small>
              )}
              <small>{service.description}</small>
            </div>
          </div>
          <div className="row-actions">
            <button type="button" onClick={() => onEdit(service)}>Edit</button>
            <button type="button" onClick={() => onDelete(service)}>{service.isActive ? "Disable" : "Disabled"}</button>
          </div>
        </div>
      ))}
    </div>
  );
}

function OfferFormView({
  form,
  services,
  categories,
  onChange,
  onSubmit,
  onReset
}: {
  form: OfferForm;
  services: Service[];
  categories: ServiceCategory[];
  onChange: (field: keyof OfferForm, value: string | boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Title
        <input value={form.title} onChange={(event) => onChange("title", event.target.value)} placeholder="just Rs. 99" />
      </label>
      <label>
        CTA Label
        <input value={form.ctaLabel} onChange={(event) => onChange("ctaLabel", event.target.value)} placeholder="Book now" />
      </label>
      <label className="wide">
        Subtitle
        <input value={form.subtitle} onChange={(event) => onChange("subtitle", event.target.value)} placeholder="60% OFF on selected services" />
      </label>
      <label>
        Target Service
        <select value={form.serviceId} onChange={(event) => onChange("serviceId", event.target.value)}>
          <option value="">General offer</option>
          {services.map((service) => (
            <option value={service.id} key={service.id}>{service.name}</option>
          ))}
        </select>
      </label>
      <label>
        Target Category
        <select value={form.categoryId} onChange={(event) => onChange("categoryId", event.target.value)}>
          <option value="">No category target</option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>{category.name}</option>
          ))}
        </select>
      </label>
      <label>
        Offer Price
        <input value={form.offerPrice} onChange={(event) => onChange("offerPrice", event.target.value)} inputMode="numeric" placeholder="99" />
      </label>
      <label>
        Original Price
        <input value={form.originalPrice} onChange={(event) => onChange("originalPrice", event.target.value)} inputMode="numeric" placeholder="245" />
      </label>
      <label>
        Discount Text
        <input value={form.discountText} onChange={(event) => onChange("discountText", event.target.value)} placeholder="60% OFF" />
      </label>
      <label>
        Sort Order
        <input value={form.sortOrder} onChange={(event) => onChange("sortOrder", event.target.value)} inputMode="numeric" placeholder="0" />
      </label>
      <label>
        Starts At
        <input value={form.startsAt} onChange={(event) => onChange("startsAt", event.target.value)} type="datetime-local" />
      </label>
      <label>
        Ends At
        <input value={form.endsAt} onChange={(event) => onChange("endsAt", event.target.value)} type="datetime-local" />
      </label>
      <label className="wide">
        Banner Image URL
        <input value={form.imageUrl} onChange={(event) => onChange("imageUrl", event.target.value)} placeholder="https://..." />
      </label>
      <label className="check-row">
        <input checked={form.isActive} onChange={(event) => onChange("isActive", event.target.checked)} type="checkbox" />
        Active offer
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit">{form.id ? "Update Offer" : "Create Offer"}</button>
        <button type="button" onClick={onReset}>{form.id ? "Cancel Edit" : "Reset"}</button>
      </div>
    </form>
  );
}

function OfferList({
  offers,
  services,
  categories,
  onEdit,
  onDelete
}: {
  offers: OfferBanner[];
  services: Service[];
  categories: ServiceCategory[];
  onEdit: (offer: OfferBanner) => void;
  onDelete: (offer: OfferBanner) => void;
}) {
  const serviceMap = new Map(services.map((service) => [service.id, service.name]));
  const categoryMap = new Map(categories.map((category) => [category.id, category.name]));

  if (offers.length === 0) {
    return <div className="empty-activity">No offer banners yet. Create one to control the customer promo strip.</div>;
  }

  return (
    <div className="offer-list">
      {offers.map((offer) => {
        const target = offer.serviceId
          ? serviceMap.get(offer.serviceId) ?? offer.service?.name ?? "Selected service"
          : offer.categoryId
            ? categoryMap.get(offer.categoryId) ?? offer.category?.name ?? "Selected category"
            : "Homepage general";
        return (
          <div className={`offer-row ${offer.isActive ? "" : "inactive"}`} key={offer.id}>
            {offer.imageUrl ? <img src={offer.imageUrl} alt="" /> : <div className="offer-image-fallback">TWG</div>}
            <div className="offer-row-main">
              <strong>{offer.title}</strong>
              <span>{target}</span>
              <small>{formatOfferSummary(offer)}</small>
            </div>
            <div className="row-actions">
              <button type="button" onClick={() => onEdit(offer)}>Edit</button>
              <button type="button" onClick={() => onDelete(offer)}>{offer.isActive ? "Disable" : "Disabled"}</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CustomerTable({ customers, onWhatsapp }: { customers: CustomerSummary[]; onWhatsapp: (phone: string, message: string) => void }) {
  return (
    <div className="data-table customer-table">
      <div className="table-head">
        <span>Customer</span>
        <span>Last Service</span>
        <span>Bookings</span>
        <span>Spend</span>
        <span>Last Status</span>
        <span>Action</span>
      </div>
      {customers.map((customer) => (
        <div className="table-row" key={customer.phone}>
          <span>{customer.name}<small>{customer.phone}</small></span>
          <span>{customer.lastService}<small>{customer.city} - {formatDate(customer.lastBookingAt)}</small></span>
          <strong>{customer.bookingsCount}</strong>
          <strong>Rs. {customer.totalSpend.toLocaleString()}</strong>
          <span className={`status-pill ${customer.status.toLowerCase()}`}>{customer.status}</span>
          <button type="button" onClick={() => onWhatsapp(customer.phone, `Hi ${customer.name}, thank you for choosing Marac Workers.`)}>
            Message
          </button>
        </div>
      ))}
    </div>
  );
}

function LeadFormView({
  form,
  onChange,
  onSubmit,
  onReset
}: {
  form: LeadForm;
  onChange: (field: keyof LeadForm, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onReset: () => void;
}) {
  return (
    <form className="form-grid" onSubmit={onSubmit}>
      <label>
        Name
        <input value={form.name} onChange={(event) => onChange("name", event.target.value)} placeholder="Customer or company name" />
      </label>
      <label>
        Phone
        <input value={form.phone} onChange={(event) => onChange("phone", event.target.value)} placeholder="10-digit mobile number" />
      </label>
      <label>
        Email
        <input value={form.email} onChange={(event) => onChange("email", event.target.value)} placeholder="optional@email.com" />
      </label>
      <label>
        Source
        <input value={form.source} onChange={(event) => onChange("source", event.target.value)} placeholder="Website, WhatsApp, Referral" />
      </label>
      <label>
        Status
        <select value={form.status} onChange={(event) => onChange("status", event.target.value)}>
          {leadStatuses.map((status) => <option key={status}>{status}</option>)}
        </select>
      </label>
      <label className="wide">
        Notes
        <textarea value={form.notes} onChange={(event) => onChange("notes", event.target.value)} rows={4} />
      </label>
      <div className="form-actions">
        <button className="primary-button" type="submit">{form.id ? "Update Lead" : "Create Lead"}</button>
        <button type="button" onClick={onReset}>Reset</button>
      </div>
    </form>
  );
}

function LeadList({
  leads,
  onEdit,
  onDelete,
  onStatusChange,
  onWhatsapp
}: {
  leads: Lead[];
  onEdit: (lead: Lead) => void;
  onDelete?: (lead: Lead) => void;
  onStatusChange: (lead: Lead, status: LeadStatus) => void;
  onWhatsapp: (phone: string, message: string) => void;
}) {
  return (
    <div className="lead-list">
      {leads.map((lead) => (
        <div className="lead-row" key={lead.id}>
          <div>
            <strong>{lead.name ?? "Unnamed lead"}</strong>
            <span>{lead.phone}{lead.source ? ` - ${lead.source}` : ""}</span>
            {lead.notes && <small>{lead.notes}</small>}
          </div>
          <select value={lead.status} onChange={(event) => onStatusChange(lead, event.target.value as LeadStatus)}>
            {leadStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <div className="row-actions">
            <button type="button" onClick={() => onEdit(lead)}>Edit</button>
            <button type="button" onClick={() => onWhatsapp(lead.phone, `Hi ${lead.name ?? "there"}, this is Marac Workers following up on your service enquiry.`)}>
              WhatsApp
            </button>
            {onDelete && <button type="button" onClick={() => onDelete(lead)}>Delete</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateServicePayload(payload: ServiceCreateInput) {
  if (!payload.categoryId) return "Choose a valid service category.";
  if (payload.name.length < 2) return "Service name must be at least 2 characters.";
  if (payload.slug.length < 2) return "Service slug must be at least 2 characters.";
  if (payload.description.length < 10) return "Service description must be at least 10 characters, or leave it blank to auto-generate one.";
  if (!Number.isInteger(payload.basePrice) || payload.basePrice < 0) return "Base price must be a whole number, zero or higher.";
  if (payload.originalPrice !== undefined && payload.originalPrice !== null && (!Number.isInteger(payload.originalPrice) || payload.originalPrice < 0)) {
    return "Old price must be a whole number, zero or higher.";
  }
  if (payload.durationMin !== undefined && (!Number.isInteger(payload.durationMin) || payload.durationMin <= 0)) {
    return "Duration minutes must be a positive whole number.";
  }

  return "";
}

function validateOfferPayload(
  payload: OfferBannerCreateInput,
  numericValues: { offerPrice: number | undefined; originalPrice: number | undefined; sortOrder: number | undefined }
) {
  if (payload.title.trim().length < 2) return "Offer title must be at least 2 characters.";
  if ((payload.ctaLabel ?? "").trim().length < 2) return "Offer CTA label must be at least 2 characters.";
  if (numericValues.offerPrice !== undefined && (!Number.isInteger(numericValues.offerPrice) || numericValues.offerPrice < 0)) {
    return "Offer price must be a whole number, zero or higher.";
  }
  if (numericValues.originalPrice !== undefined && (!Number.isInteger(numericValues.originalPrice) || numericValues.originalPrice < 0)) {
    return "Original price must be a whole number, zero or higher.";
  }
  if (numericValues.sortOrder !== undefined && !Number.isInteger(numericValues.sortOrder)) return "Sort order must be a whole number.";
  if (payload.startsAt && payload.endsAt && new Date(payload.startsAt).getTime() > new Date(payload.endsAt).getTime()) {
    return "Offer start date must be before the end date.";
  }

  return "";
}

function parseAdminInteger(value: string) {
  const numericText = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0];
  return numericText ? Number(numericText) : Number.NaN;
}

function parseOptionalAdminInteger(value: string) {
  if (!value.trim()) return undefined;
  return parseAdminInteger(value);
}

function toDateTimeLocalValue(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function formatOfferSummary(offer: OfferBanner) {
  const parts = [
    offer.discountText,
    offer.offerPrice != null ? `Rs. ${offer.offerPrice.toLocaleString()}` : "",
    offer.originalPrice != null ? `was Rs. ${offer.originalPrice.toLocaleString()}` : "",
    offer.startsAt ? `starts ${formatDate(offer.startsAt)}` : "",
    offer.endsAt ? `ends ${formatDate(offer.endsAt)}` : "",
    offer.isActive ? "Active" : "Inactive"
  ];

  return parts.filter(Boolean).join(" - ");
}

function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return "Check backend/database connection and try again.";
}

function parseAdminEventSnapshot(event: Event) {
  try {
    const messageEvent = event as MessageEvent<string>;
    const parsed = JSON.parse(messageEvent.data) as AdminEventSnapshot;
    return parsed.revision && parsed.timestamp ? parsed : null;
  } catch {
    return null;
  }
}

function parseAdminHeartbeat(event: Event) {
  try {
    const messageEvent = event as MessageEvent<string>;
    const parsed = JSON.parse(messageEvent.data) as { timestamp?: string };
    return parsed.timestamp ? { timestamp: parsed.timestamp } : null;
  } catch {
    return null;
  }
}

function summarizeAdminSnapshot(snapshot: AdminEventSnapshot) {
  const parts = [
    `${snapshot.metrics.pendingBookings} pending bookings`,
    `${snapshot.metrics.activeServices} active services`,
    `${snapshot.metrics.openLeads} open leads`
  ];

  if (snapshot.latest.booking) {
    parts.push(`latest booking ${snapshot.latest.booking.bookingCode} is ${snapshot.latest.booking.status}`);
  } else if (snapshot.latest.service) {
    parts.push(`latest service ${snapshot.latest.service.name}`);
  } else if (snapshot.latest.lead) {
    parts.push(`latest lead ${snapshot.latest.lead.name || snapshot.latest.lead.phone}`);
  }

  return parts.join(" · ");
}

function getLiveStatusLabel(status: LiveStatus) {
  if (status === "connected") return "Live events connected";
  if (status === "syncing") return "Syncing live data";
  if (status === "reconnecting") return "Reconnecting events";
  if (status === "offline") return "Events offline";
  if (status === "connecting") return "Connecting events";
  return "Events idle";
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function playBookingAlertSound(ref: { current: HTMLAudioElement | null }, volume = 1) {
  if (!ref.current) {
    ref.current = new Audio("/booking-alert.wav");
    ref.current.preload = "auto";
  }

  try {
    ref.current.pause();
    ref.current.currentTime = 0;
    ref.current.volume = Math.min(Math.max(volume, 0), 1);
    await ref.current.play();
  } catch {
    await playGeneratedAdminRing(volume);
  }
}

async function playGeneratedAdminRing(volume = 1) {
  const audio = new AudioContext();
  if (audio.state === "suspended") await audio.resume();
  const now = audio.currentTime;
  const notes = [
    { start: 0, frequency: 880 },
    { start: 0.18, frequency: 1174 },
    { start: 0.36, frequency: 880 },
    { start: 0.72, frequency: 1174 },
    { start: 0.9, frequency: 880 }
  ];

  for (const note of notes) {
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(note.frequency, now + note.start);
    gain.gain.setValueAtTime(0, now + note.start);
    gain.gain.linearRampToValueAtTime(0.18 * volume, now + note.start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + 0.16);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now + note.start);
    oscillator.stop(now + note.start + 0.18);
  }

  window.setTimeout(() => {
    audio.close().catch(() => undefined);
  }, 1300);
}

function formatNotificationPermission(permission: NotificationPermission | "unsupported") {
  if (permission === "granted") return "allowed";
  if (permission === "denied") return "blocked";
  if (permission === "default") return "not requested";
  return "not supported";
}

function adminConsole(level: "info" | "warn" | "error", message: string, data?: unknown) {
  if (typeof window === "undefined") return;
  const payload = data === undefined ? "" : data;
  if (level === "error") {
    console.error(`[TWG Admin] ${message}`, payload);
    return;
  }

  if (level === "warn") {
    console.warn(`[TWG Admin] ${message}`, payload);
    return;
  }

  console.info(`[TWG Admin] ${message}`, payload);
}

function buildLocalReport(bookings: Booking[], filters: AdminReportFilters): AdminReport {
  const range = getLocalReportDateRange(filters);
  const search = (filters.search ?? "").trim().toLowerCase();
  const status = filters.status ?? "ALL";
  const paymentMode = filters.paymentMode ?? "ALL";
  const paymentStatus = filters.paymentStatus ?? "ALL";

  const rows = bookings
    .filter((booking) => {
      const createdAt = new Date(booking.createdAt);
      if (createdAt < range.dateFrom || createdAt > range.dateTo) return false;
      if (status !== "ALL" && booking.status !== status) return false;
      if (paymentMode !== "ALL" && booking.paymentMode !== paymentMode) return false;
      if (search) {
        const haystack = [booking.bookingCode, booking.customerName, booking.customerPhone, booking.city, booking.status, booking.items.map((item) => item.serviceName).join(" ")]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    })
    .map((booking) => toReportRow(booking))
    .filter((row) => paymentStatus === "ALL" || row.paymentStatus === paymentStatus);

  const metrics = rows.reduce(
    (summary, row) => {
      summary.totalBookings += 1;
      summary.totalRevenue += row.bookingStatus === "CANCELLED" || row.bookingStatus === "REFUNDED" ? 0 : row.totalAmount;
      summary.paidAmount += row.paidAmount;
      summary.dueAmount += row.dueAmount;
      if (row.bookingStatus === "CONFIRMED" || row.bookingStatus === "ASSIGNED" || row.bookingStatus === "IN_PROGRESS") summary.confirmedBookings += 1;
      if (row.bookingStatus === "CANCELLED" || row.bookingStatus === "REFUNDED") summary.cancelledBookings += 1;
      if (row.bookingStatus === "COMPLETED") summary.completedBookings += 1;
      if (row.bookingStatus === "PENDING") summary.pendingBookings += 1;
      if (row.paymentMode === "COD") summary.codBookings += 1;
      if (row.paymentMode !== "COD") summary.onlineBookings += 1;
      return summary;
    },
    {
      totalBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      completedBookings: 0,
      pendingBookings: 0,
      totalRevenue: 0,
      paidAmount: 0,
      dueAmount: 0,
      codBookings: 0,
      onlineBookings: 0
    }
  );

  return {
    filters: {
      period: filters.period ?? "monthly",
      dateFrom: range.dateFrom.toISOString(),
      dateTo: range.dateTo.toISOString(),
      status,
      paymentStatus,
      paymentMode,
      search: filters.search ?? ""
    },
    metrics,
    rows
  };
}

function toReportRow(booking: Booking): AdminReportRow {
  const paidAmount = booking.payments?.filter((payment) => payment.status === "PAID").reduce((sum, payment) => sum + payment.amount, 0) ?? 0;
  const latestPayment = booking.payments?.slice().sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0];
  const paymentStatus = paidAmount > 0 ? "PAID" : latestPayment?.status ?? "UNPAID";

  return {
    bookingCode: booking.bookingCode,
    createdAt: booking.createdAt,
    preferredDate: booking.preferredDate,
    preferredTimeSlot: booking.preferredTimeSlot,
    customerName: booking.customerName,
    customerPhone: booking.customerPhone,
    city: booking.city,
    services: booking.items.map((item) => `${item.serviceName}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", "),
    bookingStatus: booking.status,
    paymentMode: booking.paymentMode,
    paymentStatus,
    totalAmount: booking.totalAmount,
    paidAmount,
    dueAmount: Math.max(booking.totalAmount - paidAmount, 0)
  };
}

function getLocalReportDateRange(filters: AdminReportFilters) {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const period = filters.period ?? "monthly";
  if (period === "daily") return { dateFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate()), dateTo: endOfToday };
  if (period === "weekly") return { dateFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6), dateTo: endOfToday };
  if (period === "yearly") return { dateFrom: new Date(now.getFullYear(), 0, 1), dateTo: endOfToday };
  if (period === "custom") {
    return {
      dateFrom: parseLocalDate(filters.dateFrom, "start") ?? new Date(now.getFullYear(), now.getMonth(), 1),
      dateTo: parseLocalDate(filters.dateTo, "end") ?? endOfToday
    };
  }
  return { dateFrom: new Date(now.getFullYear(), now.getMonth(), 1), dateTo: endOfToday };
}

function parseLocalDate(value: string | undefined, boundary: "start" | "end") {
  if (!value) return undefined;
  const parsed = new Date(`${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function buildReportExportRows(rows: AdminReportRow[]) {
  return rows.map((row) => ({
    "Booking Code": row.bookingCode,
    "Created At": formatDate(row.createdAt),
    "Service Date": formatDate(row.preferredDate),
    "Time Slot": row.preferredTimeSlot,
    Customer: row.customerName,
    Phone: row.customerPhone,
    City: row.city,
    Services: row.services,
    "Booking Status": row.bookingStatus,
    "Payment Mode": row.paymentMode,
    "Payment Status": row.paymentStatus,
    "Total Amount": row.totalAmount,
    "Paid Amount": row.paidAmount,
    "Due Amount": row.dueAmount
  }));
}

function toCsv(rows: Array<Record<string, string | number>>) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] ?? {});
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? "")).join(","))].join("\r\n");
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toExcelTable(rows: Array<Record<string, string | number>>, title: string) {
  const headers = Object.keys(rows[0] ?? {});
  return `<!doctype html><html><head><meta charset="utf-8" /></head><body><table><caption>${escapeHtml(title)}</caption><thead><tr>${headers
    .map((header) => `<th>${escapeHtml(header)}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${headers.map((header) => `<td>${escapeHtml(row[header] ?? "")}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></body></html>`;
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadTextFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
