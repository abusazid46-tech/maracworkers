import type {
  AdminDashboard,
  AdminReport,
  AdminReportFilters,
  AuthSession,
  Booking,
  BookingCreateInput,
  BookingStatusUpdateInput,
  CrmNote,
  CrmNoteCreateInput,
  CustomerSummary,
  GoogleLoginInput,
  Lead,
  LeadCreateInput,
  LeadUpdateInput,
  OfferBanner,
  OfferBannerCreateInput,
  OfferBannerUpdateInput,
  OtpRequestInput,
  OtpRequestResponse,
  OtpVerifyInput,
  RazorpayOrderCreateInput,
  RazorpayOrderResponse,
  RazorpayVerifyInput,
  RazorpayVerifyResponse,
  Service,
  ServiceCategory,
  ServiceCreateInput,
  ServiceUpdateInput,
  WhatsappMessageCreateInput,
  WhatsappSendResponse
} from "@the-wings/types";

declare const process:
  | {
      env?: {
        NEXT_PUBLIC_API_URL?: string;
      };
    }
  | undefined;

type ApiClientOptions = {
  baseUrl: string;
  token?: string;
  credentials?: RequestCredentials;
};

type ApiErrorBody = {
  error?: string;
  detail?: string;
  code?: string;
  requestId?: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

const deployedApiUrl = "https://maracworkers.onrender.com";
const localApiUrl = "http://localhost:4000";

export class ApiClientError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null) {
    super(formatApiError(status, body));
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

function getDefaultApiUrl() {
  const configuredUrl = getConfiguredApiUrl();
  if (configuredUrl) return configuredUrl;

  const hostname = globalThis.location?.hostname;
  if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
    return deployedApiUrl;
  }

  return localApiUrl;
}

function getConfiguredApiUrl() {
  const configuredUrl = getEnvApiUrl()?.trim().replace(/\/$/, "");
  if (!configuredUrl || shouldIgnoreConfiguredApiUrl(configuredUrl)) return undefined;
  return configuredUrl;
}

function getEnvApiUrl() {
  if (typeof process === "undefined") return undefined;
  return process.env?.NEXT_PUBLIC_API_URL;
}

function shouldIgnoreConfiguredApiUrl(configuredUrl: string) {
  try {
    const configuredHostname = new URL(configuredUrl).hostname;
    const currentHostname = globalThis.location?.hostname;
    const isCurrentPageOrigin = Boolean(currentHostname && configuredHostname === currentHostname);
    const isFrontendVercelUrl = configuredHostname.endsWith(".vercel.app");
    const isLocalApiInProduction = Boolean(currentHostname && currentHostname !== "localhost" && currentHostname !== "127.0.0.1" && configuredHostname === "localhost");

    return isCurrentPageOrigin || isFrontendVercelUrl || isLocalApiInProduction;
  } catch {
    return true;
  }
}

export class ApiClient {
  private readonly baseUrl: string;
  private readonly token?: string;
  private readonly credentials: RequestCredentials;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.token = options.token;
    this.credentials = options.credentials ?? "include";
  }

  async requestOtp(input: OtpRequestInput) {
    return this.request<{ data: OtpRequestResponse }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async verifyOtp(input: OtpVerifyInput) {
    return this.request<{ data: AuthSession }>("/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async loginWithGoogle(input: GoogleLoginInput) {
    return this.request<{ data: AuthSession }>("/auth/google", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async getMe() {
    return this.request<{ data: AuthSession["user"] }>("/auth/me");
  }

  async logout() {
    return this.request<{ data: { ok: true } }>("/auth/logout", {
      method: "POST"
    });
  }

  async getServices(options?: { includeInactive?: boolean }) {
    const query = options?.includeInactive ? "?includeInactive=true" : "";
    return this.request<{ data: Service[] }>(`/services${query}`);
  }

  async getPopularServices(options?: { limit?: number }) {
    const params = new URLSearchParams();
    if (options?.limit) params.set("limit", String(options.limit));
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ data: Service[] }>(`/services/popular${query}`);
  }

  async getServiceCategories() {
    return this.request<{ data: ServiceCategory[] }>("/services/categories");
  }

  getServiceCatalogEventsUrl() {
    return `${this.baseUrl}/services/events`;
  }

  async createService(input: ServiceCreateInput) {
    return this.request<{ data: Service }>("/services", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async updateService(id: string, input: ServiceUpdateInput) {
    return this.request<{ data: Service }>(`/services/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async deleteService(id: string) {
    return this.request<{ data: Service }>(`/services/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  async getActiveOfferBanners(options?: { serviceId?: string; categoryId?: string }) {
    const params = new URLSearchParams();
    if (options?.serviceId) params.set("serviceId", options.serviceId);
    if (options?.categoryId) params.set("categoryId", options.categoryId);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ data: OfferBanner[] }>(`/offers/active${query}`);
  }

  async getOfferBanners() {
    return this.request<{ data: OfferBanner[] }>("/offers");
  }

  async createOfferBanner(input: OfferBannerCreateInput) {
    return this.request<{ data: OfferBanner }>("/offers", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async updateOfferBanner(id: string, input: OfferBannerUpdateInput) {
    return this.request<{ data: OfferBanner }>(`/offers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async deleteOfferBanner(id: string) {
    return this.request<{ data: OfferBanner }>(`/offers/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  async createBooking(input: BookingCreateInput) {
    return this.request<{ data: Booking }>("/bookings", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async getBooking(bookingCode: string) {
    return this.request<{ data: Booking }>(`/bookings/${encodeURIComponent(bookingCode)}`);
  }

  async createRazorpayOrder(input: RazorpayOrderCreateInput) {
    return this.request<{ data: RazorpayOrderResponse }>("/payments/razorpay/order", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async verifyRazorpayPayment(input: RazorpayVerifyInput) {
    return this.request<{ data: RazorpayVerifyResponse }>("/payments/razorpay/verify", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async getBookings() {
    return this.request<{ data: Booking[] }>("/bookings");
  }

  async updateBookingStatus(bookingCode: string, input: BookingStatusUpdateInput) {
    return this.request<{ data: Booking }>(`/bookings/${encodeURIComponent(bookingCode)}/status`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async getAdminDashboard() {
    return this.request<{ data: AdminDashboard }>("/admin/dashboard");
  }

  async getAdminReport(filters?: AdminReportFilters) {
    const params = new URLSearchParams();
    if (filters?.period) params.set("period", filters.period);
    if (filters?.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters?.dateTo) params.set("dateTo", filters.dateTo);
    if (filters?.status && filters.status !== "ALL") params.set("status", filters.status);
    if (filters?.paymentStatus && filters.paymentStatus !== "ALL") params.set("paymentStatus", filters.paymentStatus);
    if (filters?.paymentMode && filters.paymentMode !== "ALL") params.set("paymentMode", filters.paymentMode);
    if (filters?.search) params.set("search", filters.search);
    const query = params.toString() ? `?${params.toString()}` : "";
    return this.request<{ data: AdminReport }>(`/admin/reports${query}`);
  }

  getAdminEventsUrl() {
    return `${this.baseUrl}/admin/events`;
  }

  async getCustomers() {
    return this.request<{ data: CustomerSummary[] }>("/admin/customers");
  }

  async getLeads() {
    return this.request<{ data: Lead[] }>("/leads");
  }

  async createLead(input: LeadCreateInput) {
    return this.request<{ data: Lead }>("/leads", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async updateLead(id: string, input: LeadUpdateInput) {
    return this.request<{ data: Lead }>(`/leads/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(input)
    });
  }

  async deleteLead(id: string) {
    return this.request<{ data: Lead }>(`/leads/${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  }

  async getCrmNotes() {
    return this.request<{ data: CrmNote[] }>("/crm/notes");
  }

  async createCrmNote(input: CrmNoteCreateInput) {
    return this.request<{ data: CrmNote }>("/crm/notes", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  async logWhatsappMessage(input: WhatsappMessageCreateInput) {
    return this.request<WhatsappSendResponse>("/crm/whatsapp", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Content-Type", "application/json");
    if (this.token) headers.set("Authorization", `Bearer ${this.token}`);

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
      credentials: this.credentials
    });

    if (!response.ok) {
      throw new ApiClientError(response.status, await parseErrorBody(response));
    }

    return response.json() as Promise<T>;
  }
}

async function parseErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    const body = (await response.json()) as unknown;
    return isApiErrorBody(body) ? body : null;
  } catch {
    return null;
  }
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  return Boolean(value && typeof value === "object");
}

function formatApiError(status: number, body: ApiErrorBody | null) {
  const fieldErrors = body?.details?.fieldErrors;
  const fieldMessage = fieldErrors
    ? Object.entries(fieldErrors)
        .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
        .join("; ")
    : "";
  const formMessage = body?.details?.formErrors?.join("; ") ?? "";
  const message = [body?.error, body?.detail, fieldMessage, formMessage].filter(Boolean).join(" - ");

  return message || `API request failed: ${status}`;
}

export function createApiClient(options?: Partial<ApiClientOptions>) {
  return new ApiClient({
    baseUrl: options?.baseUrl ?? getDefaultApiUrl(),
    token: options?.token,
    credentials: options?.credentials
  });
}
