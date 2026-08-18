import { Router } from "express";
import type { Prisma } from "@prisma/client";
import { bookingCreateSchema, bookingStatusUpdateSchema } from "@the-wings/validation";
import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { AuthedRequest, canAccessUserResource, requireAuth, requireRoles } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { sendWhatsAppText } from "../services/whatsapp.js";

export const bookingsRouter = Router();

function createBookingCode() {
  const date = new Date();
  const day = date.toISOString().slice(2, 10).replace(/-/g, "");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `TWG-${day}-${random}`;
}

bookingsRouter.get("/", ...requireRoles("ADMIN", "MANAGER", "STAFF"), async (_req, res, next) => {
  try {
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        items: { include: { service: true } },
        payments: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json({ data: bookings });
  } catch (error) {
    next(error);
  }
});

bookingsRouter.get("/:bookingCode", requireAuth, async (req, res, next) => {
  try {
    const bookingCode = String(req.params.bookingCode ?? "");
    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: {
        items: true,
        payments: true
      }
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (!canAccessUserResource(req, booking.userId)) {
      return res.status(403).json({ error: "You do not have permission to access this booking" });
    }

    return res.json({ data: booking });
  } catch (error) {
    return next(error);
  }
});

bookingsRouter.patch("/:bookingCode/status", ...requireRoles("ADMIN", "MANAGER", "STAFF"), async (req, res, next) => {
  try {
    const input = bookingStatusUpdateSchema.parse(req.body);
    const booking = await prisma.booking.update({
      where: { bookingCode: String(req.params.bookingCode ?? "") },
      data: {
        status: input.status,
        assignedStaffId: input.assignedStaffId,
        statusLogs: {
          create: {
            status: input.status,
            note: input.note || `Status changed to ${input.status}`
          }
        }
      },
      include: {
        items: true,
        statusLogs: true
      }
    });

    return res.json({ data: booking });
  } catch (error) {
    return next(error);
  }
});

bookingsRouter.post("/", rateLimit({ keyPrefix: "booking-create", windowMs: 15 * 60 * 1000, max: 20 }), requireAuth, async (req, res, next) => {
  try {
    const input = bookingCreateSchema.parse(req.body);
    if (!isAgartalaServiceArea(input.city)) {
      return res.status(422).json({
        error: "Service is currently available only in Agartala.",
        detail: "Please choose an Agartala address before booking."
      });
    }

    const authUser = (req as AuthedRequest).authUser;
    const bookingUserId = authUser.id;

    if (authUser) {
      await prisma.user
        .update({
          where: { id: authUser.id },
          data: {
            name: authUser.name || input.customerName,
            phone: authUser.phone || input.customerPhone
          }
        })
        .catch(() =>
          prisma.user.update({
            where: { id: authUser.id },
            data: { name: authUser.name || input.customerName }
          })
        );
    }

    const booking = await prisma.$transaction(async (tx) => {
      const createdBooking = await tx.booking.create({
        data: {
          bookingCode: createBookingCode(),
          userId: bookingUserId,
          customerName: input.customerName,
          customerPhone: input.customerPhone,
          addressLine: input.addressLine,
          city: input.city,
          preferredDate: new Date(input.preferredDate),
          preferredTimeSlot: input.preferredTimeSlot,
          notes: input.notes,
          totalAmount: input.totalAmount,
          paymentMode: input.paymentMode,
          items: {
            create: input.items.map((item) => ({
              serviceId: item.serviceId,
              serviceName: item.serviceName,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              lineTotal: item.quantity * item.unitPrice
            }))
          },
          statusLogs: {
            create: {
              status: "PENDING",
              note: "Booking created"
            }
          }
        },
        include: {
          items: true,
          statusLogs: true
        }
      });

      await syncBookingLead(tx, createdBooking);

      return createdBooking;
    });
    const customerMessage = [
      `Hi ${booking.customerName}, your Marac Workers booking #${booking.bookingCode} has been received.`,
      `Service: ${booking.items.map((item) => item.serviceName).join(", ")}`,
      `Date: ${input.preferredDate} (${booking.preferredTimeSlot})`,
      `Total: Rs. ${booking.totalAmount.toLocaleString()}`,
      "Our team / verified worker will contact you shortly."
    ].join("\n");

    sendWhatsAppText({ phone: booking.customerPhone, message: customerMessage }).catch((error) => {
      console.error("Customer WhatsApp notification failed", error);
    });

    if (env.WHATSAPP_ADMIN_PHONE) {
      const adminMessage = [
        `New booking ${booking.bookingCode}`,
        `Customer: ${booking.customerName} (${booking.customerPhone})`,
        `Services: ${booking.items.map((item) => item.serviceName).join(", ")}`,
        `Address: ${booking.addressLine}, ${booking.city}`,
        `Payment: ${booking.paymentMode} - Rs. ${booking.totalAmount.toLocaleString()}`
      ].join("\n");

      sendWhatsAppText({ phone: env.WHATSAPP_ADMIN_PHONE, message: adminMessage }).catch((error) => {
        console.error("Admin WhatsApp notification failed", error);
      });
    }

    res.status(201).json({ data: booking });
  } catch (error) {
    next(error);
  }
});

function isAgartalaServiceArea(city: string) {
  return normalizeLocationText(city).includes("agartala");
}

function normalizeLocationText(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function syncBookingLead(
  tx: Prisma.TransactionClient,
  booking: {
    bookingCode: string;
    customerName: string;
    customerPhone: string;
    city: string;
    addressLine: string;
    totalAmount: number;
    paymentMode: string;
    preferredTimeSlot: string;
    items: Array<{ serviceName: string }>;
  }
) {
  const serviceSummary = booking.items.map((item) => item.serviceName).join(", ") || "Service booking";
  const note = [
    `Auto-synced from booking ${booking.bookingCode}.`,
    `Services: ${serviceSummary}.`,
    `Address: ${booking.addressLine}, ${booking.city}.`,
    `Payment: ${booking.paymentMode} - Rs. ${booking.totalAmount.toLocaleString()}.`
  ].join(" ");

  const existingLead = await tx.lead.findFirst({
    where: { phone: booking.customerPhone },
    orderBy: { updatedAt: "desc" }
  });

  if (existingLead) {
    await tx.lead.update({
      where: { id: existingLead.id },
      data: {
        name: existingLead.name ?? booking.customerName,
        source: existingLead.source ?? "First booking",
        status: existingLead.status === "WON" ? "WON" : "QUALIFIED",
        notes: existingLead.notes ? `${existingLead.notes}\n\n${note}` : note
      }
    });
    return;
  }

  await tx.lead.create({
    data: {
      name: booking.customerName,
      phone: booking.customerPhone,
      source: "First booking",
      status: "QUALIFIED",
      notes: note
    }
  });
}
