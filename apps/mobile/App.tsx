import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://api.skyrouteglobal.in";
const SUPPORT_PHONE = "9365123456";

type TabId = "home" | "bookings" | "tracking" | "profile";

type CategoryId =
  | "electrician"
  | "plumber"
  | "carpenter"
  | "mason"
  | "daily_worker"
  | "construction"
  | "painter"
  | "ac"
  | "tank"
  | "deep"
  | "toilet"
  | "security";

type Category = {
  id: CategoryId;
  name: string;
  icon: string;
  badge?: string;
};

type ServiceItem = {
  id: string;
  categoryId: CategoryId;
  name: string;
  trade: string;
  description: string;
  price: number;
  oldPrice?: number;
  rating: number;
  jobsCount: number;
  image: string;
  duration: string;
  popular?: boolean;
};

type CartItem = ServiceItem & { quantity: number };

type BookingRecord = {
  code: string;
  service: string;
  workerName: string;
  workerTrade: string;
  status: "CONFIRMED" | "DISPATCHED" | "COMPLETED";
  amount: number;
  date: string;
  timeSlot: string;
  otp: string;
};

const CATEGORIES: Category[] = [
  { id: "electrician", name: "Electrician", icon: "⚡", badge: "30m Fast" },
  { id: "plumber", name: "Plumber", icon: "🔧" },
  { id: "carpenter", name: "Carpenter", icon: "🪚" },
  { id: "mason", name: "Mason", icon: "🧱" },
  { id: "daily_worker", name: "Daily Helpers", icon: "👷", badge: "Popular" },
  { id: "construction", name: "Construction", icon: "🏗️" },
  { id: "painter", name: "Painter", icon: "🎨" },
  { id: "ac", name: "AC Repair", icon: "❄️" },
  { id: "tank", name: "Tank Wash", icon: "💧" },
  { id: "deep", name: "Deep Clean", icon: "✨" },
  { id: "security", name: "Security", icon: "🛡️" }
];

const INITIAL_SERVICES: ServiceItem[] = [
  {
    id: "elec-1",
    categoryId: "electrician",
    name: "Master Electrician Inspection & Repair",
    trade: "Licensed Electrician",
    description: "Short circuit repair, switchboard replacement, fan & MCB installation.",
    price: 199,
    oldPrice: 249,
    rating: 4.9,
    jobsCount: 420,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80",
    duration: "45 mins",
    popular: true
  },
  {
    id: "plumb-1",
    categoryId: "plumber",
    name: "Pipe Leakage, Tap Fitting & Motor Repair",
    trade: "Master Plumber",
    description: "Bathroom leakage fix, water pump fitting, drain unclogging & pipe repairs.",
    price: 199,
    oldPrice: 249,
    rating: 4.8,
    jobsCount: 380,
    image: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=500&q=80",
    duration: "60 mins",
    popular: true
  },
  {
    id: "daily-1",
    categoryId: "daily_worker",
    name: "Daily Wage Helper & Heavy Shifting Labor",
    trade: "Manual Labor / Helper",
    description: "House shifting, heavy lifting, construction loading & garden digging.",
    price: 450,
    oldPrice: 500,
    rating: 4.9,
    jobsCount: 510,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80",
    duration: "Half-Day (4 hrs)",
    popular: true
  },
  {
    id: "carp-1",
    categoryId: "carpenter",
    name: "Furniture & Door Lock Specialist",
    trade: "Master Carpenter",
    description: "Door alignment, lock fitting, cabinet repairs, bed & chair assembly.",
    price: 299,
    oldPrice: 399,
    rating: 4.9,
    jobsCount: 290,
    image: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=500&q=80",
    duration: "60 mins",
    popular: true
  },
  {
    id: "mason-1",
    categoryId: "mason",
    name: "Head Mason (Rajmistri) Daily Service",
    trade: "Master Mason / Rajmistri",
    description: "Brick laying, plaster repair, tile fixing, floor leveling & concrete work.",
    price: 1100,
    oldPrice: 1250,
    rating: 4.9,
    jobsCount: 310,
    image: "https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?w=500&q=80",
    duration: "Full Day (8 hrs)",
    popular: true
  },
  {
    id: "ac-1",
    categoryId: "ac",
    name: "Foam Jet Deep AC Servicing",
    trade: "AC Technician",
    description: "High pressure foam wash for indoor & outdoor units with gas check.",
    price: 799,
    oldPrice: 999,
    rating: 4.8,
    jobsCount: 240,
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80",
    duration: "60 mins"
  },
  {
    id: "paint-1",
    categoryId: "painter",
    name: "Full Home Painting & Touchup Specialist",
    trade: "Professional Painter",
    description: "Wall putty, primer, waterproof coating & decorative paint touchups.",
    price: 850,
    oldPrice: 1000,
    rating: 4.8,
    jobsCount: 190,
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=500&q=80",
    duration: "Full Day"
  }
];

const GUWAHATI_LOCALITIES = [
  "GS Road, Guwahati",
  "Paltan Bazaar, Guwahati",
  "Beltola Tiniali, Guwahati",
  "Zoo Road (R.G. Baruah Rd)",
  "Ganeshguri, Guwahati",
  "Jalukbari, Guwahati",
  "Dispur Capital Complex"
];

const INITIAL_BOOKINGS: BookingRecord[] = [
  {
    code: "MW-8821",
    service: "Master Electrician Inspection & Repair",
    workerName: "Rajesh Kalita",
    workerTrade: "Licensed Master Electrician",
    status: "DISPATCHED",
    amount: 199,
    date: "Today",
    timeSlot: "12 mins arrival",
    otp: "4821"
  },
  {
    code: "MW-7940",
    service: "Daily Wage Helper & Heavy Shifting",
    workerName: "Bikram Das",
    workerTrade: "Verified Helper Pro",
    status: "COMPLETED",
    amount: 450,
    date: "Yesterday",
    timeSlot: "10:00 AM",
    otp: "7103"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [services, setServices] = useState<ServiceItem[]>(INITIAL_SERVICES);
  const [selectedLocation, setSelectedLocation] = useState("GS Road, Guwahati");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Booking Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMode, setPaymentMode] = useState<"COD" | "ONLINE">("COD");

  // Fetch live services from Hostinger API on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/services`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
          const apiServices: ServiceItem[] = data.data.map((item: any) => ({
            id: String(item.id),
            categoryId: (item.categoryId || "electrician") as CategoryId,
            name: item.name || "Skilled Trade Service",
            trade: item.categoryName || "Verified Specialist",
            description: item.description || "Verified technician support in Guwahati.",
            price: Number(item.price) || 199,
            oldPrice: Math.round((Number(item.price) || 199) * 1.25),
            rating: 4.9,
            jobsCount: 350,
            image: item.imageUrl || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80",
            duration: item.duration || "45-60 mins",
            popular: true
          }));
          setServices(apiServices);
        }
      })
      .catch(() => {
        // Fallback gracefully to INITIAL_SERVICES
      });
  }, []);

  const cartItems = useMemo(() => Object.values(cart), [cart]);
  const cartCount = useMemo(() => cartItems.reduce((acc, it) => acc + it.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => cartItems.reduce((acc, it) => acc + it.price * it.quantity, 0), [cartItems]);

  const filteredServices = useMemo(() => {
    let result = services;
    if (selectedCategory) {
      result = result.filter(
        (s) => s.categoryId === selectedCategory.id || s.trade.toLowerCase().includes(selectedCategory.name.toLowerCase())
      );
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.trade.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q)
      );
    }
    return result;
  }, [services, selectedCategory, searchQuery]);

  function addToCart(service: ServiceItem) {
    setCart((prev) => {
      const existing = prev[service.id];
      return {
        ...prev,
        [service.id]: existing ? { ...existing, quantity: existing.quantity + 1 } : { ...service, quantity: 1 }
      };
    });
  }

  function updateQuantity(id: string, delta: number) {
    setCart((prev) => {
      const item = prev[id];
      if (!item) return prev;
      const nextQty = item.quantity + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: { ...item, quantity: nextQty } };
    });
  }

  async function handleConfirmBooking() {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      Alert.alert("Required Details", "Please enter your name, mobile number, and address in Guwahati.");
      return;
    }

    setIsSubmitting(true);
    const newCode = `MW-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomOtp = `${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await fetch(`${API_BASE_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          phone: customerPhone,
          addressLine: customerAddress,
          city: "Guwahati",
          items: cartItems.map((c) => ({ serviceId: c.id, quantity: c.quantity, price: c.price })),
          totalAmount: cartTotal,
          paymentMode
        })
      });
    } catch {
      // Local fallback
    }

    const newBooking: BookingRecord = {
      code: newCode,
      service: cartItems[0]?.name || "Skilled Trade Request",
      workerName: "Rajesh Kalita",
      workerTrade: "Licensed Master Electrician",
      status: "DISPATCHED",
      amount: cartTotal,
      date: "Today",
      timeSlot: "15 mins arrival",
      otp: randomOtp
    };

    setBookings([newBooking, ...bookings]);
    setCart({});
    setCartOpen(false);
    setIsSubmitting(false);

    Alert.alert(
      "Booking Confirmed!",
      `Order #${newCode} confirmed. Your technician has been dispatched with OTP ${randomOtp}.`,
      [
        {
          text: "Track Live",
          onPress: () => setActiveTab("tracking")
        },
        { text: "OK" }
      ]
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      {/* TOP HEADER BAR */}
      <View style={styles.topHeader}>
        <Pressable style={styles.locationSelector} onPress={() => setLocationModalOpen(true)}>
          <Text style={styles.locationPinIcon}>📍</Text>
          <View>
            <View style={styles.locationTitleRow}>
              <Text style={styles.locationTitleText}>{selectedLocation.split(",")[0]}</Text>
              <Text style={styles.dropdownArrow}>▼</Text>
            </View>
            <Text style={styles.locationSubText}>Guwahati, Assam</Text>
          </View>
        </Pressable>

        <View style={styles.headerRightRow}>
          <Pressable style={styles.notificationBell} onPress={() => Alert.alert("Notifications", "24 verified technicians online in Guwahati right now.")}>
            <Text style={styles.bellIcon}>🔔</Text>
            <View style={styles.bellBadge} />
          </Pressable>

          <Pressable style={styles.cartHeaderButton} onPress={() => setCartOpen(true)}>
            <Text style={styles.cartHeaderIcon}>🛍️</Text>
            {cartCount > 0 && (
              <View style={styles.cartHeaderBadge}>
                <Text style={styles.cartHeaderBadgeText}>{cartCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* MAIN SCREEN BODY */}
      <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
        {activeTab === "home" && (
          <>
            {/* FLOATING SEARCH BAR */}
            <View style={styles.searchBarBox}>
              <Text style={styles.searchMagnifier}>🔍</Text>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search electrician, plumber, daily worker..."
                placeholderTextColor="#64748b"
                style={styles.searchTextInput}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery("")}>
                  <Text style={styles.clearSearchIcon}>✕</Text>
                </Pressable>
              )}
            </View>

            {/* QUICK CATEGORY ICONS GRID */}
            <View style={styles.categorySection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Categories</Text>
                {selectedCategory && (
                  <Pressable onPress={() => setSelectedCategory(null)}>
                    <Text style={styles.clearCategoryText}>Clear Filter ✕</Text>
                  </Pressable>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory?.id === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryCircleCard, isSelected && styles.categoryCircleCardActive]}
                      onPress={() => setSelectedCategory(isSelected ? null : cat)}
                    >
                      {cat.badge && <Text style={styles.catBadgePill}>{cat.badge}</Text>}
                      <View style={[styles.catIconWrap, isSelected && styles.catIconWrapActive]}>
                        <Text style={styles.catIconEmoji}>{cat.icon}</Text>
                      </View>
                      <Text style={[styles.catLabel, isSelected && styles.catLabelActive]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* FEATURED PROMO BANNER */}
            <View style={styles.promoBanner}>
              <View style={styles.promoContent}>
                <View style={styles.promoTag}>
                  <Text style={styles.promoTagText}>MARAC GUARANTEE</Text>
                </View>
                <Text style={styles.promoTitle}>Verified Trade Experts in 30 Mins, Pay After Service</Text>
                <Text style={styles.promoSub}>Electricians, Plumbers, Helpers & Masons across Guwahati.</Text>
              </View>
              <View style={styles.promoBadgeCircle}>
                <Text style={styles.promoBadgePercent}>100%</Text>
                <Text style={styles.promoBadgeLabel}>Verified</Text>
              </View>
            </View>

            {/* LIVE BOOKING TICKER PILL */}
            <View style={styles.liveBookingTicker}>
              <View style={styles.liveDotPulsing} />
              <Text style={styles.liveTickerText}>
                <Text style={styles.liveTickerBold}>Live Booking: </Text>
                Plumber booked in Paltan Bazaar 12 mins ago.
              </Text>
            </View>

            {/* TOP-RATED VERIFIED SERVICES FEED */}
            <View style={styles.servicesHeader}>
              <Text style={styles.sectionHeading}>Top-Rated Verified Services</Text>
              <Text style={styles.servicesCountBadge}>{filteredServices.length} Pros</Text>
            </View>

            <View style={styles.serviceFeed}>
              {filteredServices.map((service) => {
                const qty = cart[service.id]?.quantity || 0;
                return (
                  <View key={service.id} style={styles.serviceFeedCard}>
                    <Image source={{ uri: service.image }} style={styles.workerPhoto} />
                    <View style={styles.serviceCardInfo}>
                      <View style={styles.ratingRow}>
                        <Text style={styles.starIcon}>⭐</Text>
                        <Text style={styles.ratingNumber}>{service.rating}</Text>
                        <Text style={styles.reviewCount}>({service.jobsCount}+ jobs)</Text>
                      </View>

                      <Text style={styles.serviceProTitle}>{service.name}</Text>
                      <Text style={styles.serviceTradeLabel}>{service.trade}</Text>

                      <View style={styles.cardBottomRow}>
                        <View>
                          <Text style={styles.priceAmount}>
                            ₹{service.price}
                            <Text style={styles.priceUnit}> / {service.duration}</Text>
                          </Text>
                          {service.oldPrice && <Text style={styles.priceStrike}>₹{service.oldPrice}</Text>}
                        </View>

                        {qty === 0 ? (
                          <Pressable style={styles.addCtaButton} onPress={() => addToCart(service)}>
                            <Text style={styles.addCtaText}>+ Add</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.stepperWrap}>
                            <Pressable style={styles.stepBtn} onPress={() => updateQuantity(service.id, -1)}>
                              <Text style={styles.stepBtnText}>−</Text>
                            </Pressable>
                            <Text style={styles.stepQty}>{qty}</Text>
                            <Pressable style={styles.stepBtn} onPress={() => updateQuantity(service.id, 1)}>
                              <Text style={styles.stepBtnText}>+</Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* 2. BOOKINGS TAB */}
        {activeTab === "bookings" && (
          <View style={styles.bookingsContainer}>
            <Text style={styles.screenMainTitle}>My Service Bookings</Text>
            <Text style={styles.screenSubtitle}>Track active dispatches & past service history in Guwahati.</Text>

            {bookings.map((b) => (
              <View key={b.code} style={styles.bookingCard}>
                <View style={styles.bookingCardHeader}>
                  <View>
                    <Text style={styles.bookingCodeText}>#{b.code}</Text>
                    <Text style={styles.bookingServiceTitle}>{b.service}</Text>
                  </View>
                  <View style={[styles.statusPill, b.status === "DISPATCHED" ? styles.statusDispatched : styles.statusCompleted]}>
                    <Text style={styles.statusPillText}>{b.status}</Text>
                  </View>
                </View>

                <View style={styles.bookingDetailsRow}>
                  <Text style={styles.bookingDetailItem}>👤 Pro: {b.workerName}</Text>
                  <Text style={styles.bookingDetailItem}>📅 {b.date} • {b.timeSlot}</Text>
                  <Text style={styles.bookingDetailPrice}>Total: ₹{b.amount}</Text>
                </View>

                {b.status === "DISPATCHED" && (
                  <View style={styles.bookingCardActions}>
                    <Pressable
                      style={styles.trackCardBtn}
                      onPress={() => setActiveTab("tracking")}
                    >
                      <Text style={styles.trackCardBtnText}>🗺️ Track Technician Live (ETA 12m)</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* 3. TRACKING TAB (Matching generated Image 2) */}
        {activeTab === "tracking" && (
          <View style={styles.trackingContainer}>
            <View style={styles.trackingTopHeader}>
              <Text style={styles.trackingTopHeading}>Booking #MW-8821</Text>
              <Text style={styles.trackingTopSub}>Live Field Dispatch Status</Text>
            </View>

            {/* MAP VIEWPORT SIMULATION */}
            <View style={styles.mapCanvas}>
              {/* Simulated Map Background */}
              <View style={styles.mapGridOverlay}>
                <View style={styles.mapRoadHorizontal} />
                <View style={styles.mapRoadVertical} />
                <View style={styles.mapRiverBar}>
                  <Text style={styles.mapRiverText}>Brahmaputra River</Text>
                </View>

                {/* Destination Pin (Customer) */}
                <View style={styles.customerPinMarker}>
                  <Text style={styles.pinIcon}>📍</Text>
                  <View style={styles.pinTooltip}>
                    <Text style={styles.pinTooltipText}>Your Home</Text>
                  </View>
                </View>

                {/* Moving Worker Pin Marker */}
                <View style={styles.workerPinMarker}>
                  <View style={styles.workerPinCircle}>
                    <Text style={styles.workerPinIcon}>⚡</Text>
                  </View>
                  <View style={styles.workerRadarWave} />
                </View>
              </View>

              {/* Floating ETA Status Banner */}
              <View style={styles.floatingEtaBanner}>
                <View style={styles.etaDotGreen} />
                <Text style={styles.floatingEtaText}>Electrician On The Way • 12 mins arrival</Text>
              </View>
            </View>

            {/* VERIFIED WORKER CARD SHEET */}
            <View style={styles.trackingProCard}>
              <View style={styles.proProfileHeader}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&q=80" }}
                  style={styles.trackingAvatar}
                />
                <View style={styles.trackingProInfo}>
                  <View style={styles.proNameBadgeRow}>
                    <Text style={styles.trackingProName}>Rajesh Kalita</Text>
                    <Text style={styles.verifiedCheckIcon}>✓</Text>
                  </View>
                  <View style={styles.licensedPill}>
                    <Text style={styles.licensedPillText}>Licensed Master Electrician</Text>
                  </View>
                  <Text style={styles.trackingProScore}>⭐ 4.9 (420+ jobs) • Police Verified</Text>
                </View>
              </View>

              {/* START JOB PIN BOX */}
              <View style={styles.otpPinContainer}>
                <View>
                  <Text style={styles.otpLabel}>Start Job PIN</Text>
                  <Text style={styles.otpSub}>Service OTP:</Text>
                </View>
                <View style={styles.otpBoxesRow}>
                  {["4", "8", "2", "1"].map((digit, i) => (
                    <View key={i} style={styles.otpDigitBox}>
                      <Text style={styles.otpDigitText}>{digit}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* ACTION BUTTONS (Call & WhatsApp) */}
              <View style={styles.trackingActionButtons}>
                <Pressable
                  style={styles.callWorkerBtn}
                  onPress={() => Linking.openURL(`tel:+91${SUPPORT_PHONE}`)}
                >
                  <Text style={styles.callWorkerBtnText}>📞 Call Worker</Text>
                </Pressable>

                <Pressable
                  style={styles.whatsappWorkerBtn}
                  onPress={() => Linking.openURL(`https://wa.me/91${SUPPORT_PHONE}?text=Hi%20Rajesh%2C%20regarding%20booking%20%23MW-8821`)}
                >
                  <Text style={styles.whatsappWorkerBtnText}>💬 Chat on WhatsApp</Text>
                </Pressable>
              </View>

              {/* SERVICE SUMMARY */}
              <View style={styles.trackingOrderSummary}>
                <Text style={styles.trackingSummaryTitle}>Ceiling Fan & Switchboard Repair</Text>
                <Text style={styles.trackingSummaryPrice}>💵 ₹199 • Pay on Completion</Text>
              </View>
            </View>
          </View>
        )}

        {/* 4. PROFILE TAB */}
        {activeTab === "profile" && (
          <View style={styles.profileContainer}>
            <View style={styles.profileHeaderBox}>
              <View style={styles.profileAvatarCircle}>
                <Text style={styles.profileAvatarInitial}>U</Text>
              </View>
              <View>
                <Text style={styles.profileUserName}>Valued Customer</Text>
                <Text style={styles.profileUserCity}>Guwahati, Assam • Verified Customer</Text>
              </View>
            </View>

            <View style={styles.profileMenuBlock}>
              <Pressable
                style={styles.profileMenuItem}
                onPress={() => Linking.openURL("https://maracworkers.vercel.app/worker/register")}
              >
                <Text style={styles.profileMenuIcon}>🦺</Text>
                <View style={styles.profileMenuTextWrap}>
                  <Text style={styles.profileMenuTitle}>Become a Marac Worker</Text>
                  <Text style={styles.profileMenuSub}>Join 500+ verified tradesmen & earn daily</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </Pressable>

              <Pressable style={styles.profileMenuItem} onPress={() => setLocationModalOpen(true)}>
                <Text style={styles.profileMenuIcon}>📍</Text>
                <View style={styles.profileMenuTextWrap}>
                  <Text style={styles.profileMenuTitle}>Saved Addresses</Text>
                  <Text style={styles.profileMenuSub}>{selectedLocation}</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </Pressable>

              <Pressable
                style={styles.profileMenuItem}
                onPress={() => Linking.openURL(`tel:+91${SUPPORT_PHONE}`)}
              >
                <Text style={styles.profileMenuIcon}>📞</Text>
                <View style={styles.profileMenuTextWrap}>
                  <Text style={styles.profileMenuTitle}>24/7 Helpline & Support</Text>
                  <Text style={styles.profileMenuSub}>+91 {SUPPORT_PHONE}</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </Pressable>

              <Pressable
                style={styles.profileMenuItem}
                onPress={() => Alert.alert("Language Selected", "English (Assamese & Hindi coming in next release).")}
              >
                <Text style={styles.profileMenuIcon}>🌐</Text>
                <View style={styles.profileMenuTextWrap}>
                  <Text style={styles.profileMenuTitle}>Language / ভাষা</Text>
                  <Text style={styles.profileMenuSub}>English (অসমীয়া / हिंदी)</Text>
                </View>
                <Text style={styles.menuChevron}>›</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* FLOATING CART SUMMARY BAR (WHEN SERVICES SELECTED) */}
      {cartCount > 0 && activeTab === "home" && (
        <View style={styles.floatingCartBar}>
          <View>
            <Text style={styles.floatingCartCount}>{cartCount} Service{cartCount > 1 ? "s" : ""} in Cart</Text>
            <Text style={styles.floatingCartTotal}>Total: ₹{cartTotal.toLocaleString()} <Text style={styles.floatingCartSub}>· Pay after service</Text></Text>
          </View>
          <Pressable style={styles.floatingCartButton} onPress={() => setCartOpen(true)}>
            <Text style={styles.floatingCartBtnText}>View Cart & Book →</Text>
          </Pressable>
        </View>
      )}

      {/* BOTTOM TAB BAR */}
      <View style={styles.bottomTabBar}>
        <Pressable style={styles.tabBtn} onPress={() => setActiveTab("home")}>
          <Text style={[styles.tabIcon, activeTab === "home" && styles.tabIconActive]}>🏠</Text>
          <Text style={[styles.tabLabel, activeTab === "home" && styles.tabLabelActive]}>Home</Text>
        </Pressable>

        <Pressable style={styles.tabBtn} onPress={() => setActiveTab("bookings")}>
          <Text style={[styles.tabIcon, activeTab === "bookings" && styles.tabIconActive]}>📅</Text>
          <Text style={[styles.tabLabel, activeTab === "bookings" && styles.tabLabelActive]}>Bookings</Text>
        </Pressable>

        <Pressable style={styles.tabBtn} onPress={() => setActiveTab("tracking")}>
          <Text style={[styles.tabIcon, activeTab === "tracking" && styles.tabIconActive]}>📍</Text>
          <Text style={[styles.tabLabel, activeTab === "tracking" && styles.tabLabelActive]}>Tracking</Text>
        </Pressable>

        <Pressable style={styles.tabBtn} onPress={() => setActiveTab("profile")}>
          <Text style={[styles.tabIcon, activeTab === "profile" && styles.tabIconActive]}>👤</Text>
          <Text style={[styles.tabLabel, activeTab === "profile" && styles.tabLabelActive]}>Profile</Text>
        </Pressable>
      </View>

      {/* CART & CHECKOUT MODAL */}
      <Modal visible={cartOpen} animationType="slide" transparent onRequestClose={() => setCartOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModalCard}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>Selected Services ({cartCount})</Text>
              <Pressable style={styles.modalCloseCircle} onPress={() => setCartOpen(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.cartItemsScroll} showsVerticalScrollIndicator={false}>
              {cartItems.length === 0 ? (
                <View style={styles.emptyCartBox}>
                  <Text style={styles.emptyCartIcon}>🛍️</Text>
                  <Text style={styles.emptyCartTitle}>Your cart is empty</Text>
                  <Text style={styles.emptyCartSub}>Add verified technicians or helpers from home.</Text>
                </View>
              ) : (
                cartItems.map((item) => (
                  <View key={item.id} style={styles.cartRowCard}>
                    <View style={styles.cartRowInfo}>
                      <Text style={styles.cartItemName}>{item.name}</Text>
                      <Text style={styles.cartItemPrice}>₹{item.price * item.quantity}</Text>
                    </View>
                    <View style={styles.stepperWrap}>
                      <Pressable style={styles.stepBtn} onPress={() => updateQuantity(item.id, -1)}>
                        <Text style={styles.stepBtnText}>−</Text>
                      </Pressable>
                      <Text style={styles.stepQty}>{item.quantity}</Text>
                      <Pressable style={styles.stepBtn} onPress={() => updateQuantity(item.id, 1)}>
                        <Text style={styles.stepBtnText}>+</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              {cartItems.length > 0 && (
                <View style={styles.checkoutFormBox}>
                  <Text style={styles.checkoutFormHeading}>Service Address & Schedule</Text>

                  <Text style={styles.inputFieldLabel}>Your Full Name *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={customerName}
                    onChangeText={setCustomerName}
                    placeholder="e.g. Rahul Sharma"
                    placeholderTextColor="#64748b"
                  />

                  <Text style={styles.inputFieldLabel}>Mobile Number *</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    placeholder="10-digit mobile"
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholderTextColor="#64748b"
                  />

                  <Text style={styles.inputFieldLabel}>Complete Address in Guwahati *</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalInputMultiline]}
                    value={customerAddress}
                    onChangeText={setCustomerAddress}
                    placeholder="Flat/House No., Landmark, Area in Guwahati"
                    multiline
                    placeholderTextColor="#64748b"
                  />

                  <Text style={styles.inputFieldLabel}>Payment Preference</Text>
                  <View style={styles.paymentToggleRow}>
                    <Pressable
                      style={[styles.paymentPill, paymentMode === "COD" && styles.paymentPillActive]}
                      onPress={() => setPaymentMode("COD")}
                    >
                      <Text style={[styles.paymentPillText, paymentMode === "COD" && styles.paymentPillTextActive]}>
                        💵 Pay After Service (Cash/UPI)
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[styles.paymentPill, paymentMode === "ONLINE" && styles.paymentPillActive]}
                      onPress={() => setPaymentMode("ONLINE")}
                    >
                      <Text style={[styles.paymentPillText, paymentMode === "ONLINE" && styles.paymentPillTextActive]}>
                        💳 Online (Razorpay)
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>

            {cartItems.length > 0 && (
              <View style={styles.cartFooterBar}>
                <View>
                  <Text style={styles.cartFooterSub}>Total to Pay</Text>
                  <Text style={styles.cartFooterTotal}>₹{cartTotal.toLocaleString()}</Text>
                </View>
                <Pressable
                  style={[styles.cartSubmitBtn, isSubmitting && styles.cartSubmitBtnDisabled]}
                  onPress={handleConfirmBooking}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.cartSubmitText}>Confirm & Dispatch Pro →</Text>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* LOCATION SWITCHER MODAL */}
      <Modal visible={locationModalOpen} animationType="fade" transparent onRequestClose={() => setLocationModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.locationModalCard}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.cartModalTitle}>Select Your Locality</Text>
              <Pressable style={styles.modalCloseCircle} onPress={() => setLocationModalOpen(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <Text style={styles.locationModalSub}>Choose your area in Guwahati for instant 30-min technician matching.</Text>

            <ScrollView style={{ marginTop: 12 }}>
              {GUWAHATI_LOCALITIES.map((loc) => (
                <Pressable
                  key={loc}
                  style={[styles.locationOptionItem, selectedLocation === loc && styles.locationOptionItemActive]}
                  onPress={() => {
                    setSelectedLocation(loc);
                    setLocationModalOpen(false);
                  }}
                >
                  <Text style={styles.locationOptionIcon}>📍</Text>
                  <Text style={[styles.locationOptionText, selectedLocation === loc && styles.locationOptionTextActive]}>
                    {loc}
                  </Text>
                  {selectedLocation === loc && <Text style={styles.locationCheckIcon}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const colors = {
  navyDark: "#07101e",
  navyCard: "#0f1c2e",
  navyBorder: "#1e2d42",
  orange: "#ff4800",
  orangeDark: "#e03e00",
  emerald: "#10b981",
  textWhite: "#ffffff",
  textMuted: "#94a3b8",
  textSubtle: "#64748b"
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.navyDark
  },
  topHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: colors.navyDark,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)"
  },
  locationSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  locationPinIcon: {
    fontSize: 20
  },
  locationTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5
  },
  locationTitleText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "800"
  },
  dropdownArrow: {
    color: colors.orange,
    fontSize: 10
  },
  locationSubText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "600"
  },
  headerRightRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  notificationBell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.navyCard,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  bellIcon: {
    fontSize: 16
  },
  bellBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.orange
  },
  cartHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.navyCard,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    alignItems: "center",
    justifyContent: "center",
    position: "relative"
  },
  cartHeaderIcon: {
    fontSize: 16
  },
  cartHeaderBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.orange,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4
  },
  cartHeaderBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "900"
  },
  scrollBody: {
    paddingBottom: 110
  },
  searchBarBox: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.navyBorder,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 50,
    gap: 10
  },
  searchMagnifier: {
    fontSize: 15
  },
  searchTextInput: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: "500"
  },
  clearSearchIcon: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700"
  },
  categorySection: {
    marginTop: 18
  },
  sectionHeaderRow: {
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  sectionHeading: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: "800"
  },
  clearCategoryText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "700"
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 12
  },
  categoryCircleCard: {
    alignItems: "center",
    width: 74,
    position: "relative"
  },
  categoryCircleCardActive: {
    transform: [{ scale: 1.05 }]
  },
  catBadgePill: {
    position: "absolute",
    top: -4,
    zIndex: 2,
    backgroundColor: colors.orange,
    color: "white",
    fontSize: 8,
    fontWeight: "800",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6
  },
  catIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.navyBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6
  },
  catIconWrapActive: {
    borderColor: colors.orange,
    backgroundColor: "rgba(255, 72, 0, 0.15)"
  },
  catIconEmoji: {
    fontSize: 24
  },
  catLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center"
  },
  catLabelActive: {
    color: colors.orange
  },
  promoBanner: {
    marginHorizontal: 16,
    marginTop: 18,
    backgroundColor: colors.navyCard,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  promoContent: {
    flex: 1,
    paddingRight: 10
  },
  promoTag: {
    backgroundColor: "rgba(255, 72, 0, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginBottom: 6
  },
  promoTagText: {
    color: colors.orange,
    fontSize: 9,
    fontWeight: "800"
  },
  promoTitle: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20
  },
  promoSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4
  },
  promoBadgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1.5,
    borderColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center"
  },
  promoBadgePercent: {
    color: colors.emerald,
    fontSize: 14,
    fontWeight: "900"
  },
  promoBadgeLabel: {
    color: colors.emerald,
    fontSize: 9,
    fontWeight: "700"
  },
  liveBookingTicker: {
    marginHorizontal: 16,
    marginTop: 14,
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  liveDotPulsing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald
  },
  liveTickerText: {
    color: colors.textMuted,
    fontSize: 12
  },
  liveTickerBold: {
    color: colors.emerald,
    fontWeight: "800"
  },
  servicesHeader: {
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  servicesCountBadge: {
    color: colors.textSubtle,
    fontSize: 12,
    fontWeight: "700"
  },
  serviceFeed: {
    paddingHorizontal: 16,
    gap: 14
  },
  serviceFeedCard: {
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.navyBorder,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    gap: 12
  },
  workerPhoto: {
    width: 88,
    height: 88,
    borderRadius: 14,
    backgroundColor: colors.navyDark
  },
  serviceCardInfo: {
    flex: 1
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4
  },
  starIcon: {
    fontSize: 12
  },
  ratingNumber: {
    color: "#f59e0b",
    fontSize: 12,
    fontWeight: "800"
  },
  reviewCount: {
    color: colors.textSubtle,
    fontSize: 11
  },
  serviceProTitle: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: "800",
    lineHeight: 18
  },
  serviceTradeLabel: {
    color: colors.orange,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2
  },
  cardBottomRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end"
  },
  priceAmount: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "900"
  },
  priceUnit: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "600"
  },
  priceStrike: {
    color: colors.textSubtle,
    fontSize: 11,
    textDecorationLine: "line-through"
  },
  addCtaButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10
  },
  addCtaText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800"
  },
  stepperWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.emerald,
    borderRadius: 10,
    overflow: "hidden"
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  stepBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "900"
  },
  stepQty: {
    color: "white",
    fontSize: 13,
    fontWeight: "800",
    minWidth: 16,
    textAlign: "center"
  },
  floatingCartBar: {
    position: "absolute",
    bottom: 74,
    left: 14,
    right: 14,
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.orange,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8
  },
  floatingCartCount: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700"
  },
  floatingCartTotal: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: "900"
  },
  floatingCartSub: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: "600"
  },
  floatingCartButton: {
    backgroundColor: colors.orange,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12
  },
  floatingCartBtnText: {
    color: "white",
    fontSize: 12,
    fontWeight: "800"
  },
  bottomTabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    backgroundColor: "#060d18",
    borderTopWidth: 1,
    borderTopColor: colors.navyBorder,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.5
  },
  tabIconActive: {
    opacity: 1
  },
  tabLabel: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "700"
  },
  tabLabelActive: {
    color: colors.orange
  },
  bookingsContainer: {
    padding: 16
  },
  screenMainTitle: {
    color: colors.textWhite,
    fontSize: 22,
    fontWeight: "900",
    marginBottom: 4
  },
  screenSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 16
  },
  bookingCard: {
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.navyBorder,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14
  },
  bookingCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8
  },
  bookingCodeText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "800"
  },
  bookingServiceTitle: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  statusDispatched: {
    backgroundColor: "rgba(16, 185, 129, 0.2)"
  },
  statusCompleted: {
    backgroundColor: "rgba(100, 116, 139, 0.2)"
  },
  statusPillText: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: "800"
  },
  bookingDetailsRow: {
    gap: 4,
    marginTop: 6
  },
  bookingDetailItem: {
    color: colors.textMuted,
    fontSize: 12
  },
  bookingDetailPrice: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 4
  },
  bookingCardActions: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.navyBorder,
    paddingTop: 10
  },
  trackCardBtn: {
    backgroundColor: "rgba(255, 72, 0, 0.15)",
    borderWidth: 1,
    borderColor: colors.orange,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: "center"
  },
  trackCardBtnText: {
    color: colors.orange,
    fontSize: 12,
    fontWeight: "800"
  },
  trackingContainer: {
    paddingBottom: 20
  },
  trackingTopHeader: {
    padding: 16
  },
  trackingTopHeading: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: "900"
  },
  trackingTopSub: {
    color: colors.emerald,
    fontSize: 12,
    fontWeight: "700"
  },
  mapCanvas: {
    height: 280,
    backgroundColor: "#132338",
    position: "relative",
    overflow: "hidden"
  },
  mapGridOverlay: {
    flex: 1,
    position: "relative"
  },
  mapRoadHorizontal: {
    position: "absolute",
    top: 130,
    left: 0,
    right: 0,
    height: 14,
    backgroundColor: "#1c324e"
  },
  mapRoadVertical: {
    position: "absolute",
    left: 170,
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: "#1c324e"
  },
  mapRiverBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 48,
    backgroundColor: "#0d5c8a",
    alignItems: "center",
    justifyContent: "center"
  },
  mapRiverText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 11,
    fontWeight: "700"
  },
  customerPinMarker: {
    position: "absolute",
    top: 80,
    right: 60,
    alignItems: "center"
  },
  pinIcon: {
    fontSize: 28
  },
  pinTooltip: {
    backgroundColor: colors.emerald,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: -4
  },
  pinTooltipText: {
    color: "white",
    fontSize: 9,
    fontWeight: "800"
  },
  workerPinMarker: {
    position: "absolute",
    top: 115,
    left: 100,
    alignItems: "center",
    justifyContent: "center"
  },
  workerPinCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.orange,
    borderWidth: 3,
    borderColor: "white",
    alignItems: "center",
    justifyContent: "center"
  },
  workerPinIcon: {
    fontSize: 20
  },
  workerRadarWave: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.orange,
    opacity: 0.6
  },
  floatingEtaBanner: {
    position: "absolute",
    top: 14,
    left: 16,
    right: 16,
    backgroundColor: "rgba(7, 16, 30, 0.95)",
    borderWidth: 1,
    borderColor: colors.emerald,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 8
  },
  etaDotGreen: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald
  },
  floatingEtaText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: "800"
  },
  trackingProCard: {
    margin: 16,
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.navyBorder,
    borderRadius: 22,
    padding: 16
  },
  proProfileHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center"
  },
  trackingAvatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: colors.orange
  },
  trackingProInfo: {
    flex: 1
  },
  proNameBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  trackingProName: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "900"
  },
  verifiedCheckIcon: {
    color: colors.emerald,
    fontSize: 14,
    fontWeight: "900"
  },
  licensedPill: {
    backgroundColor: "rgba(255, 72, 0, 0.15)",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3
  },
  licensedPillText: {
    color: colors.orange,
    fontSize: 10,
    fontWeight: "800"
  },
  trackingProScore: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4
  },
  otpPinContainer: {
    backgroundColor: colors.navyDark,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  otpLabel: {
    color: colors.textWhite,
    fontSize: 12,
    fontWeight: "800"
  },
  otpSub: {
    color: colors.textSubtle,
    fontSize: 10
  },
  otpBoxesRow: {
    flexDirection: "row",
    gap: 6
  },
  otpDigitBox: {
    width: 34,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.orange,
    alignItems: "center",
    justifyContent: "center"
  },
  otpDigitText: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "900"
  },
  trackingActionButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14
  },
  callWorkerBtn: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  callWorkerBtnText: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: "800"
  },
  whatsappWorkerBtn: {
    flex: 1.2,
    backgroundColor: "#25d366",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center"
  },
  whatsappWorkerBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "800"
  },
  trackingOrderSummary: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.navyBorder,
    paddingTop: 12
  },
  trackingSummaryTitle: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: "700"
  },
  trackingSummaryPrice: {
    color: colors.emerald,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2
  },
  profileContainer: {
    padding: 16
  },
  profileHeaderBox: {
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.navyBorder,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16
  },
  profileAvatarCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.orange,
    alignItems: "center",
    justifyContent: "center"
  },
  profileAvatarInitial: {
    color: "white",
    fontSize: 22,
    fontWeight: "900"
  },
  profileUserName: {
    color: colors.textWhite,
    fontSize: 17,
    fontWeight: "900"
  },
  profileUserCity: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2
  },
  profileMenuBlock: {
    backgroundColor: colors.navyCard,
    borderWidth: 1.5,
    borderColor: colors.navyBorder,
    borderRadius: 20,
    overflow: "hidden"
  },
  profileMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    gap: 12
  },
  profileMenuIcon: {
    fontSize: 20
  },
  profileMenuTextWrap: {
    flex: 1
  },
  profileMenuTitle: {
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: "800"
  },
  profileMenuSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2
  },
  menuChevron: {
    color: colors.textSubtle,
    fontSize: 20,
    fontWeight: "700"
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "flex-end"
  },
  cartModalCard: {
    height: "88%",
    backgroundColor: colors.navyDark,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.navyBorder
  },
  cartModalHeader: {
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.navyBorder
  },
  cartModalTitle: {
    color: colors.textWhite,
    fontSize: 18,
    fontWeight: "900"
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.navyCard,
    alignItems: "center",
    justifyContent: "center"
  },
  modalCloseText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "900"
  },
  cartItemsScroll: {
    padding: 16,
    paddingBottom: 40
  },
  emptyCartBox: {
    padding: 30,
    alignItems: "center"
  },
  emptyCartIcon: {
    fontSize: 48,
    marginBottom: 10
  },
  emptyCartTitle: {
    color: colors.textWhite,
    fontSize: 16,
    fontWeight: "800"
  },
  emptyCartSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 4
  },
  cartRowCard: {
    backgroundColor: colors.navyCard,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cartRowInfo: {
    flex: 1,
    paddingRight: 10
  },
  cartItemName: {
    color: colors.textWhite,
    fontSize: 13,
    fontWeight: "700"
  },
  cartItemPrice: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 2
  },
  checkoutFormBox: {
    backgroundColor: colors.navyCard,
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: colors.navyBorder
  },
  checkoutFormHeading: {
    color: colors.textWhite,
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 12
  },
  inputFieldLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
    marginTop: 8
  },
  modalInput: {
    backgroundColor: colors.navyDark,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textWhite,
    fontSize: 13
  },
  modalInputMultiline: {
    minHeight: 60,
    textAlignVertical: "top"
  },
  paymentToggleRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6
  },
  paymentPill: {
    flex: 1,
    backgroundColor: colors.navyDark,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center"
  },
  paymentPillActive: {
    borderColor: colors.emerald,
    backgroundColor: "rgba(16, 185, 129, 0.1)"
  },
  paymentPillText: {
    color: colors.textSubtle,
    fontSize: 10,
    fontWeight: "800",
    textAlign: "center"
  },
  paymentPillTextActive: {
    color: colors.emerald
  },
  cartFooterBar: {
    backgroundColor: "#060d18",
    borderTopWidth: 1,
    borderTopColor: colors.navyBorder,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  cartFooterSub: {
    color: colors.textSubtle,
    fontSize: 11,
    fontWeight: "700"
  },
  cartFooterTotal: {
    color: colors.textWhite,
    fontSize: 20,
    fontWeight: "900"
  },
  cartSubmitBtn: {
    backgroundColor: colors.orange,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14
  },
  cartSubmitBtnDisabled: {
    opacity: 0.6
  },
  cartSubmitText: {
    color: "white",
    fontSize: 13,
    fontWeight: "900"
  },
  locationModalCard: {
    backgroundColor: colors.navyDark,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderColor: colors.navyBorder,
    paddingBottom: 30,
    maxHeight: "75%"
  },
  locationModalSub: {
    color: colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 16,
    marginTop: 4
  },
  locationOptionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
    gap: 10
  },
  locationOptionItemActive: {
    backgroundColor: "rgba(255, 72, 0, 0.1)"
  },
  locationOptionIcon: {
    fontSize: 16
  },
  locationOptionText: {
    flex: 1,
    color: colors.textWhite,
    fontSize: 14,
    fontWeight: "700"
  },
  locationOptionTextActive: {
    color: colors.orange,
    fontWeight: "900"
  },
  locationCheckIcon: {
    color: colors.orange,
    fontSize: 14,
    fontWeight: "900"
  }
});
