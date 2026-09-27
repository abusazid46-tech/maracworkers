import { Router } from "express";
import type { BookingStatus, PaymentMode, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";
import { requireRoles } from "../middleware/auth.js";
import { logger } from "../services/logger.js";

export const adminRouter = Router();
adminRouter.use(...requireRoles("ADMIN", "MANAGER"));

type BookingForCustomer = Awaited<ReturnType<typeof loadBookingsForCustomers>>[number];
type AdminEventSnapshot = Awaited<ReturnType<typeof loadAdminEventSnapshot>>;
const bookingStatusValues = ["PENDING", "CONFIRMED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REFUNDED"] as const;
const paymentStatusValues = ["PENDING", "PAID", "FAILED", "REFUNDED"] as const;
const paymentModeValues = ["COD", "RAZORPAY", "STRIPE"] as const;

async function loadBookingsForCustomers() {
  return prisma.booking.findMany({
    include: {
      items: true
    },
    orderBy: { createdAt: "desc" }
  });
}

function buildCustomerSummaries(bookings: BookingForCustomer[]) {
  const customers = new Map<
    string,
    {
      name: string;
      phone: string;
      bookingsCount: number;
      totalSpend: number;
      lastBookingAt: string;
      lastService: string;
      city: string;
      status: string;
    }
  >();

  for (const booking of bookings) {
    const existing = customers.get(booking.customerPhone);
    const serviceName = booking.items[0]?.serviceName ?? "Service booking";
    const lastBookingAt = booking.createdAt.toISOString();

    if (!existing) {
      customers.set(booking.customerPhone, {
        name: booking.customerName,
        phone: booking.customerPhone,
        bookingsCount: 1,
        totalSpend: booking.totalAmount,
        lastBookingAt,
        lastService: serviceName,
        city: booking.city,
        status: booking.status
      });
      continue;
    }

    existing.bookingsCount += 1;
    existing.totalSpend += booking.totalAmount;
  }

  return Array.from(customers.values());
}

adminRouter.get("/dashboard", async (_req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayBookings, pendingBookings, activeServices, openLeads, recentBookings, hotLeads, monthBookings, customerBookings] =
      await Promise.all([
        prisma.booking.count({ where: { createdAt: { gte: startOfToday } } }),
        prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED", "ASSIGNED"] } } }),
        prisma.service.count({ where: { isActive: true } }),
        prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }),
        prisma.booking.findMany({
          take: 8,
          include: { items: true },
          orderBy: { createdAt: "desc" }
        }),
        prisma.lead.findMany({
          take: 8,
          where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } },
          orderBy: { updatedAt: "desc" }
        }),
        prisma.booking.findMany({
          where: {
            createdAt: { gte: startOfMonth },
            status: { notIn: ["CANCELLED", "REFUNDED"] }
          },
          select: { totalAmount: true }
        }),
        loadBookingsForCustomers()
      ]);

    const customers = buildCustomerSummaries(customerBookings);
    const monthRevenue = monthBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);

    return res.json({
      data: {
        metrics: {
          todayBookings,
          pendingBookings,
          monthRevenue,
          activeServices,
          openLeads,
          customers: customers.length
        },
        recentBookings,
        hotLeads,
        customers: customers.slice(0, 8)
      }
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/customers", async (_req, res, next) => {
  try {
    const bookings = await loadBookingsForCustomers();
    return res.json({ data: buildCustomerSummaries(bookings) });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/reports", async (req, res, next) => {
  try {
    const filters = resolveReportFilters(req.query);
    const where: Prisma.BookingWhereInput = {
      createdAt: {
        gte: filters.dateFrom,
        lte: filters.dateTo
      }
    };

    if (filters.status !== "ALL") where.status = filters.status as BookingStatus;
    if (filters.paymentMode !== "ALL") where.paymentMode = filters.paymentMode as PaymentMode;

    if (filters.search) {
      where.OR = [
        { bookingCode: { contains: filters.search } },
        { customerName: { contains: filters.search } },
        { customerPhone: { contains: filters.search } },
        { city: { contains: filters.search } },
        { items: { some: { serviceName: { contains: filters.search } } } }
      ];
    }

    if (filters.paymentStatus !== "ALL") {
      where.payments = { some: { status: filters.paymentStatus as PaymentStatus } };
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        items: true,
        payments: true
      },
      orderBy: { createdAt: "desc" },
      take: 1000
    });

    const rows = bookings.map((booking) => {
      const paidAmount = booking.payments
        .filter((payment) => payment.status === "PAID")
        .reduce((sum, payment) => sum + payment.amount, 0);
      const latestPayment = booking.payments
        .slice()
        .sort((left, right) => right.updatedAt.getTime() - left.updatedAt.getTime())[0];
      const paymentStatus = paidAmount > 0 ? "PAID" : latestPayment?.status ?? "UNPAID";

      return {
        bookingCode: booking.bookingCode,
        createdAt: booking.createdAt.toISOString(),
        preferredDate: booking.preferredDate.toISOString(),
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
    });

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

    return res.json({
      data: {
        filters: {
          period: filters.period,
          dateFrom: filters.dateFrom.toISOString(),
          dateTo: filters.dateTo.toISOString(),
          status: filters.status,
          paymentStatus: filters.paymentStatus,
          paymentMode: filters.paymentMode,
          search: filters.search
        },
        metrics,
        rows
      }
    });
  } catch (error) {
    return next(error);
  }
});

adminRouter.get("/events", async (req, res, next) => {
  let initialSnapshot: AdminEventSnapshot;

  try {
    initialSnapshot = await loadAdminEventSnapshot();
  } catch (error) {
    return next(error);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let closed = false;
  let previousRevision = initialSnapshot.revision;

  function send(event: string, data: AdminEventSnapshot | { ok: true; timestamp: string }) {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  async function publish() {
    const snapshot = await loadAdminEventSnapshot();
    if (snapshot.revision !== previousRevision) {
      previousRevision = snapshot.revision;
      send("admin:update", snapshot);
      return;
    }

    send("heartbeat", { ok: true, timestamp: new Date().toISOString() });
  }

  send("connected", initialSnapshot);

  const interval = setInterval(() => {
    publish().catch((error: unknown) => {
      send("admin:error", { ok: true, timestamp: new Date().toISOString() });
      logger.error("Admin event stream failed", { error });
    });
  }, 10000);

  req.on("close", () => {
    closed = true;
    clearInterval(interval);
    res.end();
  });
});

function resolveReportFilters(query: Record<string, unknown>) {
  const period = normalizeReportPeriod(query.period);
  const range = getReportDateRange(period, normalizeQueryText(query.dateFrom), normalizeQueryText(query.dateTo));

  return {
    period,
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    status: normalizeEnumFilter<BookingStatus>(query.status, bookingStatusValues),
    paymentStatus: normalizeEnumFilter<PaymentStatus>(query.paymentStatus, paymentStatusValues),
    paymentMode: normalizeEnumFilter<PaymentMode>(query.paymentMode, paymentModeValues),
    search: normalizeQueryText(query.search) ?? ""
  };
}

function normalizeReportPeriod(value: unknown) {
  const normalized = normalizeQueryText(value)?.toLowerCase();
  if (normalized === "daily" || normalized === "weekly" || normalized === "monthly" || normalized === "yearly" || normalized === "custom") return normalized;
  return "monthly";
}

function normalizeEnumFilter<T extends string>(value: unknown, allowed: readonly T[]) {
  const normalized = normalizeQueryText(value)?.toUpperCase();
  return allowed.includes(normalized as T) ? (normalized as T) : "ALL";
}

function normalizeQueryText(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function getReportDateRange(period: string, from?: string, to?: string) {
  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let dateFrom: Date;
  let dateTo = endOfToday;

  if (period === "daily") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === "weekly") {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
  } else if (period === "yearly") {
    dateFrom = new Date(now.getFullYear(), 0, 1);
  } else if (period === "custom") {
    dateFrom = parseDateBoundary(from, "start") ?? new Date(now.getFullYear(), now.getMonth(), 1);
    dateTo = parseDateBoundary(to, "end") ?? endOfToday;
  } else {
    dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return { dateFrom, dateTo };
}

function parseDateBoundary(value: string | undefined, boundary: "start" | "end") {
  if (!value) return undefined;
  const parsed = new Date(`${value}T${boundary === "start" ? "00:00:00.000" : "23:59:59.999"}`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function loadAdminEventSnapshot() {
  const [bookingCount, latestBooking, pendingBookings, activeServices, leadCount, latestLead, latestService] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        bookingCode: true,
        customerName: true,
        status: true,
        totalAmount: true,
        updatedAt: true
      }
    }),
    prisma.booking.count({ where: { status: { in: ["PENDING", "CONFIRMED", "ASSIGNED"] } } }),
    prisma.service.count({ where: { isActive: true } }),
    prisma.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "QUALIFIED"] } } }),
    prisma.lead.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        phone: true,
        status: true,
        updatedAt: true
      }
    }),
    prisma.service.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        isActive: true,
        updatedAt: true
      }
    })
  ]);

  const revision = [
    bookingCount,
    pendingBookings,
    activeServices,
    leadCount,
    latestBooking?.bookingCode ?? "no-booking",
    latestBooking?.updatedAt.toISOString() ?? "no-booking-time",
    latestLead?.id ?? "no-lead",
    latestLead?.updatedAt.toISOString() ?? "no-lead-time",
    latestService?.id ?? "no-service",
    latestService?.updatedAt.toISOString() ?? "no-service-time"
  ].join(":");

  return {
    revision,
    timestamp: new Date().toISOString(),
    metrics: {
      bookingCount,
      pendingBookings,
      activeServices,
      openLeads: leadCount
    },
    latest: {
      booking: latestBooking
        ? {
            bookingCode: latestBooking.bookingCode,
            customerName: latestBooking.customerName,
            status: latestBooking.status,
            totalAmount: latestBooking.totalAmount,
            updatedAt: latestBooking.updatedAt.toISOString()
          }
        : null,
      lead: latestLead
        ? {
            id: latestLead.id,
            name: latestLead.name,
            phone: latestLead.phone,
            status: latestLead.status,
            updatedAt: latestLead.updatedAt.toISOString()
          }
        : null,
      service: latestService
        ? {
            id: latestService.id,
            name: latestService.name,
            isActive: latestService.isActive,
            updatedAt: latestService.updatedAt.toISOString()
          }
        : null
    }
  };
}
