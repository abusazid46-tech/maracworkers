import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";

process.env.NODE_ENV = "test";
process.env.PORT = "4000";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-secret-with-more-than-24-characters";
process.env.CORS_ORIGIN = "http://localhost:3000";
process.env.OTP_DEBUG_ENABLED = "true";
process.env.RAZORPAY_KEY_ID = "";
process.env.RAZORPAY_KEY_SECRET = "";
process.env.WHATSAPP_PHONE_NUMBER_ID = "";
process.env.WHATSAPP_ACCESS_TOKEN = "";
process.env.WHATSAPP_ADMIN_PHONE = "";

type FakeRole = "CUSTOMER" | "ADMIN" | "MANAGER" | "STAFF";

type FakeUser = {
  id: string;
  role: FakeRole;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  googleId?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type FakeBooking = {
  id: string;
  bookingCode: string;
  userId?: string | null;
  customerName: string;
  customerPhone: string;
  addressLine: string;
  city: string;
  preferredDate: Date;
  preferredTimeSlot: string;
  notes?: string | null;
  status: string;
  paymentMode: string;
  totalAmount: number;
  assignedStaffId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{ id: string; serviceName: string; quantity: number; unitPrice: number; lineTotal: number; serviceId?: string | null }>;
  payments: Array<Record<string, unknown>>;
};

type FakeServiceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const state = {
  users: [] as FakeUser[],
  otps: [] as Array<{ id: string; phone: string; codeHash: string; attempts: number; expiresAt: Date; consumedAt?: Date | null; createdAt: Date }>,
  bookings: [] as FakeBooking[],
  payments: [] as Array<Record<string, unknown>>,
  leads: [] as Array<Record<string, unknown>>,
  services: [] as Array<Record<string, unknown>>,
  offerBanners: [] as Array<Record<string, unknown>>,
  serviceCategories: [] as FakeServiceCategory[],
  notes: [] as Array<Record<string, unknown>>
};

let idCounter = 0;

function nextId(prefix: string) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function resetState() {
  idCounter = 0;
  state.users = [];
  state.otps = [];
  state.bookings = [];
  state.payments = [];
  state.leads = [];
  state.services = [];
  state.offerBanners = [];
  state.serviceCategories = [];
  state.notes = [];
}

function createFakeUser(role: FakeRole, overrides: Partial<FakeUser> = {}) {
  const now = new Date();
  const user: FakeUser = {
    id: nextId("user"),
    role,
    name: overrides.name ?? `${role} User`,
    email: overrides.email ?? null,
    phone: overrides.phone ?? null,
    googleId: overrides.googleId ?? null,
    avatarUrl: overrides.avatarUrl ?? null,
    isActive: overrides.isActive ?? true,
    createdAt: now,
    updatedAt: now
  };
  state.users.push(user);
  return user;
}

function createFakeBooking(user: FakeUser, overrides: Partial<FakeBooking> = {}) {
  const now = new Date();
  const booking: FakeBooking = {
    id: nextId("booking"),
    bookingCode: overrides.bookingCode ?? `TWG-TEST-${idCounter}`,
    userId: overrides.userId ?? user.id,
    customerName: overrides.customerName ?? user.name ?? "Customer",
    customerPhone: overrides.customerPhone ?? user.phone ?? "9876543210",
    addressLine: overrides.addressLine ?? "Test address line",
    city: overrides.city ?? "Agartala",
    preferredDate: overrides.preferredDate ?? now,
    preferredTimeSlot: overrides.preferredTimeSlot ?? "9:00 AM - 11:00 AM",
    notes: overrides.notes ?? null,
    status: overrides.status ?? "PENDING",
    paymentMode: overrides.paymentMode ?? "RAZORPAY",
    totalAmount: overrides.totalAmount ?? 499,
    assignedStaffId: null,
    createdAt: now,
    updatedAt: now,
    items: overrides.items ?? [{ id: nextId("item"), serviceName: "AC service", quantity: 1, unitPrice: 499, lineTotal: 499 }],
    payments: overrides.payments ?? []
  };
  state.bookings.push(booking);
  return booking;
}

function findUser(where: any) {
  if (where?.id) return state.users.find((user) => user.id === where.id && (where.isActive === undefined || user.isActive === where.isActive)) ?? null;
  if (where?.phone) return state.users.find((user) => user.phone === where.phone) ?? null;
  if (where?.email) return state.users.find((user) => user.email === where.email) ?? null;
  if (where?.OR) {
    return (
      state.users.find((user) =>
        where.OR.some((condition: any) =>
          (condition.googleId && user.googleId === condition.googleId) || (condition.email && user.email === condition.email)
        )
      ) ?? null
    );
  }
  return null;
}

const fakePrisma: any = {
  user: {
    findFirst: async ({ where }: any) => findUser(where),
    upsert: async ({ where, update, create }: any) => {
      const existing = findUser(where);
      if (existing) {
        Object.assign(existing, update, { updatedAt: new Date() });
        return existing;
      }
      return createFakeUser(create.role, create);
    },
    update: async ({ where, data }: any) => {
      const user = findUser(where);
      if (!user) throw new Error("User not found");
      Object.assign(user, data, { updatedAt: new Date() });
      return user;
    },
    create: async ({ data }: any) => createFakeUser(data.role, data)
  },
  authOtp: {
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const otp of state.otps) {
        if (otp.phone === where.phone && otp.consumedAt === where.consumedAt) {
          Object.assign(otp, data);
          count += 1;
        }
      }
      return { count };
    },
    create: async ({ data }: any) => {
      const otp = { id: nextId("otp"), attempts: 0, createdAt: new Date(), consumedAt: null, ...data };
      state.otps.push(otp);
      return otp;
    },
    findFirst: async ({ where }: any) =>
      state.otps
        .filter((otp) => otp.phone === where.phone && otp.consumedAt === null && otp.expiresAt > where.expiresAt.gt)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null,
    update: async ({ where, data }: any) => {
      const otp = state.otps.find((item) => item.id === where.id);
      if (!otp) throw new Error("OTP not found");
      if (data.attempts?.increment) otp.attempts += data.attempts.increment;
      if (data.consumedAt) otp.consumedAt = data.consumedAt;
      return otp;
    }
  },
  booking: {
    count: async () => state.bookings.length,
    findMany: async () => state.bookings,
    findUnique: async ({ where }: any) => state.bookings.find((booking) => booking.bookingCode === where.bookingCode || booking.id === where.id) ?? null,
    create: async ({ data }: any) => {
      const now = new Date();
      const booking = createFakeBooking(
        (data.userId && findUser({ id: data.userId })) || createFakeUser("CUSTOMER", { phone: data.customerPhone, name: data.customerName }),
        {
          bookingCode: data.bookingCode,
          userId: data.userId,
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          addressLine: data.addressLine,
          city: data.city,
          preferredDate: data.preferredDate,
          preferredTimeSlot: data.preferredTimeSlot,
          notes: data.notes,
          paymentMode: data.paymentMode,
          totalAmount: data.totalAmount,
          createdAt: now,
          updatedAt: now,
          items: data.items.create.map((item: any) => ({ id: nextId("item"), ...item }))
        }
      );
      return { ...booking, statusLogs: [{ id: nextId("status"), status: "PENDING", note: "Booking created" }] };
    },
    update: async ({ where, data }: any) => {
      const booking = state.bookings.find((item) => item.id === where.id || item.bookingCode === where.bookingCode);
      if (!booking) throw new Error("Booking not found");
      Object.assign(booking, data, { updatedAt: new Date() });
      return booking;
    }
  },
  payment: {
    create: async ({ data }: any) => {
      const payment = { id: nextId("payment"), createdAt: new Date(), updatedAt: new Date(), ...data };
      state.payments.push(payment);
      const booking = state.bookings.find((item) => item.id === data.bookingId);
      booking?.payments.push(payment);
      return payment;
    },
    updateMany: async ({ where, data }: any) => {
      let count = 0;
      for (const payment of state.payments) {
        if (payment.bookingId === where.bookingId && payment.provider === where.provider && payment.providerOrderId === where.providerOrderId) {
          Object.assign(payment, data, { updatedAt: new Date() });
          count += 1;
        }
      }
      return { count };
    },
    findFirstOrThrow: async ({ where }: any) => {
      const payment = state.payments.find((item) => item.bookingId === where.bookingId && item.providerOrderId === where.providerOrderId);
      if (!payment) throw new Error("Payment not found");
      return payment;
    }
  },
  service: {
    count: async () => state.services.length,
    findMany: async () => state.services,
    create: async ({ data }: any) => {
      const service = { id: nextId("service"), createdAt: new Date(), updatedAt: new Date(), ...data };
      state.services.push(service);
      return service;
    },
    update: async ({ where, data }: any) => {
      const service = state.services.find((item) => item.id === where.id);
      if (!service) throw new Error("Service not found");
      Object.assign(service, data, { updatedAt: new Date() });
      return service;
    }
  },
  offerBanner: {
    findMany: async ({ where }: any = {}) => {
      let offers = [...state.offerBanners];
      if (where?.isActive !== undefined) {
        offers = offers.filter((offer) => offer.isActive === where.isActive);
      }
      return offers;
    },
    create: async ({ data }: any) => {
      const now = new Date();
      const offer = {
        id: nextId("offer"),
        subtitle: null,
        serviceId: null,
        categoryId: null,
        imageUrl: null,
        ctaLabel: "Book now",
        offerPrice: null,
        originalPrice: null,
        discountText: null,
        sortOrder: 0,
        isActive: true,
        startsAt: null,
        endsAt: null,
        service: null,
        category: null,
        createdAt: now,
        updatedAt: now,
        ...data
      };
      state.offerBanners.push(offer);
      return offer;
    },
    update: async ({ where, data }: any) => {
      const offer = state.offerBanners.find((item) => item.id === where.id);
      if (!offer) throw new Error("Offer not found");
      Object.assign(offer, data, { updatedAt: new Date() });
      return offer;
    }
  },
  serviceCategory: {
    count: async () => state.serviceCategories.length,
    createMany: async ({ data }: any) => {
      const now = new Date();
      for (const category of data) {
        if (state.serviceCategories.some((item) => item.slug === category.slug)) continue;
        state.serviceCategories.push({
          id: nextId("category"),
          imageUrl: null,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          ...category
        });
      }
      return { count: data.length };
    },
    findMany: async () => state.serviceCategories,
    findFirst: async ({ where }: any = {}) => {
      if (where?.OR) {
        return state.serviceCategories.find((category) => where.OR.some((condition: any) => category.id === condition.id || category.slug === condition.slug)) ?? null;
      }

      return [...state.serviceCategories].sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null;
    }
  },
  lead: {
    count: async () => state.leads.length,
    findMany: async () => state.leads,
    findFirst: async ({ where }: any) => state.leads.find((lead) => lead.phone === where.phone) ?? null,
    create: async ({ data }: any) => {
      const lead = { id: nextId("lead"), createdAt: new Date(), updatedAt: new Date(), ...data };
      state.leads.push(lead);
      return lead;
    },
    update: async ({ where, data }: any) => {
      const lead = state.leads.find((item) => item.id === where.id);
      if (!lead) throw new Error("Lead not found");
      Object.assign(lead, data, { updatedAt: new Date() });
      return lead;
    },
    delete: async ({ where }: any) => ({ id: where.id })
  },
  crmNote: {
    findMany: async () => state.notes,
    create: async ({ data }: any) => ({ id: nextId("note"), createdAt: new Date(), ...data })
  },
  whatsappMessage: {
    findMany: async () => [],
    create: async ({ data }: any) => ({ id: nextId("wa"), createdAt: new Date(), ...data })
  },
  $transaction: async (callback: any) => callback(fakePrisma),
  $queryRaw: async () => [{ ok: 1 }],
  $disconnect: async () => undefined
};

(globalThis as any).__TWG_TEST_PRISMA__ = fakePrisma;

const { createApp } = await import("../app.js");
const { createJwt } = await import("../services/auth.js");
const app = createApp();

function cookieFor(user: FakeUser) {
  return `twg_session=${createJwt(user as any)}`;
}

const bookingPayload = {
  customerName: "Test Customer",
  customerPhone: "9876543210",
  addressLine: "123 Test Road, Agartala",
  city: "Agartala",
  preferredDate: "2026-05-25",
  preferredTimeSlot: "9:00 AM - 11:00 AM",
  paymentMode: "COD",
  totalAmount: 499,
  items: [{ serviceName: "Bathroom Cleaning", quantity: 1, unitPrice: 499 }]
};

beforeEach(() => {
  resetState();
});

describe("auth, authorization, booking, and payment API", () => {
  it("requests and verifies OTP, setting an HTTP-only session cookie", async () => {
    const requested = await request(app).post("/auth/otp/request").send({ phone: "9876543210", name: "OTP Customer" }).expect(200);
    expect(requested.body.data.debugOtp).toMatch(/^\d{6}$/);

    const verified = await request(app)
      .post("/auth/otp/verify")
      .send({ phone: "9876543210", code: requested.body.data.debugOtp, name: "OTP Customer" })
      .expect(200);

    expect(verified.body.data.user.phone).toBe("9876543210");
    expect(verified.headers["set-cookie"][0]).toContain("twg_session=");
    expect(verified.headers["set-cookie"][0]).toContain("HttpOnly");
  });

  it("requires admin or manager roles for admin endpoints", async () => {
    await request(app).get("/admin/dashboard").expect(401);

    const customer = createFakeUser("CUSTOMER", { phone: "9876543210" });
    await request(app).get("/admin/dashboard").set("Cookie", cookieFor(customer)).expect(403);

    const admin = createFakeUser("ADMIN", { phone: "9876543211" });
    const response = await request(app).get("/admin/dashboard").set("Cookie", cookieFor(admin)).expect(200);
    expect(response.body.data.metrics).toBeDefined();
  });

  it("requires customer auth and links bookings to the signed-in user", async () => {
    await request(app).post("/bookings").send(bookingPayload).expect(401);

    const customer = createFakeUser("CUSTOMER", { phone: "9876543210", name: "Test Customer" });
    const created = await request(app).post("/bookings").set("Cookie", cookieFor(customer)).send(bookingPayload).expect(201);
    expect(created.body.data.userId).toBe(customer.id);
    expect(state.leads).toHaveLength(1);
    expect(state.leads[0]).toMatchObject({
      phone: bookingPayload.customerPhone,
      source: "First booking",
      status: "QUALIFIED"
    });

    const otherCustomer = createFakeUser("CUSTOMER", { phone: "9876543212" });
    await request(app).get(`/bookings/${created.body.data.bookingCode}`).set("Cookie", cookieFor(otherCustomer)).expect(403);
    await request(app).get(`/bookings/${created.body.data.bookingCode}`).set("Cookie", cookieFor(customer)).expect(200);
  });

  it("rejects customer bookings outside the supported service area", async () => {
    const customer = createFakeUser("CUSTOMER", { phone: "9876543210", name: "Test Customer" });
    await request(app)
      .post("/bookings")
      .set("Cookie", cookieFor(customer))
      .send({
        ...bookingPayload,
        addressLine: "10 Downing St, London",
        city: "London"
      })
      .expect(422);

    expect(state.bookings).toHaveLength(0);
  });

  it("accepts customer bookings in the Guwahati service area", async () => {
    const customer = createFakeUser("CUSTOMER", { phone: "9876543210", name: "Guwahati Customer" });
    const response = await request(app)
      .post("/bookings")
      .set("Cookie", cookieFor(customer))
      .send({
        ...bookingPayload,
        addressLine: "GS Road, Christian Basti, Guwahati",
        city: "Guwahati"
      })
      .expect(201);

    expect(response.body.data.city).toBe("Guwahati");
    expect(state.bookings).toHaveLength(1);
    state.bookings = [];
    state.bookingItems = [];
    state.leads = [];
  });

  it("repairs missing CRM leads for customers who already have booking history", async () => {
    const customer = createFakeUser("CUSTOMER", { phone: "9876543210", name: "Repeat Customer" });
    createFakeBooking(customer, {
      bookingCode: "TWG-OLD-1",
      customerName: "Repeat Customer",
      customerPhone: bookingPayload.customerPhone
    });

    await request(app).post("/bookings").set("Cookie", cookieFor(customer)).send(bookingPayload).expect(201);

    expect(state.leads).toHaveLength(1);
    expect(state.leads[0]).toMatchObject({
      phone: bookingPayload.customerPhone,
      source: "First booking",
      status: "QUALIFIED"
    });
  });

  it("backfills CRM leads from existing bookings when admins load the lead list", async () => {
    const customer = createFakeUser("CUSTOMER", { phone: "9876543210", name: "Booked Customer" });
    const admin = createFakeUser("ADMIN", { phone: "9876543211" });
    createFakeBooking(customer, {
      bookingCode: "TWG-HISTORIC-1",
      customerName: "Booked Customer",
      customerPhone: bookingPayload.customerPhone
    });

    const response = await request(app).get("/leads").set("Cookie", cookieFor(admin)).expect(200);

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      phone: bookingPayload.customerPhone,
      source: "First booking",
      status: "QUALIFIED"
    });
    expect(state.leads).toHaveLength(1);
  });

  it("lets admins create services with a stale category id by resolving a real category", async () => {
    const admin = createFakeUser("ADMIN", { phone: "9876543211" });
    const response = await request(app)
      .post("/services")
      .set("Cookie", cookieFor(admin))
      .send({
        categoryId: "cat-cleaning",
        name: "Glass Cleaning",
        slug: "glass-cleaning",
        description: "",
        icon: "sparkle",
        basePrice: 299,
        isActive: true
      })
      .expect(201);

    expect(response.body.data.categoryId).toBe(state.serviceCategories[0]?.id);
    expect(response.body.data.description).toBe("Glass Cleaning service by Marac Workers.");
    expect(state.services).toHaveLength(1);
  });

  it("accepts admin service form values when numeric fields arrive as strings", async () => {
    const admin = createFakeUser("ADMIN", { phone: "9876543211" });
    const response = await request(app)
      .post("/services")
      .set("Cookie", cookieFor(admin))
      .send({
        categoryId: "cleaning",
        name: "Sofa Shampoo",
        slug: "",
        description: "",
        icon: "",
        basePrice: "Rs. 799",
        durationMin: "120",
        isActive: "true"
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      categoryId: state.serviceCategories[0]?.id,
      name: "Sofa Shampoo",
      slug: "sofa-shampoo",
      description: "Sofa Shampoo service by Marac Workers.",
      basePrice: 799,
      durationMin: 120,
      isActive: true
    });
  });

  it("lets admins edit an existing service and persists the updated values", async () => {
    const admin = createFakeUser("ADMIN", { phone: "9876543211" });
    const created = await request(app)
      .post("/services")
      .set("Cookie", cookieFor(admin))
      .send({
        categoryId: "cleaning",
        name: "Sofa Shampoo",
        slug: "sofa-shampoo",
        description: "Fabric sofa shampoo and stain treatment.",
        icon: "sofa",
        basePrice: 799,
        durationMin: 120,
        isActive: true
      })
      .expect(201);

    const updated = await request(app)
      .patch(`/services/${created.body.data.id}`)
      .set("Cookie", cookieFor(admin))
      .send({
        categoryId: "cleaning",
        name: "Sofa Shampoo Premium",
        slug: "sofa-shampoo-premium",
        description: "",
        icon: "sofa",
        basePrice: "Rs. 899",
        durationMin: "150",
        isActive: true
      })
      .expect(200);

    expect(updated.body.data).toMatchObject({
      id: created.body.data.id,
      name: "Sofa Shampoo Premium",
      slug: "sofa-shampoo-premium",
      description: "Sofa Shampoo Premium service by Marac Workers.",
      basePrice: 899,
      durationMin: 150
    });
    expect(state.services).toHaveLength(1);
    expect(state.services[0]).toMatchObject({
      name: "Sofa Shampoo Premium",
      basePrice: 899
    });
  });

  it("lets admins create offer banners and public users read active offers", async () => {
    const admin = createFakeUser("ADMIN", { phone: "9876543211" });
    const created = await request(app)
      .post("/offers")
      .set("Cookie", cookieFor(admin))
      .send({
        title: "Bathroom Cleaning Launch Offer",
        subtitle: "Only for Agartala customers",
        ctaLabel: "Book now",
        offerPrice: "Rs. 99",
        originalPrice: "245",
        discountText: "60% OFF",
        sortOrder: "1",
        isActive: "true"
      })
      .expect(201);

    expect(created.body.data).toMatchObject({
      title: "Bathroom Cleaning Launch Offer",
      offerPrice: 99,
      originalPrice: 245,
      isActive: true
    });

    const active = await request(app).get("/offers/active").expect(200);
    expect(active.body.data).toHaveLength(1);
    expect(active.body.data[0].title).toBe("Bathroom Cleaning Launch Offer");
  });

  it("lets admins create CRM leads and update an existing phone instead of making duplicates", async () => {
    const admin = createFakeUser("ADMIN", { phone: "9876543211" });
    const first = await request(app)
      .post("/leads")
      .set("Cookie", cookieFor(admin))
      .send({
        name: "New Customer",
        phone: "9876543210",
        source: "Website",
        status: "NEW",
        notes: "Asked for sofa cleaning"
      })
      .expect(201);

    const second = await request(app)
      .post("/leads")
      .set("Cookie", cookieFor(admin))
      .send({
        name: "New Customer",
        phone: "9876543210",
        source: "Phone",
        status: "QUALIFIED",
        notes: "Called back for Saturday slot"
      })
      .expect(200);

    expect(first.body.data.id).toBe(second.body.data.id);
    expect(state.leads).toHaveLength(1);
    expect(second.body.data.notes).toContain("Asked for sofa cleaning");
    expect(second.body.data.notes).toContain("Called back for Saturday slot");
  });

  it("allows public submission of worker registration and customer inquiry leads", async () => {
    state.leads = [];
    const publicLead = await request(app)
      .post("/leads")
      .send({
        name: "Biren Kalita",
        phone: "9876543219",
        source: "worker_registration",
        status: "NEW",
        notes: "Trade: Electrician | Area: Zoo Road | Exp: 4 years | Rate: Rs. 800/day"
      })
      .expect(201);

    expect(publicLead.body.data.name).toBe("Biren Kalita");
    expect(publicLead.body.data.source).toBe("worker_registration");
    expect(state.leads).toHaveLength(1);
  });

  it("requires booking ownership for Razorpay order creation", async () => {
    const owner = createFakeUser("CUSTOMER", { phone: "9876543210" });
    const other = createFakeUser("CUSTOMER", { phone: "9876543213" });
    const booking = createFakeBooking(owner, { bookingCode: "TWG-PAY-1" });

    await request(app).post("/payments/razorpay/order").set("Cookie", cookieFor(other)).send({ bookingCode: booking.bookingCode }).expect(403);

    const response = await request(app).post("/payments/razorpay/order").set("Cookie", cookieFor(owner)).send({ bookingCode: booking.bookingCode }).expect(200);
    expect(response.body.data.checkoutEnabled).toBe(false);
    expect(response.body.data.bookingCode).toBe(booking.bookingCode);
  });
});
