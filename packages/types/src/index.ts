export type UserRole = "CUSTOMER" | "ADMIN" | "MANAGER" | "STAFF";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ASSIGNED"
  | "EN_ROUTE"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentMode = "COD" | "RAZORPAY" | "STRIPE";
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "WON" | "LOST";

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type Service = {
  id: string;
  categoryId: string;
  category?: ServiceCategory | null;
  name: string;
  slug: string;
  description: string;
  icon?: string | null;
  imageUrl?: string | null;
  basePrice: number;
  groupLabel?: string | null;
  priceLabel?: string | null;
  originalPrice?: number | null;
  originalPriceLabel?: string | null;
  discountLabel?: string | null;
  durationMin?: number | null;
  sortOrder: number;
  isActive: boolean;
  bookingCount?: number;
  bookedQuantity?: number;
};

export type ServiceCatalogEventSnapshot = {
  revision: string;
  timestamp: string;
  activeServices: number;
  activeCategories: number;
  latestService?: {
    id: string;
    name: string;
    categoryId: string;
    isActive: boolean;
    updatedAt: string;
  } | null;
  latestCategory?: {
    id: string;
    name: string;
    slug: string;
    updatedAt: string;
  } | null;
};

export type OfferBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  serviceId?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  ctaLabel: string;
  offerPrice?: number | null;
  originalPrice?: number | null;
  discountText?: string | null;
  sortOrder: number;
  isActive: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
  service?: Service | null;
  category?: ServiceCategory | null;
};

export type BookingItemInput = {
  serviceId?: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
};

export type BookingCreateInput = {
  userId?: string;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string;
  paymentMode: PaymentMode;
  totalAmount: number;
  items: BookingItemInput[];
};

export type AuthUser = {
  id: string;
  role: UserRole;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
};

export type AuthSession = {
  token?: string;
  user: AuthUser;
};

export type OtpRequestInput = {
  phone: string;
  name?: string;
};

export type OtpRequestResponse = {
  phone: string;
  expiresInSeconds: number;
  delivery: "whatsapp" | "queued" | "debug";
  whatsappUrl?: string;
  debugOtp?: string;
  message: string;
};

export type OtpVerifyInput = {
  phone: string;
  code: string;
  name?: string;
};

export type GoogleLoginInput = {
  credential: string;
  role?: UserRole;
};

export type Payment = {
  id: string;
  bookingId: string;
  provider: string;
  providerOrderId?: string | null;
  providerPaymentId?: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  rawPayload?: unknown;
  createdAt: string;
  updatedAt: string;
};

export type BookingStatusUpdateInput = {
  status: BookingStatus;
  note?: string;
  assignedStaffId?: string;
};

export type BookingItem = {
  id: string;
  serviceId?: string | null;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

export type StaffSummary = {
  id: string;
  name: string;
  phone: string;
  role?: string | null;
  currentLat?: number | null;
  currentLng?: number | null;
  lastHeading?: number | null;
  lastLocationAt?: string | null;
};

export type Booking = {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  latitude?: number | null;
  longitude?: number | null;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string | null;
  status: BookingStatus;
  paymentMode: PaymentMode;
  totalAmount: number;
  assignedStaffId?: string | null;
  assignedStaff?: StaffSummary | null;
  createdAt: string;
  updatedAt: string;
  items: BookingItem[];
  payments?: Payment[];
};

export type WorkerLocationPayload = {
  bookingId: string;
  workerId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
  timestamp?: string;
};

export type TrackingUpdateEvent = {
  bookingId: string;
  workerId?: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: string;
  status?: BookingStatus;
};

export type RazorpayOrderCreateInput = {
  bookingCode: string;
};

export type RazorpayOrderResponse = {
  bookingCode: string;
  paymentId?: string;
  provider: "RAZORPAY";
  keyId?: string;
  orderId: string;
  amount: number;
  currency: string;
  checkoutEnabled: boolean;
  message: string;
};

export type RazorpayVerifyInput = {
  bookingCode: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export type RazorpayVerifyResponse = {
  booking: Booking;
  payment: Payment;
};

export type ServiceCreateInput = {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  basePrice: number;
  groupLabel?: string | null;
  priceLabel?: string | null;
  originalPrice?: number | null;
  originalPriceLabel?: string | null;
  discountLabel?: string | null;
  durationMin?: number;
  sortOrder?: number;
  isActive?: boolean;
};

export type ServiceUpdateInput = Partial<ServiceCreateInput>;

export type OfferBannerCreateInput = {
  title: string;
  subtitle?: string | null;
  serviceId?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  ctaLabel?: string;
  offerPrice?: number | null;
  originalPrice?: number | null;
  discountText?: string | null;
  sortOrder?: number;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
};

export type OfferBannerUpdateInput = Partial<OfferBannerCreateInput>;

export type Lead = {
  id: string;
  name?: string | null;
  phone: string;
  email?: string | null;
  source?: string | null;
  status: LeadStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type LeadCreateInput = {
  name?: string;
  phone: string;
  email?: string;
  source?: string;
  status?: LeadStatus;
  notes?: string;
};

export type LeadUpdateInput = Partial<LeadCreateInput>;

export type CrmNote = {
  id: string;
  userId?: string | null;
  title: string;
  body: string;
  createdAt: string;
};

export type CrmNoteCreateInput = {
  userId?: string;
  title: string;
  body: string;
};

export type WhatsappMessage = {
  id: string;
  phone: string;
  template?: string | null;
  direction: string;
  status: string;
  payload?: unknown;
  createdAt: string;
};

export type WhatsappMessageCreateInput = {
  phone: string;
  template?: string;
  direction?: "OUTBOUND" | "INBOUND";
  status?: string;
  message: string;
};

export type WhatsappSendResponse = {
  data: WhatsappMessage;
  whatsappUrl: string;
  sent: boolean;
  providerMessageId?: string;
  message: string;
};

export type CustomerSummary = {
  name: string;
  phone: string;
  bookingsCount: number;
  totalSpend: number;
  lastBookingAt: string;
  lastService: string;
  city: string;
  status: BookingStatus;
};

export type AdminDashboard = {
  metrics: {
    todayBookings: number;
    pendingBookings: number;
    monthRevenue: number;
    activeServices: number;
    openLeads: number;
    customers: number;
  };
  recentBookings: Booking[];
  hotLeads: Lead[];
  customers: CustomerSummary[];
};

export type AdminReportPeriod = "daily" | "weekly" | "monthly" | "yearly" | "custom";

export type AdminReportFilters = {
  period?: AdminReportPeriod;
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus | "ALL";
  paymentStatus?: PaymentStatus | "ALL";
  paymentMode?: PaymentMode | "ALL";
  search?: string;
};

export type AdminReportRow = {
  bookingCode: string;
  createdAt: string;
  preferredDate: string;
  preferredTimeSlot: string;
  customerName: string;
  customerPhone: string;
  city: string;
  services: string;
  bookingStatus: BookingStatus;
  paymentMode: PaymentMode;
  paymentStatus: PaymentStatus | "UNPAID";
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
};

export type AdminReport = {
  filters: Required<Pick<AdminReportFilters, "period" | "status" | "paymentStatus" | "paymentMode">> & {
    dateFrom: string;
    dateTo: string;
    search: string;
  };
  metrics: {
    totalBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    pendingBookings: number;
    totalRevenue: number;
    paidAmount: number;
    dueAmount: number;
    codBookings: number;
    onlineBookings: number;
  };
  rows: AdminReportRow[];
};
