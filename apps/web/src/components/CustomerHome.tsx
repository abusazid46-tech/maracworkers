"use client";

import { createApiClient } from "@the-wings/api-client";
import type {
  AuthSession,
  Booking,
  BookingCreateInput,
  OfferBanner,
  PaymentMode,
  RazorpayOrderResponse,
  Service as ApiService,
  ServiceCategory as ApiServiceCategory
} from "@the-wings/types";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveServiceIconKey, ServiceIcon, type ServiceIconKey } from "./ServiceIcon";
import {
  businessAddress,
  businessName,
  businessPhone,
  faqItems,
  seoServices,
  serviceAreas,
  siteUrl,
  whatsappUrl
} from "./seo-data";
import { categoryLabels, quickServices, searchTerms, services, type ServiceCategoryId, type ServiceItem } from "./site-data";

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

const fallbackOfferImage = "/images/offer-cleaning.png";
const categories: Array<{ id: "all" | ServiceCategoryId; label: string; iconKey: ServiceIconKey }> = [
  { id: "all", label: "All Services", iconKey: "all" },
  { id: "toilet", label: "Toilet & Bath", iconKey: "bathroom" },
  { id: "tank", label: "Tank Wash", iconKey: "tank" },
  { id: "ac", label: "AC & Repair", iconKey: "ac" },
  { id: "sofa", label: "Sofa Clean", iconKey: "sofa" },
  { id: "kitchen", label: "Kitchen & Appliances", iconKey: "kitchen" },
  { id: "deep", label: "Deep Clean", iconKey: "home" },
  { id: "pest", label: "Pest Control", iconKey: "pest" },
  { id: "painter", label: "Painter & Plumber", iconKey: "painting" },
  { id: "salon", label: "Saloon & Spa", iconKey: "salon" },
  { id: "maid", label: "Aya & Housemaid", iconKey: "home" },
  { id: "security", label: "Security", iconKey: "security" }
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

const bookingHistoryKey = "marac_customer_bookings";
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const serviceCity = "Guwahati";
const guwahatiCenter = { lat: 26.1445, lng: 91.7362 };
const serviceRadiusKm = 35;

const categorySlugMap: Record<string, ServiceCategoryId> = {
  "toilet-bath": "toilet",
  "toilet-and-bath": "toilet",
  "toilet": "toilet",
  "bath": "toilet",
  "bathroom": "toilet",
  "cat_toilet_bath": "toilet",
  "tank-wash": "tank",
  "tankwash": "tank",
  "tank": "tank",
  "cat_tank_wash": "tank",
  "ac-repair": "ac",
  "ac-and-repair": "ac",
  "ac-and-electric": "ac",
  "ac-electric": "ac",
  "ac": "ac",
  "cat_ac_repair": "ac",
  "sofa-clean": "sofa",
  "sofa": "sofa",
  "cat_sofa_clean": "sofa",
  "deep-clean": "deep",
  "deep": "deep",
  "cat_deep_clean": "deep",
  "kitchen-appliances": "kitchen",
  "kitchen-and-appliances": "kitchen",
  "kitchen": "kitchen",
  "cat_kitchen_appliances": "kitchen",
  "aya-housemaid": "maid",
  "aya-and-housemaid": "maid",
  "maid": "maid",
  "cat_aya_housemaid": "maid",
  "pest-control": "pest",
  "pest": "pest",
  "cat_pest_control": "pest",
  "painter-plumber": "painter",
  "painter-and-plumber": "painter",
  "painter": "painter",
  "cat_painter_plumber": "painter",
  "saloon-spa": "salon",
  "saloon-and-spa": "salon",
  "salon-spa": "salon",
  "salon": "salon",
  "cat_saloon_spa": "salon",
  "security": "security",
  "cat_security": "security"
};

export function CustomerHome() {
  const [placeholder, setPlaceholder] = useState("Search for 'Electrician'");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
  const [popularServiceCatalog, setPopularServiceCatalog] = useState<ServiceItem[]>(services.slice(0, 6));
  const [offerBanners, setOfferBanners] = useState<OfferBanner[]>([]);
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState<BookingFormErrors>({});
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<OnlinePaymentStatus>("idle");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [bookingRef, setBookingRef] = useState<string | null>(null);
  const [confirmedPayload, setConfirmedPayload] = useState<BookingCreateInput | null>(null);
  const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [activeLang, setActiveLang] = useState<"en" | "as" | "hi">("en");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const catalogRequestRef = useRef(0);

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
      const [categoriesResponse, servicesResponse, popularResponse, offersResponse] = await Promise.allSettled([
        api.getServiceCategories(),
        api.getServices(),
        api.getPopularServices(),
        api.getOfferBanners()
      ]);

      if (requestId !== catalogRequestRef.current) return;

      const remoteCategories = categoriesResponse.status === "fulfilled" ? categoriesResponse.value.data : [];
      const remoteServices = servicesResponse.status === "fulfilled" ? servicesResponse.value.data : [];
      const remotePopularServices = popularResponse.status === "fulfilled" ? popularResponse.value.data : [];

      if (offersResponse.status === "fulfilled") {
        setOfferBanners(offersResponse.value.data);
      }

      if (remoteServices.length > 0) {
        const categoryMap = new Map(remoteCategories.map((cat: ApiServiceCategory) => [cat.id, cat]));
        const mapped = remoteServices.map((service: ApiService) => mapApiServiceToServiceItem(service, categoryMap));
        setServiceCatalog(mapped);

        if (remotePopularServices.length > 0) {
          const mappedPopular = remotePopularServices.map((service: ApiService) => mapApiServiceToServiceItem(service, categoryMap));
          setPopularServiceCatalog(mappedPopular);
        } else {
          setPopularServiceCatalog(mapped.slice(0, 6));
        }
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
        if (active) setAuthSession(response.data);
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

  function browseCategory(catId: ServiceCategoryId) {
    setCategory(catId);
    setCategoryModalOpen(true);
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
      setConfirmedPayload(payload);
      setSuccess(true);
      setSubmitStatus("success");
      setSubmitMessage("Booking created successfully!");

      const historyItem = createHistoryItem(bookingData, payload, "database");
      const nextHistory = [historyItem, ...bookingHistory.filter((h) => h.bookingCode !== historyItem.bookingCode)];
      setBookingHistory(nextHistory);
      try {
        window.localStorage.setItem(bookingHistoryKey, JSON.stringify(nextHistory));
      } catch {}
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
      setConfirmedPayload(payload);
      setSuccess(true);
      setSubmitStatus("offline");
      setSubmitMessage("Saved offline. Please share details with our team on WhatsApp.");
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
    } catch {}
    setAuthSession(null);
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
      <HomepageStructuredData />

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
            <li><a href="#become" onClick={() => setMobileMenuOpen(false)}>Become a Worker</a></li>
            <li><a href="#about" onClick={() => setMobileMenuOpen(false)}>About Us</a></li>
            <li><a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a></li>
          </ul>

          <div className="nav-actions">
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
              <button className="btn-outline" type="button" onClick={signOut} title="Sign out" style={{ padding: "0.5rem 1.2rem" }}>
                <i className="fas fa-user-circle" />
                <span>{authSession.user.name || authSession.user.phone || "Account"}</span>
              </button>
            ) : (
              <>
                <button className="btn-outline" type="button" onClick={() => setRoleModalOpen(true)}>Login</button>
                <button className="btn-secondary" type="button" onClick={() => setRoleModalOpen(true)} style={{ padding: "0.55rem 1.6rem", fontSize: "0.92rem" }}>
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

      {/* HERO SECTION */}
      <section id="home" className="container hero">
        <div className="hero-left">
          <div className="trust-badge">
            <i className="fas fa-map-pin" /> Building Guwahati&apos;s Trusted Worker Network
          </div>
          <h1>
            Find Skilled<br />
            Workers Near You,<br />
            <span className="highlight">Instantly.</span>
          </h1>
          <p>
            From electricians and plumbers to carpenters, painters and daily workers — find the right verified professional for your job.
          </p>

          {/* Search Box */}
          <div className="search-box">
            <select value={selectedHeroCategory} onChange={(e) => setSelectedHeroCategory(e.target.value)}>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Painter">Painter</option>
              <option value="Construction">Construction</option>
              <option value="AC Repair">AC Repair</option>
              <option value="Cleaning">Deep Cleaning</option>
            </select>
            <input
              type="text"
              placeholder="Enter location"
              value={location.label}
              onClick={() => setLocationModalOpen(true)}
              readOnly
              style={{ cursor: "pointer" }}
            />
            <button className="btn-secondary" type="button" onClick={handleFindWorkers}>
              <i className="fas fa-search" /> Find Workers
            </button>
          </div>

          <div className="hero-avatars">
            <div className="avatar-group">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="worker" />
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="worker" />
              <img src="https://randomuser.me/api/portraits/men/75.jpg" alt="worker" />
              <img src="https://randomuser.me/api/portraits/women/68.jpg" alt="worker" />
            </div>
            <div className="hero-stats">
              <strong>500+ Skilled Professionals</strong>
              <span>ready to help you across Guwahati</span>
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="hero-visual">
            <img src="https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&h=400&fit=crop&crop=face" alt="plumber" />
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f8e3?w=400&h=400&fit=crop&crop=face" alt="construction" />
            <img src="https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop&crop=face" alt="electrician" />
            <img src="https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?w=400&h=400&fit=crop&crop=face" alt="painter" />
            <div className="pin-badge">
              <i className="fas fa-map-pin" /> Guwahati
            </div>
          </div>
          <div className="bg-glow" />
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

          {/* Service Cards Grid */}
          <div className="service-grid">
            {visibleHomeServices.map((service) => {
              const isAdded = Boolean(cart[String(service.id)]);
              return (
                <div className="service-card" key={service.id}>
                  <div className="service-icon-wrap">
                    <ServiceIcon name={service.iconKey} title={service.name} style={{ width: 36, height: 36 }} />
                  </div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="service-card-price-row">
                    <div className="service-card-price">₹{service.price.toLocaleString()}</div>
                    <button
                      className="service-card-btn"
                      type="button"
                      onClick={() => addService(service)}
                      style={{ background: isAdded ? "#1d9e6b" : undefined }}
                    >
                      {isAdded ? "✓ Added" : "+ Add"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* POPULAR NEAR YOU CHIPS */}
      <section className="section container">
        <h2 className="section-title" style={{ fontSize: "2.2rem" }}>Popular Services in Guwahati</h2>
        <p className="section-sub">Frequently requested services and skilled worker bookings.</p>
        <div className="popular-grid">
          <div className="popular-item" onClick={() => handleQuickChip("Electrician")}>
            <i className="fas fa-bolt" /> Home Electrician
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Plumber")}>
            <i className="fas fa-wrench" /> Emergency Plumber
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("AC")}>
            <i className="fas fa-snowflake" /> AC Repair
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Carpenter")}>
            <i className="fas fa-hammer" /> Carpenter
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Painter")}>
            <i className="fas fa-paint-roller" /> House Painting
          </div>
          <div className="popular-item" onClick={() => handleQuickChip("Labour")}>
            <i className="fas fa-hard-hat" /> Daily Labour
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
              <a href="#home">Home</a>
              <a href="#services">Services</a>
              <a href="#howitworks">How It Works</a>
              <a href="#become">Become a Worker</a>
              <a href="#about">About Us</a>
              <a href="#contact">Contact</a>
            </div>

            <div className="footer-col">
              <h5>For Customers</h5>
              <a onClick={() => setAuthModalOpen(true)}>Customer Login</a>
              <a onClick={() => setRoleModalOpen(true)}>Register</a>
              <a href="#howitworks">How to Book</a>
              <a href="#services">Service Rates</a>
              <a href="https://wa.me/919365123456" target="_blank" rel="noreferrer">Help & Support</a>
            </div>

            <div className="footer-col">
              <h5>For Workers</h5>
              <a onClick={() => setAuthModalOpen(true)}>Worker Login</a>
              <a href="https://wa.me/919365123456?text=Worker%20Registration" target="_blank" rel="noreferrer">Join as Worker</a>
              <a href="#howitworks">How It Works</a>
              <a href="#become">Earnings Guide</a>
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
        <div className="checkout-bar" role="status">
          <div>
            <strong>{cartCount} service{cartCount === 1 ? "" : "s"} in cart</strong>
            <span>Total: ₹{total.toLocaleString()} · Pay after work</span>
          </div>
          <button type="button" onClick={openCart}>
            Review Cart (₹{total.toLocaleString()}) →
          </button>
        </div>
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
            <p className="sub">Continue as a customer or skilled worker.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <button
                className="btn-primary"
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  setAuthModalOpen(true);
                }}
                style={{ width: "100%", padding: "1rem" }}
              >
                <i className="fas fa-user" /> Continue as Customer
              </button>
              <button
                className="btn-secondary"
                type="button"
                onClick={() => {
                  setRoleModalOpen(false);
                  window.open("https://wa.me/919365123456?text=Hi%20Marac%20Workers%2C%20I%20want%20to%20register%20as%20a%20skilled%20worker.", "_blank");
                }}
                style={{ width: "100%", padding: "1rem" }}
              >
                <i className="fas fa-hard-hat" /> Continue as Worker
              </button>
            </div>
          </div>
        </div>
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
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(session) => {
            setAuthSession(session);
            setAuthModalOpen(false);
          }}
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
          bookingHistory={bookingHistory}
          authSession={authSession}
          onClose={() => {
            setBookingModalOpen(false);
            setSuccess(false);
          }}
          onOpenAuth={() => setAuthModalOpen(true)}
          onSubmit={confirmBooking}
          onPayOnline={startOnlinePayment}
          onFormChange={updateForm}
          onQuantityChange={updateCartQuantity}
          onRemove={removeService}
          onClearCart={() => setCart({})}
        />
      )}
    </>
  );
}

function HomepageStructuredData() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#localbusiness`,
    name: businessName,
    url: siteUrl,
    telephone: businessPhone,
    image: `${siteUrl}/favicon.png`,
    priceRange: "₹₹",
    address: {
      "@type": "PostalAddress",
      streetAddress: businessAddress.streetAddress,
      addressLocality: businessAddress.addressLocality,
      addressRegion: businessAddress.addressRegion,
      postalCode: businessAddress.postalCode,
      addressCountry: businessAddress.addressCountry
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: guwahatiCenter.lat,
      longitude: guwahatiCenter.lng
    },
    areaServed: serviceAreas.map((area) => ({
      "@type": "AdministrativeArea",
      name: area
    }))
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: businessName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify([localBusinessSchema, websiteSchema, faqSchema]).replace(/</g, "\\u003c")
      }}
    />
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
  onClose,
  onSuccess
}: {
  onClose: () => void;
  onSuccess: (session: AuthSession) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Use Google to continue securely.");
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
          setStatus("Verifying Google account...");
          try {
            const result = await createApiClient().loginWithGoogle({ credential: response.credential });
            onSuccess(result.data);
          } catch {
            setError("Google login failed. Please try again.");
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <h3>Customer Login</h3>
        <p className="sub">Sign in to track your bookings and access priority worker dispatch.</p>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", margin: "1.5rem 0" }}>
          <div ref={googleButtonRef} />
          {!googleClientId && (
            <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              Google Sign-In is configured for production.
            </div>
          )}
          {busy && <div style={{ color: "var(--orange)", fontWeight: 600 }}>{status}</div>}
          {error && <div style={{ color: "#d94a1a", fontSize: "0.88rem" }}>{error}</div>}
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
  bookingHistory,
  authSession,
  onClose,
  onOpenAuth,
  onSubmit,
  onPayOnline,
  onFormChange,
  onQuantityChange,
  onRemove,
  onClearCart
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
  bookingHistory: BookingHistoryItem[];
  authSession: AuthSession | null;
  onClose: () => void;
  onOpenAuth: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onPayOnline: () => void | Promise<void>;
  onFormChange: (field: keyof BookingForm, value: string) => void;
  onQuantityChange: (serviceId: ServiceItem["id"], quantity: number) => void;
  onRemove: (serviceId: ServiceItem["id"]) => void;
  onClearCart: () => void;
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
    iconKey: resolveServiceIconKey(service.iconKey ?? categoryObject?.iconKey, mappedCategory),
    name: service.name,
    description: service.description ?? "",
    price: service.price,
    priceLabel: String(service.price),
    imageUrl: service.imageUrl ?? undefined,
    durationLabel: service.durationMinutes ? `${service.durationMinutes} mins` : undefined,
    bookedQuantity: service.bookingCount ?? 0
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
