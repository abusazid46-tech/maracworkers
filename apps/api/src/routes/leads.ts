import { Router, type NextFunction, type Response } from "express";
import { Prisma } from "@prisma/client";
import { leadCreateSchema, leadUpdateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";
import { requireRoles } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const leadsRouter = Router();

leadsRouter.get("/", ...requireRoles("ADMIN", "MANAGER"), async (_req, res, next) => {
  try {
    await syncBookingLeadsFromBookings();
    const leads = await prisma.lead.findMany({
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }]
    });
    res.json({ data: leads });
  } catch (error) {
    next(error);
  }
});

leadsRouter.post("/", rateLimit({ keyPrefix: "lead-create", windowMs: 15 * 60 * 1000, max: 20 }), async (req, res, next) => {
  try {
    const input = leadCreateSchema.parse(req.body);
    const existingLead = await prisma.lead.findFirst({
      where: { phone: input.phone },
      orderBy: { updatedAt: "desc" }
    });

    if (existingLead) {
      const lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          ...input,
          source: input.source ?? existingLead.source,
          notes: mergeLeadNotes(existingLead.notes, input.notes)
        }
      });
      return res.json({ data: lead });
    }

    const lead = await prisma.lead.create({ data: input });
    return res.status(201).json({ data: lead });
  } catch (error) {
    return handleLeadWriteError(error, res, next);
  }
});

leadsRouter.patch("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = leadUpdateSchema.parse(req.body);
    const lead = await prisma.lead.update({
      where: { id: String(req.params.id) },
      data: input
    });
    res.json({ data: lead });
  } catch (error) {
    return handleLeadWriteError(error, res, next);
  }
});

leadsRouter.delete("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const lead = await prisma.lead.delete({
      where: { id: String(req.params.id) }
    });
    res.json({ data: lead });
  } catch (error) {
    return handleLeadWriteError(error, res, next);
  }
});

function mergeLeadNotes(existing?: string | null, incoming?: string | null) {
  if (!incoming) return existing;
  if (!existing) return incoming;
  if (existing.includes(incoming)) return existing;
  return `${existing}\n\n${incoming}`;
}

async function syncBookingLeadsFromBookings() {
  const [bookings, existingLeads] = await Promise.all([
    prisma.booking.findMany({
      include: { items: true },
      orderBy: { createdAt: "asc" }
    }),
    prisma.lead.findMany({
      select: { phone: true }
    })
  ]);
  const phonesWithLeads = new Set(existingLeads.map((lead) => normalizePhone(lead.phone)).filter(Boolean));
  const phonesSyncedThisRun = new Set<string>();

  for (const booking of bookings) {
    const phone = normalizePhone(booking.customerPhone);
    if (!phone || phonesWithLeads.has(phone) || phonesSyncedThisRun.has(phone)) continue;

    phonesSyncedThisRun.add(phone);
    await prisma.lead.create({
      data: {
        name: booking.customerName,
        phone: booking.customerPhone,
        source: "First booking",
        status: "QUALIFIED",
        notes: buildBookingLeadNote(booking)
      }
    });
  }
}

function buildBookingLeadNote(booking: {
  bookingCode: string;
  addressLine: string;
  city: string;
  paymentMode: string;
  totalAmount: number;
  items: Array<{ serviceName: string }>;
}) {
  const serviceSummary = booking.items.map((item) => item.serviceName).join(", ") || "Service booking";
  return [
    `Auto-created from existing booking ${booking.bookingCode}.`,
    `Services: ${serviceSummary}.`,
    `Address: ${booking.addressLine}, ${booking.city}.`,
    `Payment: ${booking.paymentMode} - Rs. ${booking.totalAmount.toLocaleString()}.`
  ].join(" ");
}

function normalizePhone(phone?: string | null) {
  return phone?.replace(/\D/g, "") ?? "";
}

function handleLeadWriteError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
    return res.status(404).json({ error: "Lead was not found." });
  }

  return next(error);
}
