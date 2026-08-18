import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
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

type CategoryId =
  | "toilet-bath"
  | "tank-wash"
  | "ac-repair"
  | "sofa-clean"
  | "deep-clean"
  | "kitchen-appliances"
  | "aya-housemaid"
  | "pest-control"
  | "painter-plumber"
  | "saloon-spa"
  | "security";

type Category = {
  id: CategoryId;
  name: string;
  icon: string;
  badge?: string;
};

type Service = {
  id: string;
  categoryId: CategoryId;
  group: string;
  name: string;
  description: string;
  price: number;
  oldPrice?: number;
  discount?: string;
  duration: string;
  popular?: boolean;
};

type CartItem = Service & { quantity: number };

const brandLogo = require("./assets/the-wings-logo.png");
const supportPhone = "9365123456";

const categories: Category[] = [
  { id: "toilet-bath", name: "Toilet & Bath", icon: "TB", badge: "Same day" },
  { id: "tank-wash", name: "Tank Wash", icon: "TW" },
  { id: "ac-repair", name: "AC & Repair", icon: "AC", badge: "Popular" },
  { id: "sofa-clean", name: "Sofa Clean", icon: "SC" },
  { id: "deep-clean", name: "Deep Clean", icon: "DC" },
  { id: "kitchen-appliances", name: "Kitchen & Appliances", icon: "KA" },
  { id: "aya-housemaid", name: "Aya and Housemaid", icon: "AH" },
  { id: "pest-control", name: "Pest Control", icon: "PC" },
  { id: "painter-plumber", name: "Painter & Plumber", icon: "PP" },
  { id: "saloon-spa", name: "Saloon & Spa", icon: "SS" },
  { id: "security", name: "Security", icon: "SG" }
];

const services: Service[] = [
  {
    id: "bath-combo-1",
    categoryId: "toilet-bath",
    group: "Bathroom Cleaning",
    name: "One attached toilet and bathroom cleaning",
    description: "Complete scrubbing, tile cleaning, fixture cleaning, and sanitisation.",
    price: 699,
    duration: "2 hrs",
    popular: true
  },
  {
    id: "bath-combo-2",
    categoryId: "toilet-bath",
    group: "Bathroom Cleaning",
    name: "Two attached toilet and bathroom cleaning",
    description: "Combo cleaning for two attached toilets and bathrooms.",
    price: 1188,
    oldPrice: 1398,
    discount: "15% off",
    duration: "3 hrs",
    popular: true
  },
  {
    id: "toilet-1",
    categoryId: "toilet-bath",
    group: "Toilet Cleaning",
    name: "1 toilet cleaning",
    description: "Toilet bowl, seat, flush area, wall touchpoints, and floor cleaning.",
    price: 399,
    duration: "1 hr"
  },
  {
    id: "tank-500-1",
    categoryId: "tank-wash",
    group: "Overhead Tank Wash",
    name: "One 500 litre overhead tank wash",
    description: "Tank emptying, sludge removal, scrubbing, and disinfection.",
    price: 499,
    duration: "2 hrs",
    popular: true
  },
  {
    id: "tank-1000-2",
    categoryId: "tank-wash",
    group: "Overhead Tank Wash",
    name: "Two 1000 litre overhead tank wash",
    description: "Combo wash with scrubbing and bleaching treatment.",
    price: 1018,
    oldPrice: 1198,
    discount: "15% off",
    duration: "3 hrs"
  },
  {
    id: "ac-foam-1",
    categoryId: "ac-repair",
    group: "AC Service",
    name: "1 Foam-jet AC service indoor outdoor",
    description: "Foam jet wash, filter clean, drainage check, and performance inspection.",
    price: 799,
    duration: "60 mins",
    popular: true
  },
  {
    id: "ac-install",
    categoryId: "ac-repair",
    group: "AC Installation",
    name: "New AC installation",
    description: "Professional split/window AC installation support.",
    price: 999,
    duration: "90 mins"
  },
  {
    id: "sofa-carpet",
    categoryId: "sofa-clean",
    group: "Sofa & Carpet",
    name: "Carpet dry wash",
    description: "Dry wash for carpets with dust removal and fabric care.",
    price: 499,
    duration: "90 mins",
    popular: true
  },
  {
    id: "deep-2bhk",
    categoryId: "deep-clean",
    group: "Deep Home Cleaning",
    name: "2 BHK deep cleaning",
    description: "Full home deep cleaning for rooms, kitchen, bathrooms, fans, and floors.",
    price: 2999,
    duration: "5 hrs",
    popular: true
  },
  {
    id: "kitchen-complete",
    categoryId: "kitchen-appliances",
    group: "Kitchen & Appliances",
    name: "Complete kitchen cleaning",
    description: "Counter, tiles, sink, cabinets exterior, grease removal, and floor cleaning.",
    price: 999,
    duration: "3 hrs"
  },
  {
    id: "maid-hour",
    categoryId: "aya-housemaid",
    group: "Maid Service",
    name: "Instant maid service",
    description: "Hourly maid support in Agartala for urgent home help.",
    price: 99,
    duration: "Per hour"
  },
  {
    id: "pest-start",
    categoryId: "pest-control",
    group: "Pest Control",
    name: "Pest control package",
    description: "General home pest control package starting from Rs. 999.",
    price: 999,
    duration: "2 hrs"
  },
  {
    id: "plumber-visit",
    categoryId: "painter-plumber",
    group: "Painter & Plumber",
    name: "Painter and plumber verification visit",
    description: "Rate and work estimate after site verification.",
    price: 199,
    duration: "Visit"
  },
  {
    id: "saloon-home",
    categoryId: "saloon-spa",
    group: "Saloon & Spa",
    name: "Home salon consultation",
    description: "At-home grooming, salon, and spa support with final quote after service selection.",
    price: 299,
    duration: "Visit"
  },
  {
    id: "security-domestic",
    categoryId: "security",
    group: "Security",
    name: "Domestic security guard",
    description: "12 hours duty security support for domestic requirements.",
    price: 1299,
    duration: "12 hrs"
  }
];

const bookingHistory = [
  { code: "TWG-260601-A7Q2", service: "Bathroom Cleaning", status: "CONFIRMED", amount: 699 },
  { code: "TWG-260529-M9P1", service: "AC Foam-jet Service", status: "COMPLETED", amount: 799 }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"home" | "bookings" | "account">("home");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [cart, setCart] = useState<Record<string, CartItem>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    alternatePhone: "",
    address: "",
    date: "",
    time: "09:00 AM - 11:00 AM"
  });

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const popularServices = useMemo(() => services.filter((service) => service.popular).slice(0, 5), []);
  const filteredPopular = query.trim()
    ? services.filter((service) => [service.name, service.group, service.description].join(" ").toLowerCase().includes(query.trim().toLowerCase()))
    : popularServices;
  const categoryServices = selectedCategory ? services.filter((service) => service.categoryId === selectedCategory.id) : [];

  function addToCart(service: Service) {
    setCart((current) => {
      const existing = current[service.id];
      return {
        ...current,
        [service.id]: existing ? { ...existing, quantity: existing.quantity + 1 } : { ...service, quantity: 1 }
      };
    });
  }

  function updateQuantity(id: string, delta: number) {
    setCart((current) => {
      const item = current[id];
      if (!item) return current;
      const nextQuantity = item.quantity + delta;
      if (nextQuantity <= 0) {
        const next = { ...current };
        delete next[id];
        return next;
      }
      return { ...current, [id]: { ...item, quantity: nextQuantity } };
    });
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.appFrame}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === "home" && (
            <>
              <Header cartCount={cartCount} onCart={() => setCartOpen(true)} />
              <FloatingContact />
              <View style={styles.searchBox}>
                <Text style={styles.searchIcon}>Search</Text>
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Bathroom cleaning, AC service..."
                  placeholderTextColor="#7d8794"
                  style={styles.searchInput}
                />
              </View>
              <PromoCard />
              <SectionTitle eyebrow="Book a service" title="Choose a category" />
              <View style={styles.categoryGrid}>
                {categories.map((category) => (
                  <Pressable style={styles.categoryCard} key={category.id} onPress={() => setSelectedCategory(category)}>
                    {category.badge && <Text style={styles.categoryBadge}>{category.badge}</Text>}
                    <View style={styles.categoryIcon}>
                      <Text style={styles.categoryIconText}>{category.icon}</Text>
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                  </Pressable>
                ))}
              </View>
              <SectionTitle eyebrow={query ? "Search results" : "Booking ranked"} title={query ? "Matching services" : "Popular services"} />
              <View style={styles.serviceList}>
                {filteredPopular.length > 0 ? (
                  filteredPopular.map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      added={Boolean(cart[service.id])}
                      onAdd={() => addToCart(service)}
                    />
                  ))
                ) : (
                  <Text style={styles.emptyText}>No matching services found. Try bathroom, tank, AC, sofa, kitchen, pest, or security.</Text>
                )}
              </View>
              <TrustSection />
            </>
          )}

          {activeTab === "bookings" && <BookingsScreen />}
          {activeTab === "account" && <AccountScreen />}
        </ScrollView>

        {cartCount > 0 && (
          <Pressable style={styles.checkoutBar} onPress={() => setCartOpen(true)}>
            <View>
              <Text style={styles.checkoutTitle}>{cartCount} service{cartCount === 1 ? "" : "s"} selected</Text>
              <Text style={styles.checkoutSubtitle}>Review booking details</Text>
            </View>
            <Text style={styles.checkoutTotal}>Rs. {total.toLocaleString()}</Text>
          </Pressable>
        )}

        <BottomNav activeTab={activeTab} onChange={setActiveTab} />
      </View>

      <Modal visible={Boolean(selectedCategory)} animationType="slide" transparent onRequestClose={() => setSelectedCategory(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.categoryModal}>
            <View style={styles.modalHeader}>
              <Pressable style={styles.iconButton} onPress={() => setSelectedCategory(null)}>
                <Text style={styles.iconButtonText}>Back</Text>
              </Pressable>
              <View>
                <Text style={styles.modalEyebrow}>Marac Workers</Text>
                <Text style={styles.modalTitle}>{selectedCategory?.name}</Text>
              </View>
              <Pressable style={styles.cartButtonSmall} onPress={() => setCartOpen(true)}>
                <Text style={styles.cartButtonText}>{cartCount}</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {groupServices(categoryServices).map(([group, items]) => (
                <View key={group} style={styles.groupBlock}>
                  <Text style={styles.groupTitle}>{group}</Text>
                  {items.map((service) => (
                    <ServiceRow key={service.id} service={service} added={Boolean(cart[service.id])} onAdd={() => addToCart(service)} />
                  ))}
                </View>
              ))}
              <View style={styles.promiseCard}>
                <Text style={styles.promiseTitle}>TWG Promise</Text>
                <Text style={styles.promiseItem}>Verified professionals</Text>
                <Text style={styles.promiseItem}>Safe chemicals and tools</Text>
                <Text style={styles.promiseItem}>Clear pricing before booking</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={cartOpen} animationType="slide" transparent onRequestClose={() => setCartOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.cartModal}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>Review booking</Text>
                <Text style={styles.modalTitle}>Your cart</Text>
              </View>
              <Pressable style={styles.iconButton} onPress={() => setCartOpen(false)}>
                <Text style={styles.iconButtonText}>Close</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {cartItems.length === 0 ? (
                <Text style={styles.emptyText}>No services added yet.</Text>
              ) : (
                cartItems.map((item) => (
                  <View style={styles.cartRow} key={item.id}>
                    <View style={styles.cartCopy}>
                      <Text style={styles.cartName}>{item.name}</Text>
                      <Text style={styles.cartPrice}>Rs. {(item.price * item.quantity).toLocaleString()}</Text>
                    </View>
                    <View style={styles.quantityControl}>
                      <Pressable onPress={() => updateQuantity(item.id, -1)}><Text style={styles.qtyButton}>-</Text></Pressable>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <Pressable onPress={() => updateQuantity(item.id, 1)}><Text style={styles.qtyButton}>+</Text></Pressable>
                    </View>
                  </View>
                ))
              )}
              <View style={styles.bookingForm}>
                <Text style={styles.formTitle}>Customer details</Text>
                <Input label="Full name" value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} />
                <Input label="Mobile number" value={form.phone} onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" />
                <Input label="Alternate mobile no." value={form.alternatePhone} onChangeText={(value) => setForm((current) => ({ ...current, alternatePhone: value }))} keyboardType="phone-pad" />
                <Input label="Agartala address" value={form.address} onChangeText={(value) => setForm((current) => ({ ...current, address: value }))} multiline />
                <View style={styles.formGridTwo}>
                  <Input label="Date" value={form.date} onChangeText={(value) => setForm((current) => ({ ...current, date: value }))} placeholder="YYYY-MM-DD" />
                  <Input label="Time slot" value={form.time} onChangeText={(value) => setForm((current) => ({ ...current, time: value }))} />
                </View>
                <View style={styles.paymentPanel}>
                  <Text style={styles.paymentTitle}>Payment flow</Text>
                  <Text style={styles.paymentText}>For online payment, collect payment confirmation first, then confirm the booking in the system.</Text>
                  <View style={styles.paymentOptions}>
                    <Text style={styles.paymentChipActive}>Online payment</Text>
                    <Text style={styles.paymentChip}>Cash after service</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
            <View style={styles.cartFooter}>
              <View>
                <Text style={styles.totalLabel}>Total amount</Text>
                <Text style={styles.totalValue}>Rs. {total.toLocaleString()}</Text>
              </View>
              <Pressable style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Confirm booking</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Header({ cartCount, onCart }: { cartCount: number; onCart: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <View style={styles.logoWrap}>
          <Image source={brandLogo} style={styles.logo} />
          <View>
            <Text style={styles.brandName}>Marac Workers</Text>
            <Text style={styles.brandSub}>Agartala home services</Text>
          </View>
        </View>
        <Pressable style={styles.cartCircle} onPress={onCart}>
          <Text style={styles.cartCircleText}>{cartCount}</Text>
        </Pressable>
      </View>
      <Pressable style={styles.locationPill}>
        <Text style={styles.locationTitle}>In 14 minutes</Text>
        <Text style={styles.locationText}>Agartala, Tripura - service area only</Text>
      </Pressable>
    </View>
  );
}

function PromoCard() {
  return (
    <View style={styles.promoCard}>
      <View>
        <Text style={styles.promoKicker}>Limited offer</Text>
        <Text style={styles.promoTitle}>Bathroom cleaning from Rs. 399</Text>
        <Text style={styles.promoText}>Same-day booking in Agartala. Pay after service.</Text>
      </View>
      <View style={styles.promoBadge}>
        <Text style={styles.promoBadgeText}>60% OFF</Text>
      </View>
    </View>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ServiceCard({ service, added, onAdd }: { service: Service; added: boolean; onAdd: () => void }) {
  return (
    <View style={styles.serviceCard}>
      <View style={styles.serviceIconLarge}>
        <Text style={styles.serviceIconText}>{categoryIcon(service.categoryId)}</Text>
      </View>
      <View style={styles.serviceCardBody}>
        <Text style={styles.serviceGroup}>{service.group}</Text>
        <Text style={styles.serviceName}>{service.name}</Text>
        <Text style={styles.serviceDesc}>{service.description}</Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>Rs. {service.price.toLocaleString()}</Text>
            <Text style={styles.duration}>{service.duration}</Text>
          </View>
          <Pressable style={[styles.addButton, added && styles.addButtonActive]} onPress={onAdd}>
            <Text style={[styles.addButtonText, added && styles.addButtonTextActive]}>{added ? "Added" : "Add"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function ServiceRow({ service, added, onAdd }: { service: Service; added: boolean; onAdd: () => void }) {
  return (
    <View style={styles.serviceRow}>
      <View style={styles.serviceRowCopy}>
        <Text style={styles.rowName}>{service.name}</Text>
        <Text style={styles.rowDesc}>{service.description}</Text>
        <View style={styles.rowPriceLine}>
          <Text style={styles.rowPrice}>Rs. {service.price.toLocaleString()}</Text>
          {service.oldPrice && <Text style={styles.oldPrice}>Rs. {service.oldPrice.toLocaleString()}</Text>}
          {service.discount && <Text style={styles.discount}>{service.discount}</Text>}
        </View>
        <Text style={styles.duration}>{service.duration}</Text>
      </View>
      <View style={styles.rowMedia}>
        <Text style={styles.rowMediaText}>{categoryIcon(service.categoryId)}</Text>
        <Pressable style={[styles.addButtonSmall, added && styles.addButtonActive]} onPress={onAdd}>
          <Text style={[styles.addButtonText, added && styles.addButtonTextActive]}>{added ? "Added" : "Add"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TrustSection() {
  return (
    <View style={styles.trustCard}>
      <Text style={styles.trustTitle}>Why customers choose TWG</Text>
      <View style={styles.trustGrid}>
        {["Verified staff", "Cash on delivery", "Agartala support", "Live booking status"].map((item) => (
          <View style={styles.trustItem} key={item}>
            <View style={styles.trustDot} />
            <Text style={styles.trustText}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function FloatingContact() {
  return (
    <View style={styles.floatingContact}>
      <Pressable style={styles.floatButton} onPress={() => Linking.openURL(`tel:+91${supportPhone}`)}>
        <Text style={styles.floatButtonText}>Call</Text>
      </Pressable>
      <Pressable style={[styles.floatButton, styles.whatsAppButton]} onPress={() => Linking.openURL(`https://wa.me/91${supportPhone}`)}>
        <Text style={styles.floatButtonText}>WA</Text>
      </Pressable>
    </View>
  );
}

function BookingsScreen() {
  return (
    <View style={styles.simpleScreen}>
      <SectionTitle eyebrow="My bookings" title="Booking history" />
      {bookingHistory.map((booking) => (
        <View style={styles.historyCard} key={booking.code}>
          <View>
            <Text style={styles.historyCode}>{booking.code}</Text>
            <Text style={styles.historyService}>{booking.service}</Text>
          </View>
          <View style={styles.historyRight}>
            <Text style={styles.historyAmount}>Rs. {booking.amount.toLocaleString()}</Text>
            <Text style={styles.historyStatus}>{booking.status}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function AccountScreen() {
  return (
    <View style={styles.simpleScreen}>
      <SectionTitle eyebrow="Profile" title="Customer account" />
      <View style={styles.accountCard}>
        <Image source={brandLogo} style={styles.accountLogo} />
        <Text style={styles.accountTitle}>Sign in with Google</Text>
        <Text style={styles.accountText}>Connect your account to view booking history, payment status, and saved addresses.</Text>
        <Pressable style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Continue with Google</Text>
        </Pressable>
      </View>
      <View style={styles.accountCard}>
        <Text style={styles.accountTitle}>Need help?</Text>
        <Text style={styles.accountText}>Call or WhatsApp Marac Workers support team.</Text>
        <View style={styles.helpButtons}>
          <Pressable style={styles.helpButton} onPress={() => Linking.openURL(`tel:+91${supportPhone}`)}>
            <Text style={styles.helpButtonText}>Call</Text>
          </Pressable>
          <Pressable style={styles.helpButton} onPress={() => Linking.openURL(`https://wa.me/91${supportPhone}`)}>
            <Text style={styles.helpButtonText}>WhatsApp</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function BottomNav({ activeTab, onChange }: { activeTab: "home" | "bookings" | "account"; onChange: (tab: "home" | "bookings" | "account") => void }) {
  const tabs: Array<{ id: "home" | "bookings" | "account"; label: string }> = [
    { id: "home", label: "Home" },
    { id: "bookings", label: "Bookings" },
    { id: "account", label: "Account" }
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <Pressable style={[styles.navItem, activeTab === tab.id && styles.navItemActive]} key={tab.id} onPress={() => onChange(tab.id)}>
          <Text style={[styles.navLabel, activeTab === tab.id && styles.navLabelActive]}>{tab.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Input({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  keyboardType?: "default" | "phone-pad";
  multiline?: boolean;
}) {
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor="#98a2b3"
        style={[styles.input, multiline && styles.inputMultiline]}
      />
    </View>
  );
}

function groupServices(items: Service[]) {
  const groups = new Map<string, Service[]>();
  for (const item of items) {
    groups.set(item.group, [...(groups.get(item.group) ?? []), item]);
  }
  return Array.from(groups.entries());
}

function categoryIcon(categoryId: CategoryId) {
  return categories.find((category) => category.id === categoryId)?.icon ?? "TW";
}

const colors = {
  navy: "#071020",
  ink: "#101828",
  muted: "#667085",
  line: "#e4eaf2",
  bg: "#f4f8fd",
  gold: "#d4a017",
  green: "#22a96d",
  sky: "#1a6fa8",
  purple: "#5b2bd6"
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg
  },
  appFrame: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    paddingBottom: 110
  },
  header: {
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1
  },
  logo: {
    width: 54,
    height: 38,
    borderRadius: 9
  },
  brandName: {
    color: "white",
    fontSize: 17,
    fontWeight: "900"
  },
  brandSub: {
    color: "rgba(255,255,255,0.78)",
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600"
  },
  cartCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center"
  },
  cartCircleText: {
    color: colors.navy,
    fontWeight: "900"
  },
  locationPill: {
    marginTop: 14,
    backgroundColor: "rgba(255,255,255,0.13)",
    borderRadius: 12,
    padding: 12
  },
  locationTitle: {
    color: "white",
    fontSize: 17,
    fontWeight: "900"
  },
  locationText: {
    color: "rgba(255,255,255,0.82)",
    marginTop: 4,
    fontSize: 12
  },
  searchBox: {
    margin: 16,
    marginTop: -1,
    backgroundColor: "white",
    borderRadius: 13,
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line
  },
  searchIcon: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 15
  },
  promoCard: {
    marginHorizontal: 16,
    backgroundColor: colors.purple,
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "center"
  },
  promoKicker: {
    color: "#f5dc80",
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 11
  },
  promoTitle: {
    color: "white",
    fontWeight: "900",
    fontSize: 19,
    marginTop: 5
  },
  promoText: {
    color: "rgba(255,255,255,0.76)",
    marginTop: 6,
    lineHeight: 19,
    maxWidth: 220
  },
  promoBadge: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center"
  },
  promoBadgeText: {
    color: colors.purple,
    fontWeight: "900",
    textAlign: "center"
  },
  sectionHead: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12
  },
  sectionEyebrow: {
    color: colors.sky,
    textTransform: "uppercase",
    fontWeight: "900",
    fontSize: 11,
    letterSpacing: 0
  },
  sectionTitle: {
    color: colors.navy,
    fontWeight: "900",
    fontSize: 23,
    marginTop: 4
  },
  categoryGrid: {
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  categoryCard: {
    width: "31.5%",
    minHeight: 112,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.line,
    position: "relative"
  },
  categoryBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#eef8f2",
    color: colors.green,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 9,
    fontWeight: "900"
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#eef5fb",
    alignItems: "center",
    justifyContent: "center"
  },
  categoryIconText: {
    color: colors.sky,
    fontWeight: "900"
  },
  categoryName: {
    marginTop: 9,
    color: colors.ink,
    fontWeight: "800",
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16
  },
  serviceList: {
    paddingHorizontal: 16,
    gap: 12
  },
  serviceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden"
  },
  serviceIconLarge: {
    height: 92,
    backgroundColor: "#eef5fb",
    alignItems: "center",
    justifyContent: "center"
  },
  serviceIconText: {
    color: colors.sky,
    fontSize: 28,
    fontWeight: "900"
  },
  serviceCardBody: {
    padding: 15
  },
  serviceGroup: {
    color: colors.sky,
    textTransform: "uppercase",
    fontSize: 10,
    fontWeight: "900"
  },
  serviceName: {
    color: colors.navy,
    fontSize: 16,
    fontWeight: "900",
    marginTop: 5
  },
  serviceDesc: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 6,
    fontSize: 13
  },
  priceRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  price: {
    color: colors.navy,
    fontSize: 17,
    fontWeight: "900"
  },
  duration: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3
  },
  addButton: {
    borderWidth: 1,
    borderColor: colors.purple,
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "white"
  },
  addButtonActive: {
    backgroundColor: colors.purple
  },
  addButtonText: {
    color: colors.purple,
    fontWeight: "900"
  },
  addButtonTextActive: {
    color: "white"
  },
  trustCard: {
    margin: 16,
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: 18
  },
  trustTitle: {
    color: "white",
    fontWeight: "900",
    fontSize: 17
  },
  trustGrid: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  trustItem: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  trustDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gold
  },
  trustText: {
    color: "rgba(255,255,255,0.78)",
    fontWeight: "700",
    fontSize: 12
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(7,16,32,0.42)",
    justifyContent: "flex-end"
  },
  categoryModal: {
    height: "86%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden"
  },
  cartModal: {
    height: "91%",
    backgroundColor: colors.bg,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden"
  },
  modalHeader: {
    backgroundColor: "white",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.line
  },
  modalEyebrow: {
    color: colors.sky,
    fontWeight: "900",
    textTransform: "uppercase",
    fontSize: 10
  },
  modalTitle: {
    color: colors.navy,
    fontSize: 20,
    fontWeight: "900",
    marginTop: 2
  },
  iconButton: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: "white"
  },
  iconButtonText: {
    color: colors.navy,
    fontWeight: "900"
  },
  cartButtonSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center"
  },
  cartButtonText: {
    color: "white",
    fontWeight: "900"
  },
  groupBlock: {
    paddingHorizontal: 16,
    paddingTop: 18
  },
  groupTitle: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10
  },
  serviceRow: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 12,
    flexDirection: "row",
    gap: 12
  },
  serviceRowCopy: {
    flex: 1
  },
  rowName: {
    color: colors.navy,
    fontWeight: "900",
    fontSize: 15,
    lineHeight: 20
  },
  rowDesc: {
    color: colors.muted,
    lineHeight: 19,
    marginTop: 5,
    fontSize: 12
  },
  rowPriceLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 9,
    flexWrap: "wrap"
  },
  rowPrice: {
    color: colors.navy,
    fontWeight: "900"
  },
  oldPrice: {
    color: colors.muted,
    textDecorationLine: "line-through"
  },
  discount: {
    color: colors.green,
    fontWeight: "900",
    fontSize: 12
  },
  rowMedia: {
    width: 92,
    alignItems: "center",
    justifyContent: "space-between"
  },
  rowMediaText: {
    width: 76,
    height: 64,
    borderRadius: 13,
    backgroundColor: "#eef5fb",
    color: colors.sky,
    fontWeight: "900",
    textAlign: "center",
    textAlignVertical: "center",
    paddingTop: 21
  },
  addButtonSmall: {
    borderWidth: 1,
    borderColor: colors.purple,
    borderRadius: 9,
    paddingHorizontal: 13,
    paddingVertical: 7,
    backgroundColor: "white"
  },
  promiseCard: {
    margin: 16,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line
  },
  promiseTitle: {
    color: colors.navy,
    fontWeight: "900",
    fontSize: 17,
    marginBottom: 8
  },
  promiseItem: {
    color: colors.muted,
    fontWeight: "700",
    marginTop: 8
  },
  checkoutBar: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 72,
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  floatingContact: {
    position: "absolute",
    right: 14,
    top: 148,
    zIndex: 4,
    gap: 10
  },
  floatButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white"
  },
  whatsAppButton: {
    backgroundColor: colors.green
  },
  floatButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 12
  },
  checkoutTitle: {
    color: "white",
    fontWeight: "900"
  },
  checkoutSubtitle: {
    color: "rgba(255,255,255,0.68)",
    fontSize: 12,
    marginTop: 2
  },
  checkoutTotal: {
    color: colors.gold,
    fontWeight: "900",
    fontSize: 16
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 62,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 8
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    minHeight: 44
  },
  navItemActive: {
    backgroundColor: "#eef5fb"
  },
  navLabel: {
    color: colors.muted,
    fontWeight: "800"
  },
  navLabelActive: {
    color: colors.sky
  },
  cartRow: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  cartCopy: {
    flex: 1
  },
  cartName: {
    color: colors.navy,
    fontWeight: "900"
  },
  cartPrice: {
    color: colors.muted,
    marginTop: 5
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f5f8fb",
    borderRadius: 10,
    padding: 5
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "white",
    color: colors.navy,
    textAlign: "center",
    textAlignVertical: "center",
    fontWeight: "900"
  },
  qtyValue: {
    color: colors.navy,
    fontWeight: "900"
  },
  bookingForm: {
    margin: 16,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    gap: 12
  },
  formTitle: {
    color: colors.navy,
    fontWeight: "900",
    fontSize: 17
  },
  inputWrap: {
    flex: 1,
    gap: 6
  },
  inputLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 11,
    minHeight: 44,
    paddingHorizontal: 12,
    color: colors.ink,
    backgroundColor: "#fbfdff"
  },
  inputMultiline: {
    minHeight: 78,
    paddingTop: 12,
    textAlignVertical: "top"
  },
  formGridTwo: {
    flexDirection: "row",
    gap: 10
  },
  paymentPanel: {
    backgroundColor: "#f5f8fb",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 8
  },
  paymentTitle: {
    color: colors.navy,
    fontWeight: "900"
  },
  paymentText: {
    color: colors.muted,
    lineHeight: 19,
    fontSize: 12
  },
  paymentOptions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap"
  },
  paymentChipActive: {
    backgroundColor: colors.navy,
    color: "white",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "900"
  },
  paymentChip: {
    backgroundColor: "white",
    color: colors.navy,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    overflow: "hidden",
    fontSize: 12,
    fontWeight: "900",
    borderWidth: 1,
    borderColor: colors.line
  },
  cartFooter: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12
  },
  totalLabel: {
    color: colors.muted,
    fontWeight: "800",
    fontSize: 12
  },
  totalValue: {
    color: colors.navy,
    fontWeight: "900",
    fontSize: 20
  },
  primaryButton: {
    backgroundColor: colors.navy,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center"
  },
  primaryButtonText: {
    color: "white",
    fontWeight: "900"
  },
  emptyText: {
    color: colors.muted,
    textAlign: "center",
    padding: 24,
    fontWeight: "700"
  },
  simpleScreen: {
    paddingTop: 10
  },
  historyCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12
  },
  historyCode: {
    color: colors.navy,
    fontWeight: "900"
  },
  historyService: {
    color: colors.muted,
    marginTop: 5
  },
  historyRight: {
    alignItems: "flex-end"
  },
  historyAmount: {
    color: colors.navy,
    fontWeight: "900"
  },
  historyStatus: {
    color: colors.green,
    fontWeight: "900",
    marginTop: 5,
    fontSize: 12
  },
  accountCard: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 18,
    gap: 12
  },
  accountLogo: {
    width: 78,
    height: 50,
    borderRadius: 10
  },
  accountTitle: {
    color: colors.navy,
    fontWeight: "900",
    fontSize: 18
  },
  accountText: {
    color: colors.muted,
    lineHeight: 20
  },
  helpButtons: {
    flexDirection: "row",
    gap: 10
  },
  helpButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.navy,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center"
  },
  helpButtonText: {
    color: colors.navy,
    fontWeight: "900"
  }
});
