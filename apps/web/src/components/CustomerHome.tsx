"use client";

import { createApiClient } from "@the-wings/api-client";
import type {
  AuthSession,
  Booking,
  BookingCreateInput,
  OfferBanner,
  PaymentMode,
  Service as ApiService,
  ServiceCategory as ApiServiceCategory
} from "@the-wings/types";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveServiceIconKey, ServiceIcon, type ServiceIconKey } from "./ServiceIcon";
import { categoryLabels, searchTerms, services, type ServiceCategoryId, type ServiceItem } from "./site-data";

type CartItem = ServiceItem & { quantity: number };
type LocationChoice = { label: string; address: string; coords?: string };
type SubmitStatus = "idle" | "submitting" | "success" | "offline";
type OnlinePaymentStatus = "idle" | "creating" | "ready" | "verifying" | "paid" | "unavailable" | "failed";
type BookingSource = "database" | "whatsapp";
type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};
type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    contact: string;
  };
  notes: Record<string, string>;
  theme: {
    color: string;
  };
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
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
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
    google?: {
      accounts: GoogleAccounts;
    };
  }
}

const categories: Array<{ id: "all" | ServiceCategoryId; label: string; iconKey: ServiceIconKey }> = [
  { id: "all", label: "All Trade Workers", iconKey: "all" },
  { id: "electrician", label: "Electrician", iconKey: "electrician" },
  { id: "plumber", label: "Plumber", iconKey: "plumber" },
  { id: "daily_worker", label: "Daily Workers & Helpers", iconKey: "daily_worker" },
  { id: "construction", label: "Construction Worker", iconKey: "construction" },
  { id: "carpenter", label: "Carpenter", iconKey: "carpenter" },
  { id: "mason", label: "Mason (Rajmistri)", iconKey: "mason" },
  { id: "painter", label: "Painter", iconKey: "painting" },
  { id: "ac", label: "AC & Appliances", iconKey: "ac" },
  { id: "tank", label: "Tank Wash", iconKey: "tank" },
  { id: "deep", label: "Deep Clean", iconKey: "home" },
  { id: "toilet", label: "Toilet & Bath", iconKey: "bathroom" },
  { id: "security", label: "Security Guard", iconKey: "security" }
];

const initialForm = {
  name: "",
  phone: "",
  alternatePhone: "",
  address: "",
  city: "Guwahati",
  date: "",
  time: "",
  paymentMode: "COD" as PaymentMode,
  note: ""
};

type BookingForm = typeof initialForm;
type BookingFormErrors = Partial<Record<keyof BookingForm | "cart", string>>;
type BookingResult = {
  bookingCode: string;
  source: BookingSource;
  status: string;
  whatsappUrl: string;
  paymentMode: PaymentMode;
};

type BookingHistoryItem = {
  bookingCode: string;
  serviceSummary: string;
  total: number;
  preferredDate: string;
  preferredTimeSlot: string;
  status: string;
  source: BookingSource;
  createdAt: string;
};

type ToastNotification = {
  id: string;
  type: "success" | "info" | "warn";
  title: string;
  message: string;
};

const bookingHistoryKey = "marac_customer_bookings";
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

const categorySlugMap: Record<string, ServiceCategoryId> = {
  "electrician": "electrician",
  "electric": "electrician",
  "cat_electrician": "electrician",
  "plumber": "plumber",
  "plumbing": "plumber",
  "cat_plumber": "plumber",
  "daily_worker": "daily_worker",
  "daily-worker": "daily_worker",
  "daily-workers": "daily_worker",
  "helper": "daily_worker",
  "labor": "daily_worker",
  "labour": "daily_worker",
  "construction": "construction",
  "construction-worker": "construction",
  "builder": "construction",
  "carpenter": "carpenter",
  "woodwork": "carpenter",
  "mason": "mason",
  "rajmistri": "mason",
  "brickwork": "mason",
  "painter": "painter",
  "painter-plumber": "painter",
  "painting": "painter",
  "toilet-bath": "toilet",
  "toilet-and-bath": "toilet",
  "toilet": "toilet",
  "bath": "toilet",
  "bathroom": "toilet",
  "tank-wash": "tank",
  "tankwash": "tank",
  "tank": "tank",
  "ac-repair": "ac",
  "ac-and-repair": "ac",
  "ac": "ac",
  "sofa-clean": "sofa",
  "sofa": "sofa",
  "deep-clean": "deep",
  "deep": "deep",
  "kitchen-appliances": "kitchen",
  "kitchen": "kitchen",
  "aya-housemaid": "maid",
  "maid": "maid",
  "pest-control": "pest",
  "pest": "pest",
  "saloon-spa": "salon",
  "salon": "salon",
  "security": "security"
};

const liveBookings = [
  { name: "Sunil B.", trade: "Licensed Electrician", location: "Beltola, Guwahati", time: "2m ago" },
  { name: "Manoj D.", trade: "Master Plumber", location: "GS Road, Guwahati", time: "4m ago" },
  { name: "Deben G.", trade: "Daily Shifting Helper", location: "Paltan Bazaar, Guwahati", time: "6m ago" },
  { name: "Pranab B.", trade: "Master Carpenter", location: "Zoo Road, Guwahati", time: "8m ago" },
  { name: "Ramen N.", trade: "Head Mason (Rajmistri)", location: "Six Mile, Guwahati", time: "11m ago" },
  { name: "Bikash S.", trade: "Construction Site Labor", location: "Dispur, Guwahati", time: "14m ago" }
];

const topWorkers = [
  {
    id: "w1",
    name: "Biswajit Saikia",
    trade: "Licensed Electrician",
    rating: 4.9,
    reviews: 142,
    jobsDone: 210,
    rate: "₹199",
    rateUnit: "visit",
    image: "/images/workers/electrician.jpg",
    skills: ["Wiring", "MCB Trip", "Inverter Setup", "Short Circuit"],
    categoryLink: "electrician"
  },
  {
    id: "w2",
    name: "Manoj Kalita",
    trade: "Master Plumber",
    rating: 4.9,
    reviews: 118,
    jobsDone: 185,
    rate: "₹199",
    rateUnit: "visit",
    image: "/images/workers/plumber.jpg",
    skills: ["Pipe Leakage", "Motor Pump", "Tap Fitting", "Drain Clear"],
    categoryLink: "plumber"
  },
  {
    id: "w3",
    name: "Dhananjay Ali",
    trade: "Daily Wage Helper & Shifting",
    rating: 4.8,
    reviews: 130,
    jobsDone: 220,
    rate: "₹450",
    rateUnit: "half-day",
    image: "/images/workers/daily_workers.jpg",
    skills: ["Heavy Lifting", "House Shifting", "Digging", "Yard Work"],
    categoryLink: "daily_worker"
  },
  {
    id: "w4",
    name: "Pranab Barman",
    trade: "Master Carpenter",
    rating: 4.9,
    reviews: 95,
    jobsDone: 160,
    rate: "₹299",
    rateUnit: "visit",
    image: "/images/workers/carpenter.jpg",
    skills: ["Door Locks", "Wood Repair", "Wardrobes", "Chairs"],
    categoryLink: "carpenter"
  },
  {
    id: "w5",
    name: "Ramen Nath",
    trade: "Head Mason / Rajmistri",
    rating: 4.9,
    reviews: 88,
    jobsDone: 145,
    rate: "₹1,100",
    rateUnit: "day",
    image: "/images/workers/mason.jpg",
    skills: ["Brick Wall", "Plastering", "Tile Fixing", "Concrete"],
    categoryLink: "mason"
  },
  {
    id: "w6",
    name: "Suresh Rai",
    trade: "Construction Site Labor",
    rating: 4.8,
    reviews: 104,
    jobsDone: 190,
    rate: "₹800",
    rateUnit: "day",
    image: "/images/workers/construction.jpg",
    skills: ["Site Helper", "Shuttering", "Iron Rebar", "Cement Mix"],
    categoryLink: "construction"
  }
];

export function CustomerHome() {
  const [activeBookingIndex, setActiveBookingIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState("Search for 'Electrician'");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialTab, setAuthInitialTab] = useState<"customer" | "worker">("customer");
  const [userProfileModalOpen, setUserProfileModalOpen] = useState(false);
  const [workerProfileModalOpen, setWorkerProfileModalOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedHeroCategory, setSelectedHeroCategory] = useState("Electrician");
  const [location, setLocation] = useState<LocationChoice>({
    label: "Guwahati, Assam",
    address: "Guwahati, Assam"
  });
  const [category, setCategory] = useState<"all" | ServiceCategoryId>("all");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [serviceCatalog, setServiceCatalog] = useState<ServiceItem[]>(services);
  const [_offerBanners, setOfferBanners] = useState<OfferBanner[]>([]);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<OnlinePaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [activeLang, setActiveLang] = useState<"en" | "as" | "hi">("en");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const catalogRequestRef = useRef(0);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((title: string, message: string, type: "success" | "info" | "warn" = "success") => {
    const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  useEffect(() => {
    function handleScroll() {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    }
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBookingIndex((prev) => (prev + 1) % liveBookings.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let termIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const term = searchTerms[termIndex] ?? "Electrician";
      setPlaceholder(`Search for '${term.slice(0, charIndex)}'`);

      if (!deleting && charIndex === term.length) {
        deleting = true;
        timeout = setTimeout(tick, 1200);
        return;
      }

      if (deleting && charIndex === 0) {
        deleting = false;
        termIndex = (termIndex + 1) % searchTerms.length;
        timeout = setTimeout(tick, 250);
        return;
      }

      charIndex += deleting ? -1 : 1;
      timeout = setTimeout(tick, deleting ? 45 : 85);
    }

    tick();
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(bookingHistoryKey);
      if (stored) setBookingHistory(JSON.parse(stored) as BookingHistoryItem[]);
    } catch {
      setBookingHistory([]);
    }
  }, []);

  const refreshServiceCatalog = useCallback(async () => {
    const requestId = catalogRequestRef.current + 1;
    catalogRequestRef.current = requestId;

    try {
      const api = createApiClient();
      const [categoriesResponse, servicesResponse, offersResponse] = await Promise.allSettled([
        api.getServiceCategories(),
        api.getServices(),
        api.getOfferBanners()
      ]);

      if (requestId !== catalogRequestRef.current) return;

      const remoteCategories = categoriesResponse.status === "fulfilled" ? categoriesResponse.value.data : [];
      const remoteServices = servicesResponse.status === "fulfilled" ? servicesResponse.value.data : [];

      if (offersResponse.status === "fulfilled") {
        setOfferBanners(offersResponse.value.data);
      }

      if (remoteServices.length > 0) {
        const categoryMap = new Map(remoteCategories.map((cat: ApiServiceCategory) => [cat.id, cat]));
        const mapped = remoteServices.map((service: ApiService) => mapApiServiceToServiceItem(service, categoryMap));
        setServiceCatalog(mapped);
      }
    } catch {
      // Fallback stays in place
    }
  }, []);

  useEffect(() => {
    refreshServiceCatalog();
  }, [refreshServiceCatalog]);

  useEffect(() => {
    let active = true;
    createApiClient()
      .getMe()
      .then((response) => {
        if (active) {
          setAuthSession((prev) => ({
            token: prev?.token,
            user: response.data
          }));
        }
      })
      .catch(() => {
        if (active) setAuthSession(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0), [cartItems]);

  const visibleHomeServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const activeCategory = category;

    return serviceCatalog.filter((service) => {
      const matchesCategory = activeCategory === "all" || service.category === activeCategory;
      if (!matchesCategory) return false;
      if (!query) return true;

      const categoryLabel = categoryLabels[service.category] ?? "";
      return (
        service.name.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        categoryLabel.toLowerCase().includes(query)
      );
    });
  }, [serviceCatalog, category, searchQuery]);

  function addService(service: ServiceItem) {
    const key = String(service.id);
    setCart((prev) => {
      const current = prev[key];
      return {
        ...prev,
        [key]: {
          ...service,
          quantity: (current?.quantity ?? 0) + 1
        }
      };
    });
    showToast("Added to Booking", `${service.name} (₹${service.price}) added to your request`, "success");
  }

  function removeService(serviceId: ServiceItem["id"]) {
    const key = String(serviceId);
    setCart((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function updateCartQuantity(serviceId: ServiceItem["id"], quantity: number) {
    const key = String(serviceId);
    if (quantity <= 0) {
      removeService(serviceId);
      return;
    }

    setCart((prev) => {
      const current = prev[key];
      if (!current) return prev;
      return {
        ...prev,
        [key]: {
          ...current,
          quantity
        }
      };
    });
  }

  function selectLocation(choice: LocationChoice) {
    setLocation(choice);
    setForm((prev) => ({
      ...prev,
      address: choice.address,
      city: "Guwahati"
    }));
    setLocationModalOpen(false);
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Geolocation is not supported in this browser.");
      return;
    }

    setLocationStatus("Detecting location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        selectLocation({
          label: "Current Location (Guwahati)",
          address: "Guwahati, Assam",
          coords: `${latitude},${longitude}`
        });
        setLocationStatus("");
      },
      () => {
        setLocationStatus("Could not fetch GPS. Please select your area manually.");
      }
    );
  }

  function openCart() {
    setCartDrawerOpen(true);
  }

  function proceedToBookingFromCart() {
    setCartDrawerOpen(false);
    setBookingModalOpen(true);
  }

  function updateForm(field: keyof BookingForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function confirmBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateBookingForm(form, cartItems);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitStatus("submitting");
    setSubmitMessage("Creating booking...");

    const payload = createBookingPayload(form, cartItems, total, authSession?.user?.id);

    try {
      const response = await createApiClient().createBooking(payload);
      const bookingData = response.data;
      const result: BookingResult = {
        bookingCode: bookingData.bookingCode,
        source: "database",
        status: bookingData.status,
        whatsappUrl: createWhatsappUrl(bookingData.bookingCode, payload),
        paymentMode: form.paymentMode
      };

      setBookingResult(result);
      setBookingRef(bookingData.bookingCode);
      setSuccess(true);
      setSubmitStatus("success");
      setSubmitMessage("Booking created successfully!");
      showToast("Booking Confirmed!", `Order #${bookingData.bookingCode} created. Verified worker assigned shortly`, "success");

      const historyItem = createHistoryItem(bookingData, payload, "database");
      const nextHistory = [historyItem, ...bookingHistory.filter((h) => h.bookingCode !== historyItem.bookingCode)];
      setBookingHistory(nextHistory);
      try {
        window.localStorage.setItem(bookingHistoryKey, JSON.stringify(nextHistory));
      } catch {
        // Ignore storage write errors
      }
    } catch {
      // Fallback
      const localCode = createLocalBookingCode();
      const result: BookingResult = {
        bookingCode: localCode,
        source: "whatsapp",
        status: "PENDING_WHATSAPP",
        whatsappUrl: createWhatsappUrl(localCode, payload),
        paymentMode: form.paymentMode
      };

      setBookingResult(result);
      setBookingRef(localCode);
      setSuccess(true);
      setSubmitStatus("offline");
      setSubmitMessage("Saved offline. Please share details with our team on WhatsApp.");
      showToast("Order Prepared", `Booking #${localCode} created. Share with team on WhatsApp`, "info");
    }
  }

  async function startOnlinePayment() {
    if (!bookingResult || bookingResult.source !== "database") return;

    setPaymentStatus("creating");
    setPaymentMessage("Initializing secure Razorpay payment...");

    try {
      const loaded = await loadRazorpayCheckout();
      if (!loaded || !window.Razorpay) {
        setPaymentStatus("failed");
        setPaymentMessage("Could not load payment checkout.");
        return;
      }

      const orderResponse = await createApiClient().createRazorpayOrder({ bookingCode: bookingResult.bookingCode });
      const order = orderResponse.data;

      if (!order.keyId) {
        setPaymentStatus("failed");
        setPaymentMessage("Payment gateway key is not configured.");
        return;
      }

      const options: RazorpayCheckoutOptions = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Marac Workers",
        description: `Booking #${bookingResult.bookingCode}`,
        order_id: order.orderId,
        prefill: {
          name: form.name,
          contact: form.phone
        },
        notes: {
          bookingCode: bookingResult.bookingCode
        },
        theme: {
          color: "#f15a24"
        },
        handler: async (response) => {
          setPaymentStatus("verifying");
          setPaymentMessage("Verifying payment...");
          try {
            await createApiClient().verifyRazorpayPayment({
              bookingCode: bookingResult.bookingCode,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });
            setPaymentStatus("paid");
            setPaymentMessage("Payment verified successfully! Your booking is confirmed.");
          } catch {
            setPaymentStatus("failed");
            setPaymentMessage("Payment verification failed. Please contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus("idle");
            setPaymentMessage("Payment window was closed.");
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      setPaymentStatus("ready");
      setPaymentMessage("Complete the payment in the Razorpay popup.");
    } catch {
      setPaymentStatus("failed");
      setPaymentMessage("Online payment could not be started.");
    }
  }

  async function signOut() {
    try {
      await createApiClient().logout();
    } catch {
      // Ignore logout errors
    }
    setAuthSession(null);
    showToast("Signed Out", "You have been signed out successfully", "info");
  }

  function handleQuickChip(name: string) {
    setSearchQuery(name);
    const element = document.getElementById("services");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  function handleFindWorkers() {
    if (selectedHeroCategory) {
      setSearchQuery(selectedHeroCategory);
    }
    const element = document.getElementById("services");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <>
      {/* STICKY FROSTED NAVBAR */}
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`} id="navbar">
        <div className="container nav-flex">
          <Link className="logo" href="/" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <i className="fas fa-hard-hat" />
            <span className="marac">MARAC</span>
            <span className="workers">WORKERS</span>
          </Link>

          <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`} id="navLinks">
            <li><a href="#home" className="active" onClick={() => setMobileMenuOpen(false)}>Home</a></li>
            <li><a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a></li>
            <li><a href="#howitworks" onClick={() => setMobileMenuOpen(false)}>How It Works</a></li>
            <li><a href="#become" onClick={(e) => { e.preventDefault(); setWorkerProfileModalOpen(true); setMobileMenuOpen(false); }}>Become a Worker</a></li>
            <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>About Us</a></li>
            <li><a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
          </ul>

          <div className="nav-actions">
            <button
              className="nav-location-btn"
              type="button"
              onClick={() => setLocationModalOpen(true)}
              title="Change area in Guwahati"
            >
              <i className="fas fa-map-marker-alt" />
              <span>{location.label.split(",")[0] || "Guwahati"}</span>
              <i className="fas fa-chevron-down" style={{ fontSize: "0.65rem", opacity: 0.7 }} />
            </button>

            <div className="lang-selector">
              <span className={activeLang === "en" ? "active" : ""} onClick={() => setActiveLang("en")}>En</span>
              <span className={activeLang === "as" ? "active" : ""} onClick={() => setActiveLang("as")}>অ</span>
              <span className={activeLang === "hi" ? "active" : ""} onClick={() => setActiveLang("hi")}>हि</span>
            </div>

            <button className="cart-nav-btn" type="button" onClick={openCart} title="View Cart">
              <i className="fas fa-shopping-bag" />
              <span>Cart</span>
              {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
            </button>

            {authSession ? (
              <button
                className="btn-outline"
                type="button"
                onClick={() => setUserProfileModalOpen(true)}
                title="View My Profile & Bookings"
                style={{ padding: "0.5rem 1.2rem", display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                <i className="fas fa-user-circle" style={{ color: "var(--orange)", fontSize: "1.1rem" }} />
                <span>{authSession.user.name || authSession.user.phone || "My Account"}</span>
              </button>
            ) : (
              <>
                <button
                  className="btn-outline"
                  type="button"
                  onClick={() => {
                    setAuthInitialTab("customer");
                    setAuthModalOpen(true);
                  }}
                >
                  Login
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setRoleModalOpen(true)}
                  style={{ padding: "0.55rem 1.6rem", fontSize: "0.92rem" }}
                >
                  Register
                </button>
              </>
            )}

            <button className="hamburger" type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation menu">
              <i className={mobileMenuOpen ? "fas fa-times" : "fas fa-bars"} />
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION — Urban Company / Marketplace Style */}
      <section id="home" className="hero-section">
        <div className="container hero-container">
          <div className="hero-content">
            {/* Dynamic Live Booking Notification Pill */}
            <div className="live-booking-pill">
              <span className="live-booking-dot" />
              <span>
                <strong>Live Booking:</strong> {liveBookings[activeBookingIndex]?.name} booked{" "}
                <strong style={{ color: "var(--orange)" }}>{liveBookings[activeBookingIndex]?.trade}</strong> in{" "}
                {liveBookings[activeBookingIndex]?.location}
              </span>
              <span className="time-tag">{liveBookings[activeBookingIndex]?.time}</span>
            </div>

            <h1 className="hero-headline">
              Guwahati&apos;s Trusted Skilled Workers<br />
              <span className="highlight">Electricians, Plumbers, Daily Labor &amp; Masons</span>
            </h1>
            <p className="hero-subtitle">
              Book verified trade professionals and manual laborers in 60 seconds. Transparent daily &amp; visit rates with 100% satisfaction guarantee.
            </p>

            {/* Unified Floating Search Bar */}
            <div className="marketplace-search-box">
              <div className="search-category-select">
                <i className="fas fa-th-large" />
                <select value={selectedHeroCategory} onChange={(e) => setSelectedHeroCategory(e.target.value)}>
                  <option value="Electrician">Electrician</option>
                  <option value="Plumber">Plumber</option>
                  <option value="Daily Worker">Daily Worker / Helper</option>
                  <option value="Construction">Construction Worker</option>
                  <option value="Carpenter">Carpenter</option>
                  <option value="Mason">Mason (Rajmistri)</option>
                  <option value="Painter">Painter</option>
                  <option value="AC Repair">AC &amp; Appliances</option>
                </select>
              </div>

              <div className="search-input-field">
                <i className="fas fa-search" />
                <input
                  type="text"
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleFindWorkers();
                  }}
                />
              </div>

              <button
                type="button"
                className="search-location-btn"
                onClick={() => setLocationModalOpen(true)}
                title="Select locality in Guwahati"
              >
                <i className="fas fa-map-marker-alt" />
                <span>{location.label.split(",")[0] || "Guwahati"}</span>
                <i className="fas fa-chevron-down" style={{ fontSize: "0.7rem", opacity: 0.7 }} />
              </button>

              <button className="btn-secondary search-action-btn" type="button" onClick={handleFindWorkers}>
                <i className="fas fa-search" />
                <span>Find Workers</span>
              </button>
            </div>

            {/* Quick Category Chips for 1-Click Access */}
            <div className="hero-quick-chips">
              <span className="chips-title">Popular Trades:</span>
              <button type="button" className="quick-chip-btn" onClick={() => handleQuickChip("Electrician")}>
                <i className="fas fa-bolt" /> Electrician
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleQuickChip("Plumber")}>
                <i className="fas fa-wrench" /> Plumber
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleQuickChip("Daily Worker")}>
                <i className="fas fa-users" /> Daily Helpers
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleQuickChip("Construction")}>
                <i className="fas fa-hard-hat" /> Construction
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleQuickChip("Carpenter")}>
                <i className="fas fa-hammer" /> Carpenter
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleQuickChip("Mason")}>
                <i className="fas fa-th-large" /> Mason (Rajmistri)
              </button>
              <button type="button" className="quick-chip-btn" onClick={() => handleQuickChip("Painter")}>
                <i className="fas fa-paint-roller" /> Painter
              </button>
            </div>

            {/* Trust Assurance Strip */}
            <div className="hero-trust-strip">
              <div className="trust-strip-item">
                <i className="fas fa-shield-alt" />
                <span>100% Verified Workers</span>
              </div>
              <div className="trust-strip-item">
                <i className="fas fa-bolt" />
                <span>30-Min Fast Response</span>
              </div>
              <div className="trust-strip-item star">
                <i className="fas fa-star" />
                <span>4.9/5 Rating (8,500+ Reviews)</span>
              </div>
              <div className="trust-strip-item">
                <i className="fas fa-wallet" />
                <span>Pay After Service</span>
              </div>
            </div>
          </div>

          {/* Hero Visual Card — Live Marketplace Preview */}
          <div className="hero-card-side">
            <div className="marketplace-preview-card">
              <div className="preview-card-header">
                <div className="live-status-pill">
                  <span className="live-status-dot" />
                  <span>24 Verified Technicians Online</span>
                </div>
                <span className="preview-city-tag">Guwahati, Assam</span>
              </div>

              <div className="preview-featured-pro">
                <div className="pro-avatar-box">
                  <img
                    src="/images/workers/electrician.jpg"
                    alt="Biswajit Saikia - Licensed Electrician"
                  />
                  <span className="pro-check-badge" title="Police & Background Verified">
                    <i className="fas fa-check" />
                  </span>
                </div>
                <div className="pro-info-box">
                  <div className="pro-tag-row">
                    <span className="trade-pill">Licensed Electrician</span>
                    <span className="rating-pill"><i className="fas fa-star" /> 4.9 (142)</span>
                  </div>
                  <h3 className="pro-name">Biswajit Saikia</h3>
                  <p className="pro-location"><i className="fas fa-map-marker-alt" /> Zoo Road, Guwahati • 210+ jobs done</p>
                  <div className="pro-skills-strip">
                    <span>Wiring</span>
                    <span>Inverter</span>
                    <span>MCB Fix</span>
                  </div>
                </div>
              </div>

              <div className="preview-stats-row">
                <div className="preview-stat-cell">
                  <strong>500+</strong>
                  <span>Active Pros</span>
                </div>
                <div className="preview-stat-cell">
                  <strong>12.4k+</strong>
                  <span>Homes Served</span>
                </div>
                <div className="preview-stat-cell">
                  <strong>100%</strong>
                  <span>Verified</span>
                </div>
              </div>

              <div className="preview-instant-cta">
                <div className="instant-cta-text">
                  <strong>Need urgent repair right now?</strong>
                  <span>Guaranteed technician arrival in 30 mins</span>
                </div>
                <button
                  className="btn-secondary"
                  type="button"
                  style={{ padding: "0.6rem 1.4rem", fontSize: "0.88rem", whiteSpace: "nowrap" }}
                  onClick={() => {
                    const el = document.getElementById("services");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Book Pro
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOOKING OPTIONS */}
      <section className="section container">
        <h2 className="section-title" style={{ fontSize: "2.4rem" }}>Book the Way You Want</h2>
        <p className="section-sub">Choose instant help or schedule for later — we&apos;ve got you covered.</p>
        <div className="booking-grid">
          <div className="booking-card">
            <i className="fas fa-bolt" />
            <h4>Need Help Now?</h4>
            <p>Find the nearest available worker for urgent repair and maintenance jobs.</p>
            <button
              className="btn-secondary"
              type="button"
              style={{ marginTop: "0.8rem", padding: "0.65rem 2rem", fontSize: "0.92rem" }}
              onClick={() => {
                const el = document.getElementById("services");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Find Now
            </button>
          </div>
          <div className="booking-card">
            <i className="fas fa-calendar-alt" />
            <h4>Schedule for Later</h4>
            <p>Book a verified skilled worker for your preferred date and convenient time slot.</p>
            <button
              className="btn-primary"
              type="button"
              style={{ marginTop: "0.8rem", padding: "0.65rem 2rem", fontSize: "0.92rem" }}
              onClick={() => {
                if (cartItems.length > 0) {
                  setBookingModalOpen(true);
                } else {
                  const el = document.getElementById("services");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }
              }}
            >
              Schedule
            </button>
          </div>
        </div>
      </section>

      {/* SERVICES CATALOG */}
      <section id="services" className="section section-alt">
        <div className="container">
          <h2 className="section-title">What Service Do You Need?</h2>
          <p className="section-sub">Choose from a wide range of skilled trade professionals ready to work.</p>

          {/* Category Filter Pills */}
          <div className="category-tabs-scroll">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`category-tab-pill ${category === cat.id ? "active" : ""}`}
                onClick={() => setCategory(cat.id)}
              >
                <ServiceIcon name={cat.iconKey} style={{ width: 18, height: 18 }} />
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Service Cards Grid — Urban Company Marketplace Style */}
          <div className="service-grid">
            {visibleHomeServices.map((service) => {
              const key = String(service.id);
              const cartItem = cart[key];
              const quantity = cartItem?.quantity ?? 0;
              const isAdded = quantity > 0;
              const categoryLabel = categoryLabels[service.category] ?? "Service";
              const originalPrice = service.originalPrice ?? Math.round(service.price * 1.25);
              const savePercent = Math.round(((originalPrice - service.price) / originalPrice) * 100);

              return (
                <div className={`service-card ${isAdded ? "service-card-selected" : ""}`} key={service.id}>
                  {service.imageUrl && (
                    <div className="service-card-media">
                      <img src={service.imageUrl} alt={service.name} className="service-card-img" loading="lazy" />
                      <span className="service-card-img-badge">
                        <i className="fas fa-check-circle" /> Verified Pro
                      </span>
                    </div>
                  )}

                  <div className="service-card-content">
                    <div className="service-card-header">
                      <span className="service-card-category-tag">{categoryLabel}</span>
                      <span className="service-card-rating">
                        <i className="fas fa-star" /> 4.9 <span className="reviews-cnt">(850+)</span>
                      </span>
                    </div>

                    <div className="service-card-body">
                      {!service.imageUrl && (
                        <div className="service-card-icon-box">
                          <ServiceIcon name={service.iconKey} title={service.name} style={{ width: 32, height: 32 }} />
                        </div>
                      )}
                      <h3 className="service-card-name">{service.name}</h3>
                      <p className="service-card-description">{service.description}</p>
                      <div className="service-card-meta">
                        <span><i className="fas fa-clock" /> {service.durationLabel || "45-60 mins"}</span>
                        <span><i className="fas fa-shield-alt" /> Verified Pro</span>
                      </div>
                    </div>

                  <div className="service-card-footer">
                    <div className="service-price-block">
                      <div className="service-price-main">
                        <span className="price-curr">₹</span>
                        <span className="price-val">{service.price.toLocaleString()}</span>
                        {originalPrice > service.price && (
                          <span className="price-strike">₹{originalPrice.toLocaleString()}</span>
                        )}
                      </div>
                      {savePercent > 0 && <span className="service-save-tag">{savePercent}% OFF</span>}
                    </div>

                    <div className="service-action-slot">
                      {!isAdded ? (
                        <button
                          className="service-add-btn"
                          type="button"
                          onClick={() => addService(service)}
                          aria-label={`Add ${service.name}`}
                        >
                          <i className="fas fa-plus" /> Add
                        </button>
                      ) : (
                        <div className="service-stepper">
                          <button
                            type="button"
                            className="stepper-action"
                            onClick={() => updateCartQuantity(service.id, quantity - 1)}
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="stepper-value">{quantity}</span>
                          <button
                            type="button"
                            className="stepper-action"
                            onClick={() => updateCartQuantity(service.id, quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* TOP VERIFIED TRADE WORKERS SHOWCASE */}
      <section className="section container">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", marginBottom: "0.8rem" }}>
          <div>
            <h2 className="section-title" style={{ textAlign: "left", marginBottom: "0.3rem", fontSize: "2.3rem" }}>
              Meet Our Top Verified Trade Workers
            </h2>
            <p className="section-sub" style={{ textAlign: "left", margin: 0 }}>
              Certified specialists with police verification, background check & 4.8+ ratings.
            </p>
          </div>
          <button
            className="btn-outline"
            type="button"
            style={{ padding: "0.5rem 1.4rem", fontSize: "0.88rem" }}
            onClick={() => {
              const el = document.getElementById("services");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Explore All Categories →
          </button>
        </div>

        <div className="verified-workers-grid">
          {topWorkers.map((worker) => (
            <div className="worker-card" key={worker.id}>
              <div className="worker-card-header">
                <div className="worker-avatar-wrap">
                  <img src={worker.image} alt={worker.name} />
                  <span className="worker-verified-badge" title="Verified Trade Professional">
                    <i className="fas fa-check" />
                  </span>
                </div>
                <div className="worker-info">
                  <h4>{worker.name}</h4>
                  <div className="worker-trade">{worker.trade}</div>
                </div>
              </div>

              <div className="worker-stats-row">
                <span className="rating-stars">
                  <i className="fas fa-star" /> {worker.rating} ({worker.reviews})
                </span>
                <span>
                  <i className="fas fa-briefcase" style={{ color: "var(--orange)", marginRight: "4px" }} />
                  {worker.jobsDone}+ jobs done
                </span>
              </div>

              <div className="worker-skills-chips">
                {worker.skills.map((skill, i) => (
                  <span className="worker-skill-tag" key={i}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className="worker-card-footer">
                <div>
                  <span className="worker-rate-label">Starting at</span>
                  <div className="worker-rate-value">
                    {worker.rate} <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>/ {worker.rateUnit}</span>
                  </div>
                </div>
                <button
                  className="worker-book-btn"
                  type="button"
                  onClick={() => {
                    setCategory(worker.categoryLink as any);
                    const el = document.getElementById("services");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  Book {worker.name.split(" ")[0]}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR NEAR YOU CHIPS */}
      <section className="section container">
        <h2 className="section-title" style={{ fontSize: "2.2rem" }}>Popular Trades in Guwahati</h2>
        <p className="section-sub">Frequently requested skilled trade professionals and daily workers.</p>
        <div className="popular-grid">
          <div className="popular-item" onClick={() => handleQuickChip("Electrician")}>
            <i className="fas fa-bolt" /> Home Electrician
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Plumber")}>
            <i className="fas fa-wrench" /> Emergency Plumber
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Daily Worker")}>
            <i className="fas fa-users" /> Daily Helpers &amp; Shifting
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Construction")}>
            <i className="fas fa-hard-hat" /> Construction Labor
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Carpenter")}>
            <i className="fas fa-hammer" /> Carpenter &amp; Woodwork
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Mason")}>
            <i className="fas fa-th-large" /> Mason (Rajmistri)
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="howitworks" className="section section-alt">
        <div className="container">
          <h2 className="section-title">Get the Right Worker in 3 Simple Steps</h2>
          <p className="section-sub">Hassle-free booking from your phone with guaranteed peace of mind.</p>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-icon blue">01</div>
              <h4>Choose a Service</h4>
              <p>Select the skilled trade professional or specific service package you need.</p>
            </div>
            <div className="step-item">
              <div className="step-icon orange">02</div>
              <h4>Book a Worker</h4>
              <p>Choose instant booking or schedule for a date and time that suits you best.</p>
            </div>
            <div className="step-item">
              <div className="step-icon green">03</div>
              <h4>Get the Job Done</h4>
              <p>Verified worker arrives, completes work to satisfaction, and you pay cash or online.</p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE MARAC WORKERS */}
      <section className="section container">
        <h2 className="section-title">Why Marac Workers?</h2>
        <p className="section-sub">Built for trust, speed, transparency, and top-quality local workmanship.</p>
        <div className="why-grid">
          <div className="why-item">
            <i className="fas fa-check-circle" />
            <h4>Verified Professionals</h4>
            <p>Background and skill credentials verified.</p>
          </div>
          <div className="why-item">
            <i className="fas fa-tag" />
            <h4>Transparent Pricing</h4>
            <p>Clear upfront rates with zero surprise charges.</p>
          </div>
          <div className="why-item">
            <i className="fas fa-clock" />
            <h4>Instant & Scheduled</h4>
            <p>Book on your terms, same day or later.</p>
          </div>
          <div className="why-item">
            <i className="fas fa-map-pin" />
            <h4>Local Workers</h4>
            <p>Skilled professionals near your neighborhood.</p>
          </div>
          <div className="why-item">
            <i className="fas fa-star" />
            <h4>Ratings & Reviews</h4>
            <p>Authentic feedback from real homeowners.</p>
          </div>
          <div className="why-item">
            <i className="fas fa-wallet" />
            <h4>Easy Payment</h4>
            <p>Pay with Cash on Delivery or online.</p>
          </div>
        </div>
      </section>

      {/* WORKER CTA BANNER */}
      <section id="become" className="container">
        <div className="worker-cta">
          <h2>Your Skills Can Earn More.</h2>
          <p>
            Join Marac Workers, receive steady job opportunities, manage your daily availability, and grow your monthly earnings.
          </p>
          <a
            className="btn-secondary"
            href="https://wa.me/919365123456?text=Hi%20Marac%20Workers%2C%20I%20want%20to%20register%20as%20a%20skilled%20worker."
            target="_blank"
            rel="noreferrer"
            style={{ display: "inline-flex" }}
          >
            <i className="fas fa-user-plus" /> Become a Worker →
          </a>
        </div>
      </section>

      {/* ROLE SELECTION PORTAL */}
      <section id="about" className="section container">
        <h2 className="section-title">Welcome to Marac Workers</h2>
        <p className="section-sub">How would you like to continue today?</p>
        <div className="role-grid">
          <div className="role-card" onClick={() => setRoleModalOpen(true)}>
            <div className="role-img">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=300&fit=crop&crop=face" alt="customer" />
            </div>
            <div className="circle-icon blue"><i className="fas fa-user" /></div>
            <h3>I Need a Worker</h3>
            <div className="role-sub">Customer</div>
            <p>Find, book, and schedule skilled professionals for your home or commercial projects.</p>
            <button
              className="btn-primary"
              style={{ width: "100%" }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setRoleModalOpen(true);
              }}
            >
              Continue as Customer →
            </button>
          </div>

          <div className="role-card" onClick={() => setRoleModalOpen(true)}>
            <div className="role-img">
              <img src="https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=400&h=300&fit=crop&crop=face" alt="worker" />
            </div>
            <div className="circle-icon orange"><i className="fas fa-hard-hat" /></div>
            <h3>I Am a Skilled Worker</h3>
            <div className="role-sub">Worker / Partner</div>
            <p>Join Marac Workers, receive job alerts across Guwahati, and boost your earnings.</p>
            <button
              className="btn-secondary"
              style={{ width: "100%" }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                window.open("https://wa.me/919365123456?text=Hi%20Marac%20Workers%2C%20I%20want%20to%20join%20as%20a%20worker", "_blank");
              }}
            >
              Continue as Worker →
            </button>
          </div>
        </div>

        <div className="login-link">
          Already have an account? <a onClick={() => setAuthModalOpen(true)}>Login here</a>
        </div>
      </section>

      {/* TRUST & SAFETY */}
      <section className="section section-alt">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-item">
              <i className="fas fa-shield-alt" />
              <h4>Verified Workers</h4>
              <p>Government ID and trade skill checks completed.</p>
            </div>
            <div className="trust-item">
              <i className="fas fa-star" />
              <h4>Ratings & Reviews</h4>
              <p>Authentic feedback collected after every completed job.</p>
            </div>
            <div className="trust-item">
              <i className="fas fa-check-circle" />
              <h4>Safe & Transparent</h4>
              <p>Clear pricing, no hidden costs, pay after completion.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <SiteFooter onOpenAuth={() => setAuthModalOpen(true)} onOpenRole={() => setRoleModalOpen(true)} />

      {/* FLOATING MOBILE ACTIONS */}
      <nav className="floating-contact-actions" aria-label="Quick contact">
        <a className="mobile-contact-action call" href="tel:+919365123456">
          <i className="fas fa-phone-alt" />
          <span>Call</span>
        </a>
        <a className="mobile-contact-action whatsapp" href="https://wa.me/919365123456" target="_blank" rel="noreferrer">
          <i className="fab fa-whatsapp" />
          <span>WhatsApp</span>
        </a>
        <span className="mobile-contact-number">+91 93651 23456</span>
      </nav>

      {/* FLOATING CHECKOUT BAR */}
      {cartItems.length > 0 && !bookingModalOpen && !cartDrawerOpen && (
        <aside className="sticky-cart-bar" role="status" aria-label="Cart summary">
          <div className="sticky-cart-inner">
            <div className="sticky-cart-info">
              <div className="sticky-cart-icon-wrap">
                <i className="fas fa-shopping-bag" />
                <span className="sticky-cart-badge">{cartCount}</span>
              </div>
              <div className="sticky-cart-text">
                <div className="sticky-cart-count">{cartCount} {cartCount === 1 ? "service" : "services"} in cart</div>
                <div className="sticky-cart-total">Total: ₹{total.toLocaleString()} <span className="cart-note">· Pay after service</span></div>
              </div>
            </div>
            <button className="sticky-cart-cta" type="button" onClick={openCart}>
              <span>View Cart &amp; Book</span>
              <i className="fas fa-arrow-right" />
            </button>
          </div>
        </aside>
      )}

      {/* CART DRAWER */}
      {cartDrawerOpen && (
        <>
          <div className="cart-drawer-overlay" onClick={() => setCartDrawerOpen(false)} />
          <div className="cart-drawer">
            <div className="cart-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <i className="fas fa-shopping-bag" style={{ color: "var(--orange)", fontSize: "1.3rem" }} />
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Your Selected Services</h3>
              </div>
              <button className="modal-close-btn" style={{ position: "static" }} onClick={() => setCartDrawerOpen(false)}>✕</button>
            </div>

            <div className="cart-items-list">
              {cartItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                  <i className="fas fa-shopping-basket" style={{ fontSize: "3rem", color: "#ccc", marginBottom: "1rem" }} />
                  <p style={{ fontWeight: 600 }}>Your cart is empty.</p>
                  <button className="btn-secondary" style={{ marginTop: "1rem" }} onClick={() => setCartDrawerOpen(false)}>
                    Browse Services
                  </button>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div className="cart-item-row" key={item.id}>
                    <div>
                      <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>{item.name}</h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--orange)", fontWeight: 700 }}>₹{item.price.toLocaleString()}</p>
                    </div>
                    <div className="cart-qty-controls">
                      <button className="cart-qty-btn" type="button" onClick={() => updateCartQuantity(item.id, item.quantity - 1)}>-</button>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{item.quantity}</span>
                      <button className="cart-qty-btn" type="button" onClick={() => updateCartQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="cart-footer">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-muted)" }}>Subtotal</span>
                  <span style={{ fontWeight: 800, fontSize: "1.3rem", color: "var(--navy)" }}>₹{total.toLocaleString()}</span>
                </div>
                <button className="btn-secondary" style={{ width: "100%", justifyContent: "center" }} type="button" onClick={proceedToBookingFromCart}>
                  Proceed to Schedule & Book →
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ROLE / WELCOME MODAL */}
      {roleModalOpen && (
        <div className="modal-overlay" onClick={() => setRoleModalOpen(false)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setRoleModalOpen(false)}>✕</button>
            <h3>Welcome to Marac Workers</h3>
            <p className="sub">Select how you want to use Guwahati&apos;s skilled worker platform.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.4rem" }}>
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  setAuthInitialTab("customer");
                  setAuthModalOpen(true);
                }}
                style={{ width: "100%", padding: "1.1rem", justifyContent: "center", fontSize: "0.95rem" }}
              >
                <i className="fas fa-user" /> I Need a Skilled Worker (Customer)
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  setWorkerProfileModalOpen(true);
                }}
                style={{ width: "100%", padding: "1.1rem", justifyContent: "center", fontSize: "0.95rem" }}
              >
                <i className="fas fa-hard-hat" /> I Am a Skilled Worker (Join &amp; Work)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER PROFILE MODAL */}
      {userProfileModalOpen && authSession && (
        <UserProfileModal
          user={authSession.user}
          bookingHistory={bookingHistory}
          onClose={() => setUserProfileModalOpen(false)}
          onSignOut={() => {
            signOut();
            setUserProfileModalOpen(false);
          }}
          onBookMore={() => {
            const el = document.getElementById("services");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onShowToast={showToast}
        />
      )}

      {/* WORKER PROFILE & PORTAL MODAL */}
      {workerProfileModalOpen && (
        <WorkerProfileModal
          authSession={authSession}
          onClose={() => setWorkerProfileModalOpen(false)}
          onOpenCustomerLogin={() => {
            setWorkerProfileModalOpen(false);
            setAuthInitialTab("customer");
            setAuthModalOpen(true);
          }}
          onOpenWorkerLogin={() => {
            setWorkerProfileModalOpen(false);
            setAuthInitialTab("worker");
            setAuthModalOpen(true);
          }}
          onShowToast={showToast}
        />
      )}

      {/* LOCATION MODAL */}
      {locationModalOpen && (
        <LocationModal
          status={locationStatus}
          onClose={() => setLocationModalOpen(false)}
          onUseCurrent={useCurrentLocation}
          onSelect={selectLocation}
        />
      )}

      {/* AUTH MODAL */}
      {authModalOpen && (
        <AuthModal
          initialTab={authInitialTab}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(session) => {
            setAuthSession(session);
            setAuthModalOpen(false);
            if (authInitialTab === "worker" || session.user.role === "STAFF") {
              setWorkerProfileModalOpen(true);
            }
          }}
          onSwitchToWorkerPortal={() => {
            setAuthModalOpen(false);
            setWorkerProfileModalOpen(true);
          }}
          onShowToast={showToast}
        />
      )}

      {/* BOOKING MODAL */}
      {bookingModalOpen && (
        <BookingModal
          cartItems={cartItems}
          total={total}
          form={form}
          errors={formErrors}
          success={success}
          submitStatus={submitStatus}
          submitMessage={submitMessage}
          paymentStatus={paymentStatus}
          paymentMessage={paymentMessage}
          bookingResult={bookingResult}
          bookingRef={bookingRef}
          onClose={() => {
            setBookingModalOpen(false);
            setSuccess(false);
          }}
          onSubmit={confirmBooking}
          onPayOnline={startOnlinePayment}
          onFormChange={updateForm}
        />
      )}

      {/* GLOBAL TOAST NOTIFICATIONS */}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast-item toast-${toast.type}`}>
            <div className="toast-icon">
              {toast.type === "success" && <i className="fas fa-check" />}
              {toast.type === "info" && <i className="fas fa-info" />}
              {toast.type === "warn" && <i className="fas fa-exclamation-triangle" />}
            </div>
            <div className="toast-body">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </>
  );
}


function LocationModal({
  status,
  onClose,
  onUseCurrent,
  onSelect
}: {
  status: string;
  onClose: () => void;
  onUseCurrent: () => void;
  onSelect: (choice: LocationChoice) => void;
}) {
  const [manual, setManual] = useState("");
  const recents: LocationChoice[] = [
    { label: "GS Road, Christian Basti", address: "Christian Basti, Guwahati, Assam" },
    { label: "Paltan Bazaar", address: "Guwahati Railway Station Area, Guwahati" },
    { label: "Beltola Tiniali", address: "Beltola, Guwahati, Assam" },
    { label: "Zoo Road (R.G. Baruah Rd)", address: "Zoo Tiniali, Guwahati, Assam" }
  ];

  function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = manual.trim();
    if (value) onSelect({ label: value, address: value });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <h3>Choose Your Location</h3>
        <p className="sub">Select your neighborhood in Guwahati for instant worker matching.</p>

        <form onSubmit={submitManual} style={{ marginBottom: "1.2rem" }}>
          <input
            className="form-input"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Search area / landmark / society..."
          />
        </form>

        <button className="btn-outline" type="button" onClick={onUseCurrent} style={{ width: "100%", marginBottom: "1.2rem" }}>
          <i className="fas fa-crosshairs" /> Use Current GPS Location
        </button>

        {status && <div style={{ fontSize: "0.85rem", color: "var(--orange)", marginBottom: "1rem" }}>{status}</div>}

        <div style={{ borderTop: "1px solid rgba(10,25,41,0.06)", paddingTop: "1rem" }}>
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>Popular Areas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {recents.map((recent) => (
              <button
                key={recent.label}
                type="button"
                onClick={() => onSelect(recent)}
                style={{
                  background: "#f8fafd",
                  border: "1px solid rgba(10,25,41,0.04)",
                  borderRadius: "14px",
                  padding: "0.8rem 1rem",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem"
                }}
              >
                <i className="fas fa-map-marker-alt" style={{ color: "var(--orange)" }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--navy)" }}>{recent.label}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{recent.address}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthModal({
  initialTab = "customer",
  onClose,
  onSuccess,
  onSwitchToWorkerPortal,
  onShowToast
}: {
  initialTab?: "customer" | "worker";
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
  onSwitchToWorkerPortal?: () => void;
  onShowToast?: (title: string, message: string, type?: "success" | "info" | "warn") => void;
}) {
  const [activeTab, setActiveTab] = useState<"customer" | "worker">(initialTab);
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [timer, setTimer] = useState(60);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleRenderedRef = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

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
          try {
            const currentRole = activeTabRef.current === "worker" ? "STAFF" : "CUSTOMER";
            const result = await createApiClient().loginWithGoogle({
              credential: response.credential,
              role: currentRole
            });
            onSuccess(result.data);
            onShowToast?.(
              "Signed In",
              currentRole === "STAFF"
                ? `Welcome, ${result.data.user.name || "Worker Partner"}! (Trade Pro Mode)`
                : "Welcome to Marac Workers!",
              "success"
            );
          } catch {
            setError("Google login failed. Please try again or use Phone OTP.");
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
  }, [onSuccess, onShowToast]);

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    setError("");
    setBusy(true);
    setInfo("Sending verification code...");
    try {
      const response = await createApiClient().requestOtp({
        phone: cleanPhone,
        name: name.trim() || undefined
      });
      setStep("otp");
      setTimer(60);
      setInfo(`OTP sent to +91 ${cleanPhone}`);
      onShowToast?.("OTP Code Sent", `Verification code sent to +91 ${cleanPhone}`, "info");
      if (response.data?.debugOtp) {
        setDebugOtp(response.data.debugOtp);
      }
    } catch {
      // Local fallback / demo OTP support
      const fallbackOtp = "123456";
      setDebugOtp(fallbackOtp);
      setStep("otp");
      setTimer(60);
      setInfo(`Verification code prepared for +91 ${cleanPhone}`);
      onShowToast?.("OTP Code Ready", `Verification code prepared for +91 ${cleanPhone}`, "info");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault();
    const cleanCode = code.trim();
    if (cleanCode.length < 4) {
      setError("Enter the OTP code received.");
      return;
    }
    setError("");
    setBusy(true);
    setInfo("Verifying code...");
    const cleanPhone = phone.trim().replace(/\D/g, "");
    try {
      const result = await createApiClient().verifyOtp({
        phone: cleanPhone,
        code: cleanCode,
        name: name.trim() || undefined
      });
      onSuccess(result.data);
      onShowToast?.("Signed In", "Welcome to Marac Workers!", "success");
    } catch {
      // Fallback demo session if API is in demo/offline mode
      const mockSession: AuthSession = {
        token: `mw_demo_${Date.now()}`,
        user: {
          id: `u_${cleanPhone}`,
          name: name.trim() || (activeTab === "worker" ? "Skilled Pro" : "Customer"),
          phone: cleanPhone,
          role: activeTab === "worker" ? "STAFF" : "CUSTOMER"
        }
      };
      onSuccess(mockSession);
      onShowToast?.("Signed In", `Welcome to Marac Workers, ${mockSession.user.name}!`, "success");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Tab Switcher: Customer vs Worker */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "customer" ? "active" : ""}`}
            onClick={() => { setActiveTab("customer"); setError(""); }}
          >
            <i className="fas fa-user" /> Customer
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "worker" ? "active" : ""}`}
            onClick={() => { setActiveTab("worker"); setError(""); }}
          >
            <i className="fas fa-hard-hat" /> Trade Worker
          </button>
        </div>

        <div style={{ textAlign: "center", marginBottom: "1.4rem" }}>
          <h3 style={{ fontSize: "1.4rem", color: "var(--navy)", marginBottom: "0.3rem" }}>
            {activeTab === "customer" ? "Customer Login / Signup" : "Skilled Worker Portal"}
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.88rem" }}>
            {activeTab === "customer"
              ? "Sign in to track your service bookings and get priority dispatch in Guwahati."
              : "Access your worker dashboard, daily wage jobs, and manage your online status."}
          </p>
        </div>

        {step === "phone" ? (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: "1rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.35rem" }}>
                Your Name {activeTab === "worker" ? "(Required)" : "(Optional)"}
              </label>
              <input
                className="form-input"
                type="text"
                placeholder={activeTab === "worker" ? "e.g. Biswajit Saikia" : "Enter your full name"}
                value={name}
                required={activeTab === "worker"}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: "1.2rem" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.35rem" }}>
                Mobile Number *
              </label>
              <div className="auth-phone-box">
                <span className="auth-phone-prefix">+91</span>
                <input
                  className="auth-phone-input"
                  type="tel"
                  placeholder="98765 43210"
                  maxLength={10}
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            {error && <div style={{ color: "#d94a1a", fontSize: "0.84rem", marginBottom: "0.8rem", textAlign: "center" }}>{error}</div>}
            {info && <div style={{ color: "var(--navy)", fontSize: "0.84rem", marginBottom: "0.8rem", textAlign: "center" }}>{info}</div>}

            <button
              className="btn-secondary"
              type="submit"
              disabled={busy}
              style={{ width: "100%", padding: "0.85rem", justifyContent: "center", fontSize: "0.95rem" }}
            >
              {busy ? "Sending Code..." : "Continue with OTP →"}
            </button>

            {activeTab === "worker" && onSwitchToWorkerPortal && (
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={onSwitchToWorkerPortal}
                  style={{ background: "none", border: "none", color: "var(--orange)", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Want to register as a new worker? Join Here →
                </button>
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.88rem", color: "var(--text-muted)" }}>
                Enter the 6-digit OTP code sent to <strong>+91 {phone}</strong>
              </p>
              <button
                type="button"
                onClick={() => setStep("phone")}
                style={{ background: "none", border: "none", color: "var(--orange)", fontSize: "0.78rem", fontWeight: 700, cursor: "pointer", marginTop: "0.2rem" }}
              >
                Change Phone Number
              </button>
            </div>

            <div style={{ marginBottom: "1rem" }}>
              <input
                className="form-input"
                style={{ textAlign: "center", fontSize: "1.4rem", letterSpacing: "8px", fontWeight: 800 }}
                maxLength={6}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
              />
            </div>

            {debugOtp && (
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "10px", padding: "0.5rem 0.8rem", marginBottom: "1rem", textAlign: "center", fontSize: "0.82rem", color: "#065f46" }}>
                <span>Demo Code: <strong>{debugOtp}</strong></span>
                <button
                  type="button"
                  onClick={() => setCode(debugOtp)}
                  style={{ background: "none", border: "none", color: "var(--orange)", fontWeight: 700, marginLeft: "8px", cursor: "pointer", textDecoration: "underline" }}
                >
                  Auto-fill
                </button>
              </div>
            )}

            <div className="auth-timer-bar">
              <span>{timer > 0 ? `Resend code in ${timer}s` : "Didn't receive code?"}</span>
              <button
                type="button"
                className="auth-resend-btn"
                disabled={timer > 0 || busy}
                onClick={handleSendOtp}
              >
                Resend OTP
              </button>
            </div>

            {error && <div style={{ color: "#d94a1a", fontSize: "0.84rem", marginBottom: "0.8rem", textAlign: "center" }}>{error}</div>}
            {info && <div style={{ color: "var(--emerald)", fontSize: "0.84rem", marginBottom: "0.8rem", textAlign: "center" }}>{info}</div>}

            <button
              className="btn-secondary"
              type="submit"
              disabled={busy}
              style={{ width: "100%", padding: "0.85rem", justifyContent: "center", fontSize: "0.95rem" }}
            >
              {busy ? "Verifying..." : "Verify & Sign In"}
            </button>
          </form>
        )}

        {/* Alternative Google Sign In for Customers & Workers */}
        <div className="auth-divider">
          <span>{activeTab === "worker" ? "Or sign in as Trade Worker with" : "Or sign in with"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.4rem" }}>
          <div ref={googleButtonRef} />
          {activeTab === "worker" ? (
            <p style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 600, marginTop: "0.4rem", textAlign: "center" }}>
              <i className="fas fa-check-circle" style={{ marginRight: "4px" }} />
              Fast Google Sign-in for Plumbers, Electricians, Carpenters &amp; Masons
            </p>
          ) : (
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.4rem", textAlign: "center" }}>
              Quick, secure login for booking home &amp; repair services
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function UserProfileModal({
  user,
  bookingHistory,
  onClose,
  onSignOut,
  onBookMore,
  onShowToast
}: {
  user: AuthSession["user"];
  bookingHistory: BookingHistoryItem[];
  onClose: () => void;
  onSignOut: () => void;
  onBookMore: () => void;
  onShowToast?: (title: string, message: string, type?: "success" | "info" | "warn") => void;
}) {
  const initials = (user.name || user.phone || "CU")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card profile-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <div className="profile-header-banner">
          <div className="profile-avatar-circle">{initials}</div>
          <div className="profile-user-info">
            <h3 className="profile-user-name">{user.name || "Valued Customer"}</h3>
            <div className="profile-user-meta">
              <span><i className="fas fa-phone-alt" /> {user.phone ? `+91 ${user.phone}` : "No phone linked"}</span>
              {user.email && <span><i className="fas fa-envelope" /> {user.email}</span>}
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <span className="profile-badge-pill">
                <i className="fas fa-check-circle" /> Verified Customer • Guwahati
              </span>
            </div>
          </div>
        </div>

        <div className="profile-section-heading">
          <span>My Bookings &amp; Service History</span>
          <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {bookingHistory.length} total
          </span>
        </div>

        {bookingHistory.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.2rem 1.2rem", background: "#f8fafc", borderRadius: "18px", border: "1.5px dashed #cbd5e1" }}>
            <i className="fas fa-calendar-check" style={{ fontSize: "2.5rem", color: "#94a3b8", marginBottom: "0.8rem", display: "block" }} />
            <h4 style={{ color: "var(--navy)", marginBottom: "0.3rem" }}>No Bookings Yet</h4>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1.4rem", maxWidth: "380px", margin: "0 auto 1.2rem" }}>
              Need an electrician, plumber, carpenter, mason, or daily helper? Book verified professionals in 60 seconds with transparent rates.
            </p>
            <button className="btn-secondary" type="button" onClick={() => { onClose(); onBookMore(); }} style={{ padding: "0.65rem 1.8rem" }}>
              Find Skilled Workers
            </button>
          </div>
        ) : (
          <div style={{ maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
            {bookingHistory.map((item) => (
              <div className="profile-booking-item" key={item.bookingCode}>
                <div className="profile-booking-head">
                  <span className="profile-booking-code">#{item.bookingCode}</span>
                  <span className={`profile-status-badge ${item.status?.toLowerCase().includes("pend") ? "pending" : item.status?.toLowerCase().includes("comp") ? "completed" : "confirmed"}`}>
                    {item.status || "CONFIRMED"}
                  </span>
                </div>
                <div className="profile-booking-details">
                  <div><i className="fas fa-tools" /> <strong>{item.serviceSummary}</strong></div>
                  <div><i className="fas fa-calendar-alt" /> {item.preferredDate} ({item.preferredTimeSlot})</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "0.4rem" }}>
                    <span style={{ fontWeight: 800, color: "var(--navy)", fontSize: "0.95rem" }}>
                      Total: ₹{item.total.toLocaleString()}
                    </span>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(item.bookingCode);
                          }
                          onShowToast?.("Code Copied", `Booking code #${item.bookingCode} copied to clipboard`, "info");
                        }}
                        style={{ background: "#f1f5f9", border: "none", borderRadius: "6px", padding: "0.25rem 0.6rem", fontSize: "0.78rem", color: "var(--navy)", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        title="Copy booking code"
                      >
                        <i className="fas fa-copy" /> Copy
                      </button>
                      <a
                        href={`https://wa.me/919365123456?text=Hi%20Marac%20Workers%2C%20status%20for%20booking%20%23${item.bookingCode}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#16a34a", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <i className="fab fa-whatsapp" style={{ color: "#16a34a" }} /> Track
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.6rem", borderTop: "1px solid #e2e8f0", paddingTop: "1.2rem" }}>
          <button
            className="btn-outline"
            type="button"
            onClick={() => { onClose(); onBookMore(); }}
            style={{ flex: 1, padding: "0.75rem" }}
          >
            <i className="fas fa-plus" /> Book New Service
          </button>
          <button
            className="btn-secondary"
            type="button"
            onClick={onSignOut}
            style={{ padding: "0.75rem 1.4rem", background: "#ef4444", borderColor: "#ef4444" }}
          >
            <i className="fas fa-sign-out-alt" /> Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkerProfileModal({
  authSession,
  onClose,
  onOpenCustomerLogin,
  onOpenWorkerLogin,
  onShowToast
}: {
  authSession: AuthSession | null;
  onClose: () => void;
  onOpenCustomerLogin: () => void;
  onOpenWorkerLogin?: () => void;
  onShowToast?: (title: string, message: string, type?: "success" | "info" | "warn") => void;
}) {
  const [workerMode, setWorkerMode] = useState<"dashboard" | "register">("dashboard");
  const [isOnline, setIsOnline] = useState(true);
  const [acceptedJobs, setAcceptedJobs] = useState<string[]>([]);
  const [regForm, setRegForm] = useState({
    name: authSession?.user?.name || "",
    phone: authSession?.user?.phone || "",
    trade: "Electrician",
    locality: "Zoo Road",
    experience: "3-5 years",
    dailyRate: "800",
    aadhaarNumber: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createApiClient().createLead({
        name: regForm.name,
        phone: regForm.phone,
        source: "worker_registration",
        notes: `Trade: ${regForm.trade} | Area: ${regForm.locality} | Exp: ${regForm.experience} | Rate: ₹${regForm.dailyRate}/day | Aadhaar: ${regForm.aadhaarNumber}`
      });
      setSubmitted(true);
      onShowToast?.("Registration Submitted!", "Our Guwahati onboarding team will verify your documents within 2 hours", "success");
    } catch {
      // Local fallback
      setSubmitted(true);
      onShowToast?.("Registration Received!", "Application saved. Team will contact you shortly", "success");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card worker-portal-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        {/* Tab Toggle: My Worker Dashboard vs Register New Trade Pro */}
        <div className="auth-tabs" style={{ marginBottom: "1.2rem" }}>
          <button
            type="button"
            className={`auth-tab-btn ${workerMode === "dashboard" ? "active" : ""}`}
            onClick={() => setWorkerMode("dashboard")}
          >
            <i className="fas fa-id-card" /> Worker Dashboard
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${workerMode === "register" ? "active" : ""}`}
            onClick={() => setWorkerMode("register")}
          >
            <i className="fas fa-user-plus" /> Join as Trade Pro
          </button>
        </div>

        {workerMode === "dashboard" ? (
          <div>
            <div className="worker-dashboard-hero">
              <div className="worker-hero-top">
                <div className="worker-pro-strip">
                  <img
                    src="/images/workers/electrician.jpg"
                    alt="Verified Worker Profile"
                    className="worker-pro-avatar"
                  />
                  <div className="worker-pro-title">
                    <h3>{authSession?.user?.name || "Biswajit Saikia"}</h3>
                    <span className="worker-trade-pill">
                      <i className="fas fa-bolt" /> Licensed Electrician • Guwahati Pro
                    </span>
                  </div>
                </div>

                {/* Online / Offline Dispatch Toggle */}
                <button
                  type="button"
                  className={`worker-status-toggle ${isOnline ? "online" : "offline"}`}
                  onClick={() => {
                    const next = !isOnline;
                    setIsOnline(next);
                    onShowToast?.(
                      next ? "Dispatch Mode: ONLINE" : "Dispatch Mode: OFFLINE",
                      next ? "You are now active and receiving instant job alerts across Guwahati" : "Dispatch paused. You will not receive new customer calls",
                      next ? "success" : "info"
                    );
                  }}
                  title="Toggle your availability for instant job dispatch"
                >
                  <span className="worker-toggle-dot" />
                  <span>{isOnline ? "Online (Receiving Jobs)" : "Offline"}</span>
                </button>
              </div>

              {/* 4 Performance Metrics */}
              <div className="worker-metrics-grid">
                <div className="worker-metric-box">
                  <strong>142+</strong>
                  <span>Jobs Completed</span>
                </div>
                <div className="worker-metric-box">
                  <strong style={{ color: "#f59e0b" }}>4.9 ★</strong>
                  <span>Client Rating</span>
                </div>
                <div className="worker-metric-box">
                  <strong style={{ color: "#34d399" }}>₹34,500</strong>
                  <span>Month Earnings</span>
                </div>
                <div className="worker-metric-box">
                  <strong>98%</strong>
                  <span>On-Time Arrival</span>
                </div>
              </div>
            </div>

            {/* KYC Trust Signals */}
            <div className="worker-kyc-strip">
              <span className="worker-kyc-item"><i className="fas fa-shield-alt" /> Aadhaar KYC Verified</span>
              <span className="worker-kyc-item"><i className="fas fa-user-check" /> Guwahati Police Clearance</span>
              <span className="worker-kyc-item"><i className="fas fa-award" /> Marac Certified Master Pro</span>
            </div>

            <h4 style={{ color: "var(--navy)", margin: "1.2rem 0 0.8rem", fontSize: "1.1rem" }}>
              Available Jobs in Guwahati Today
            </h4>

            {/* Active Open Job 1 */}
            <div className="worker-job-card">
              <div className="worker-job-header">
                <span className="worker-job-trade"><i className="fas fa-bolt" style={{ color: "var(--orange)", marginRight: "6px" }} /> Emergency Switchboard Fix &amp; MCB Check</span>
                <span className="worker-job-payout">₹350</span>
              </div>
              <div className="worker-job-meta">
                <div><i className="fas fa-map-marker-alt" /> Zoo Road, Tiniali, Guwahati (1.4 km away)</div>
                <div><i className="fas fa-clock" /> Preferred: Today, 2:00 PM - 4:00 PM • Cash on Delivery</div>
              </div>
              <div className="worker-job-actions">
                {acceptedJobs.includes("MW-ZOO-101") ? (
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#065f46", padding: "0.45rem 0.9rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <i className="fas fa-check-circle" /> Assigned to You
                    </span>
                    <a
                      href="https://wa.me/919365123456?text=Hi%2C%20I%20am%20your%20Marac%20Workers%20technician%20for%20Job%20MW-ZOO-101.%20I%20am%20on%20my%20way."
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem", textDecoration: "none", background: "#16a34a", borderColor: "#16a34a" }}
                    >
                      <i className="fab fa-whatsapp" /> Contact Customer
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setAcceptedJobs((prev) => [...prev, "MW-ZOO-101"]);
                      onShowToast?.("Job Accepted!", "Dispatched to you! Customer phone & address sent to WhatsApp", "success");
                    }}
                    style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}
                  >
                    <i className="fas fa-check" /> Accept Job Dispatch
                  </button>
                )}
              </div>
            </div>

            {/* Active Open Job 2 */}
            <div className="worker-job-card">
              <div className="worker-job-header">
                <span className="worker-job-trade"><i className="fas fa-wrench" style={{ color: "var(--orange)", marginRight: "6px" }} /> Bathroom Basin Mixer Tap Leakage Repair</span>
                <span className="worker-job-payout">₹299</span>
              </div>
              <div className="worker-job-meta">
                <div><i className="fas fa-map-marker-alt" /> Beltola Chariali, Guwahati (2.1 km away)</div>
                <div><i className="fas fa-clock" /> Preferred: Today, 4:30 PM - 6:30 PM • Online Paid</div>
              </div>
              <div className="worker-job-actions">
                {acceptedJobs.includes("MW-BELT-202") ? (
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#065f46", padding: "0.45rem 0.9rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <i className="fas fa-check-circle" /> Assigned to You
                    </span>
                    <a
                      href="https://wa.me/919365123456?text=Hi%2C%20I%20am%20your%20Marac%20Workers%20technician%20for%20Job%20MW-BELT-202.%20I%20am%20on%20my%20way."
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{ padding: "0.45rem 0.9rem", fontSize: "0.82rem", textDecoration: "none", background: "#16a34a", borderColor: "#16a34a" }}
                    >
                      <i className="fab fa-whatsapp" /> Contact Customer
                    </a>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setAcceptedJobs((prev) => [...prev, "MW-BELT-202"]);
                      onShowToast?.("Job Accepted!", "Dispatched to you! Customer phone & address sent to WhatsApp", "success");
                    }}
                    style={{ padding: "0.5rem 1.2rem", fontSize: "0.85rem" }}
                  >
                    <i className="fas fa-check" /> Accept Job Dispatch
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : submitted ? (
          <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#10b981", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1rem" }}>
              ✓
            </div>
            <h3 style={{ color: "var(--navy)", marginBottom: "0.5rem" }}>Registration Submitted!</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.92rem", marginBottom: "1.4rem" }}>
              Thank you {regForm.name}! Our Guwahati partner onboarding team will review your trade profile and contact you on <strong>+91 {regForm.phone}</strong> within 2 hours.
            </p>
            <div style={{ display: "flex", gap: "0.8rem", justifyContent: "center" }}>
              <a
                href={`https://wa.me/919365123456?text=Hi%20Marac%20Workers%2C%20I%20registered%20as%20a%20${encodeURIComponent(regForm.trade)}%20(${encodeURIComponent(regForm.name)}).%20Please%20verify%20my%20documents.`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary"
                style={{ padding: "0.7rem 1.6rem", textDecoration: "none" }}
              >
                <i className="fab fa-whatsapp" /> Fast-Track on WhatsApp
              </a>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setWorkerMode("dashboard")}
                style={{ padding: "0.7rem 1.4rem" }}
              >
                View Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="worker-reg-form">
            <h3 style={{ color: "var(--navy)", marginBottom: "0.2rem" }}>Skilled Trade Partner Onboarding</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginBottom: "1rem" }}>
              Join Guwahati&apos;s leading network of verified electricians, plumbers, masons, carpenters, and daily wage helpers. Earn 100% direct payouts.
            </p>

            <div className="worker-reg-grid">
              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.3rem" }}>Full Name *</label>
                <input
                  className="form-input"
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="e.g. Biswajit Saikia"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.3rem" }}>Mobile Number *</label>
                <input
                  className="form-input"
                  required
                  type="tel"
                  maxLength={10}
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="10-digit mobile number"
                />
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.3rem" }}>Your Primary Trade *</label>
                <select
                  className="form-input"
                  value={regForm.trade}
                  onChange={(e) => setRegForm({ ...regForm, trade: e.target.value })}
                >
                  <option value="Electrician">Licensed Electrician</option>
                  <option value="Plumber">Master Plumber</option>
                  <option value="Daily Worker">Daily Wage Helper / Shifting</option>
                  <option value="Construction">Construction Site Worker</option>
                  <option value="Carpenter">Master Carpenter</option>
                  <option value="Mason">Mason / Rajmistri</option>
                  <option value="Painter">House Painter</option>
                  <option value="AC Repair">AC &amp; Appliance Specialist</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.3rem" }}>Guwahati Area / Hub *</label>
                <select
                  className="form-input"
                  value={regForm.locality}
                  onChange={(e) => setRegForm({ ...regForm, locality: e.target.value })}
                >
                  <option value="Zoo Road">Zoo Road / R.G. Baruah Rd</option>
                  <option value="Beltola">Beltola / Six Mile</option>
                  <option value="Paltan Bazaar">Paltan Bazaar / Station</option>
                  <option value="Dispur">Dispur / Ganeshguri</option>
                  <option value="Chandmari">Chandmari / Silpukhuri</option>
                  <option value="Jalukbari">Jalukbari / Maligaon</option>
                  <option value="Ulubari">Ulubari / Christian Basti</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.3rem" }}>Years of Experience</label>
                <select
                  className="form-input"
                  value={regForm.experience}
                  onChange={(e) => setRegForm({ ...regForm, experience: e.target.value })}
                >
                  <option value="1-2 years">1-2 years</option>
                  <option value="3-5 years">3-5 years</option>
                  <option value="5-10 years">5-10 years</option>
                  <option value="10+ years">10+ years (Master Craftsman)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.3rem" }}>Expected Daily Rate (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={regForm.dailyRate}
                  onChange={(e) => setRegForm({ ...regForm, dailyRate: e.target.value })}
                  placeholder="e.g. 800"
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--navy)", display: "block", marginBottom: "0.3rem" }}>Aadhaar Card Last 4 Digits (For Police Verification)</label>
              <input
                className="form-input"
                maxLength={4}
                value={regForm.aadhaarNumber}
                onChange={(e) => setRegForm({ ...regForm, aadhaarNumber: e.target.value })}
                placeholder="e.g. 5432"
              />
            </div>

            <button
              className="btn-secondary"
              type="submit"
              disabled={submitting}
              style={{ width: "100%", padding: "0.95rem", justifyContent: "center", marginTop: "0.5rem" }}
            >
              {submitting ? "Submitting Registration..." : "Complete Worker Registration →"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "1.2rem", paddingTop: "0.8rem", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--text-light)" }}>
          {onOpenWorkerLogin && (
            <button
              type="button"
              onClick={onOpenWorkerLogin}
              style={{ background: "none", border: "none", color: "#059669", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}
            >
              <i className="fab fa-google" style={{ marginRight: "4px" }} /> Worker Google Sign-In
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCustomerLogin}
            style={{ background: "none", border: "none", color: "var(--brand-orange)", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}
          >
            Switch to Customer Sign-in
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingModal({
  cartItems,
  total,
  form,
  errors,
  success,
  submitStatus,
  submitMessage,
  paymentStatus,
  paymentMessage,
  bookingResult,
  bookingRef,
  onClose,
  onSubmit,
  onPayOnline,
  onFormChange
}: {
  cartItems: CartItem[];
  total: number;
  form: BookingForm;
  errors: BookingFormErrors;
  success: boolean;
  submitStatus: SubmitStatus;
  submitMessage: string;
  paymentStatus: OnlinePaymentStatus;
  paymentMessage: string;
  bookingResult: BookingResult | null;
  bookingRef: string | null;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onPayOnline: () => void | Promise<void>;
  onFormChange: (field: keyof BookingForm, value: string) => void;
}) {
  const today = getTodayInputValue();
  const isSubmitting = submitStatus === "submitting";
  const canPayOnline = bookingResult?.source === "database" && bookingResult.paymentMode === "RAZORPAY" && paymentStatus !== "paid";

  if (success && bookingResult) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#1d9e6b", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1rem" }}>
              ✓
            </div>
            <h3>Booking Confirmed!</h3>
            <p style={{ color: "var(--text-muted)" }}>Booking Code: <strong style={{ color: "var(--navy)" }}>#{bookingRef}</strong></p>
          </div>

          <div style={{ background: "#f8fafd", padding: "1.2rem", borderRadius: "18px", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Customer:</span>
              <strong style={{ color: "var(--navy)" }}>{form.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ color: "var(--text-muted)" }}>Total Amount:</span>
              <strong style={{ color: "var(--orange)" }}>₹{total.toLocaleString()}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Payment Method:</span>
              <strong style={{ color: "var(--navy)" }}>{form.paymentMode === "COD" ? "Pay after work (Cash / UPI)" : "Online Razorpay"}</strong>
            </div>
          </div>

          {canPayOnline && (
            <button className="btn-secondary" style={{ width: "100%", marginBottom: "1rem", justifyContent: "center" }} type="button" onClick={onPayOnline}>
              <i className="fas fa-credit-card" /> Complete Online Payment
            </button>
          )}

          {paymentMessage && (
            <div style={{ fontSize: "0.85rem", color: paymentStatus === "paid" ? "#1d9e6b" : "var(--orange)", marginBottom: "1rem", textAlign: "center" }}>
              {paymentMessage}
            </div>
          )}

          {bookingRef && (
            <Link
              href={`/track?code=${encodeURIComponent(bookingRef)}`}
              className="btn-primary"
              style={{
                width: "100%",
                justifyContent: "center",
                marginBottom: "0.75rem",
                background: "#059669",
                borderColor: "#059669",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem"
              }}
            >
              <i className="fas fa-map-marked-alt" /> Track Service Partner Live
            </Link>
          )}

          <a
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            href={bookingResult.whatsappUrl}
            target="_blank"
            rel="noreferrer"
          >
            <i className="fab fa-whatsapp" /> Chat on WhatsApp for Updates
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <h3>Complete Your Booking</h3>
        <p className="sub">Provide your service address and preferred schedule.</p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              className="form-input"
              value={form.name}
              onChange={(e) => onFormChange("name", e.target.value)}
              placeholder="e.g. Rahul Sharma"
              required
            />
            {errors.name && <div style={{ color: "#d94a1a", fontSize: "0.8rem", marginTop: 4 }}>{errors.name}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                className="form-input"
                value={form.phone}
                onChange={(e) => onFormChange("phone", e.target.value)}
                placeholder="10-digit mobile"
                maxLength={10}
                required
              />
              {errors.phone && <div style={{ color: "#d94a1a", fontSize: "0.8rem", marginTop: 4 }}>{errors.phone}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Alternate Phone</label>
              <input
                className="form-input"
                value={form.alternatePhone}
                onChange={(e) => onFormChange("alternatePhone", e.target.value)}
                placeholder="Optional"
                maxLength={10}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">House / Flat No., Landmark, Full Address *</label>
            <input
              className="form-input"
              value={form.address}
              onChange={(e) => onFormChange("address", e.target.value)}
              placeholder="e.g. Flat 302, Green View Apts, GS Road"
              required
            />
            {errors.address && <div style={{ color: "#d94a1a", fontSize: "0.8rem", marginTop: 4 }}>{errors.address}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Preferred Date *</label>
              <input
                className="form-input"
                type="date"
                min={today}
                value={form.date}
                onChange={(e) => onFormChange("date", e.target.value)}
                required
              />
              {errors.date && <div style={{ color: "#d94a1a", fontSize: "0.8rem", marginTop: 4 }}>{errors.date}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Time Slot *</label>
              <select
                className="form-input"
                value={form.time}
                onChange={(e) => onFormChange("time", e.target.value)}
                required
              >
                <option value="">Select Time Slot</option>
                <option value="09:00 AM - 12:00 PM">Morning (09:00 AM - 12:00 PM)</option>
                <option value="12:00 PM - 03:00 PM">Afternoon (12:00 PM - 03:00 PM)</option>
                <option value="03:00 PM - 06:00 PM">Evening (03:00 PM - 06:00 PM)</option>
                <option value="Instant / As Soon as Possible">Instant / Urgent Dispatch</option>
              </select>
              {errors.time && <div style={{ color: "#d94a1a", fontSize: "0.8rem", marginTop: 4 }}>{errors.time}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Mode</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="radio"
                  name="paymentMode"
                  checked={form.paymentMode === "COD"}
                  onChange={() => onFormChange("paymentMode", "COD")}
                />
                Pay after service (Cash / UPI)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.4rem", cursor: "pointer", fontWeight: 600 }}>
                <input
                  type="radio"
                  name="paymentMode"
                  checked={form.paymentMode === "RAZORPAY"}
                  onChange={() => onFormChange("paymentMode", "RAZORPAY")}
                />
                Online Payment (Razorpay)
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Job Notes / Instructions</label>
            <input
              className="form-input"
              value={form.note}
              onChange={(e) => onFormChange("note", e.target.value)}
              placeholder="e.g. Please bring extra wire / ladders..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "1.4rem 0 1rem" }}>
            <div>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Total ({cartItems.length} items):</span>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "var(--navy)" }}>₹{total.toLocaleString()}</div>
            </div>
            <button className="btn-secondary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Confirming..." : "Confirm Booking →"}
            </button>
          </div>

          {submitMessage && (
            <div style={{ fontSize: "0.85rem", color: "var(--orange)", textAlign: "center" }}>
              {submitMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function mapApiServiceToServiceItem(service: ApiService, categoryMap: Map<string, ApiServiceCategory>): ServiceItem {
  const categoryObject = service.categoryId ? categoryMap.get(service.categoryId) : undefined;
  const slug = categoryObject?.slug ?? service.categoryId ?? "";
  const mappedCategory = categorySlugMap[slug] ?? "toilet";

  return {
    id: service.id,
    serviceId: service.id,
    category: mappedCategory,
    categoryLabel: categoryObject?.name ?? categoryLabels[mappedCategory],
    iconKey: resolveServiceIconKey(service.icon, [service.name, service.description, mappedCategory].filter(Boolean).join(" ")),
    name: service.name,
    description: service.description ?? "",
    price: service.basePrice,
    priceLabel: service.priceLabel ?? String(service.basePrice),
    imageUrl: service.imageUrl ?? undefined,
    durationLabel: service.durationMin ? `${service.durationMin} mins` : undefined,
    bookedQuantity: service.bookedQuantity ?? service.bookingCount ?? 0
  };
}

function getTodayInputValue() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function validateBookingForm(form: BookingForm, cartItems: CartItem[]) {
  const errors: BookingFormErrors = {};
  const today = getTodayInputValue();

  if (!form.name || form.name.length < 2) errors.name = "Enter the customer name.";
  if (!/^[6-9]\d{9}$/.test(form.phone)) errors.phone = "Enter a valid 10-digit Indian mobile number.";
  if (!form.address || form.address.length < 5) errors.address = "Enter the full address.";
  if (!form.date) errors.date = "Choose a service date.";
  if (form.date && form.date < today) errors.date = "Choose today or a future date.";
  if (!form.time) errors.time = "Choose a preferred time slot.";
  if (cartItems.length === 0) errors.cart = "Add at least one service.";

  return errors;
}

function createBookingPayload(form: BookingForm, cartItems: CartItem[], total: number, userId?: string): BookingCreateInput {
  const notes = [
    form.alternatePhone ? `Alternate: ${form.alternatePhone}` : "",
    form.note
  ].filter(Boolean).join("\n");

  return {
    userId,
    customerName: form.name,
    customerPhone: form.phone,
    addressLine: form.address,
    city: form.city || "Guwahati",
    preferredDate: form.date,
    preferredTimeSlot: form.time,
    notes: notes || undefined,
    paymentMode: form.paymentMode,
    totalAmount: Math.round(total),
    items: cartItems.map((item) => ({
      serviceId: item.serviceId,
      serviceName: item.name,
      quantity: item.quantity,
      unitPrice: Math.round(item.price)
    }))
  };
}

function createLocalBookingCode() {
  return `MW-${Date.now().toString().slice(-6)}`;
}

function loadRazorpayCheckout() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(true), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
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

function getServiceSummary(items: BookingCreateInput["items"]) {
  return items.map((item) => `${item.serviceName}${item.quantity > 1 ? ` x${item.quantity}` : ""}`).join(", ");
}

function createWhatsappUrl(bookingCode: string, payload: BookingCreateInput) {
  const message = [
    `New Marac Workers Booking - #${bookingCode}`,
    `Name: ${payload.customerName}`,
    `Phone: ${payload.customerPhone}`,
    `Address: ${payload.addressLine}`,
    `City: ${payload.city}`,
    `Services: ${getServiceSummary(payload.items)}`,
    `Schedule: ${payload.preferredDate} (${payload.preferredTimeSlot})`,
    `Payment: ${payload.paymentMode}`,
    `Total: Rs. ${payload.totalAmount.toLocaleString()}`,
    payload.notes ? `Instructions: ${payload.notes}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/919365123456?text=${encodeURIComponent(message)}`;
}

function createHistoryItem(booking: Booking, payload: BookingCreateInput, source: BookingSource): BookingHistoryItem {
  return {
    bookingCode: booking.bookingCode,
    serviceSummary: getServiceSummary(payload.items),
    total: payload.totalAmount,
    preferredDate: payload.preferredDate,
    preferredTimeSlot: payload.preferredTimeSlot,
    status: booking.status,
    source,
    createdAt: booking.createdAt
  };
}

export function SiteFooter({
  onOpenAuth,
  onOpenRole
}: {
  onOpenAuth?: () => void;
  onOpenRole?: () => void;
} = {}) {
  return (
    <footer id="contact" className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-logo">
              <i className="fas fa-hard-hat" style={{ color: "var(--orange)" }} />
              <span className="marac">MARAC</span>
              <span className="workers">WORKERS</span>
            </div>
            <p>Find Skilled Workers. Get the Job Done.</p>
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "1.2rem", flexWrap: "wrap" }}>
              <span style={{ background: "#1a2b44", padding: "0.4rem 1rem", borderRadius: "40px", fontSize: "0.75rem", color: "white", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="fab fa-google-play" /> Google Play
              </span>
              <span style={{ background: "#1a2b44", padding: "0.4rem 1rem", borderRadius: "40px", fontSize: "0.75rem", color: "white", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                <i className="fab fa-apple" /> App Store
              </span>
            </div>
          </div>

          <div className="footer-col">
            <h5>Quick Links</h5>
            <Link href="/#home">Home</Link>
            <Link href="/#services">Services</Link>
            <Link href="/#howitworks">How It Works</Link>
            <Link href="/#become">Become a Worker</Link>
            <Link href="/about">About Us</Link>
            <Link href="/#contact">Contact</Link>
          </div>

          <div className="footer-col">
            <h5>For Customers</h5>
            <a onClick={() => onOpenAuth?.()} style={{ cursor: onOpenAuth ? "pointer" : "default" }}>Customer Login</a>
            <a onClick={() => onOpenRole?.()} style={{ cursor: onOpenRole ? "pointer" : "default" }}>Register</a>
            <Link href="/#howitworks">How to Book</Link>
            <Link href="/#services">Service Rates</Link>
            <a href="https://wa.me/919365123456" target="_blank" rel="noreferrer">Help & Support</a>
          </div>

          <div className="footer-col">
            <h5>For Workers</h5>
            <a onClick={() => onOpenAuth?.()} style={{ cursor: onOpenAuth ? "pointer" : "default" }}>Worker Login</a>
            <a href="https://wa.me/919365123456?text=Worker%20Registration" target="_blank" rel="noreferrer">Join as Worker</a>
            <Link href="/#howitworks">How It Works</Link>
            <Link href="/#become">Earnings Guide</Link>
            <Link href="/terms">Safety Guidelines</Link>
          </div>

          <div className="footer-col">
            <h5>Contact Us</h5>
            <p><i className="fas fa-phone-alt" style={{ width: "1.4rem" }} /> +91 93651 23456</p>
            <p><i className="fas fa-envelope" style={{ width: "1.4rem" }} /> support@maracworkers.com</p>
            <p><i className="fas fa-map-marker-alt" style={{ width: "1.4rem" }} /> GS Road, Guwahati, Assam</p>
            <div className="footer-social">
              <a href="#"><i className="fab fa-facebook-f" /></a>
              <a href="#"><i className="fab fa-instagram" /></a>
              <a href="#"><i className="fab fa-youtube" /></a>
              <a href="#"><i className="fab fa-linkedin-in" /></a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Marac Workers. All Rights Reserved.</span>
          <span>
            <Link href="/terms">Privacy Policy</Link>
            <Link href="/terms">Terms & Conditions</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
