import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db/prisma.js";
import { requireRoles } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rate-limit.js";
import { phoneSchema } from "@the-wings/validation";

export const staffRouter = Router();

const workerRegisterSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  phone: phoneSchema,
  trade: z.string().trim().min(2, "Trade is required"),
  locality: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  dailyRate: z.union([z.string(), z.number()]).optional(),
  aadhaarNumber: z.string().trim().optional()
});

const staffCreateSchema = z.object({
  name: z.string().trim().min(2),
  phone: phoneSchema,
  role: z.string().trim().optional(),
  isActive: z.boolean().optional().default(true)
});

const staffUpdateSchema = staffCreateSchema.partial();

// 1. Public worker registration from storefront
staffRouter.post(
  "/register",
  rateLimit({ keyPrefix: "staff-register", windowMs: 15 * 60 * 1000, max: 10 }),
  async (req, res, next) => {
    try {
      const input = workerRegisterSchema.parse(req.body);
      const cleanPhone = input.phone.trim().replace(/\D/g, "");

      const notesArr = [
        `Trade: ${input.trade}`,
        input.locality ? `Locality: ${input.locality}` : null,
        input.experience ? `Experience: ${input.experience}` : null,
        input.dailyRate ? `Rate: Rs. ${input.dailyRate}/day` : null,
        input.aadhaarNumber ? `Aadhaar: ${input.aadhaarNumber}` : null
      ].filter(Boolean);

      const notes = notesArr.join(" | ");

      // 1. Create or update Staff in Postgres
      const staff = await prisma.staff.upsert({
        where: { phone: cleanPhone },
        update: {
          name: input.name,
          role: input.trade,
          isActive: true
        },
        create: {
          name: input.name,
          phone: cleanPhone,
          role: input.trade,
          isActive: true
        }
      });

      // 2. Create or update User as STAFF
      await prisma.user.upsert({
        where: { phone: cleanPhone },
        update: {
          name: input.name,
          role: "STAFF",
          isActive: true
        },
        create: {
          name: input.name,
          phone: cleanPhone,
          role: "STAFF",
          isActive: true
        }
      }).catch(() => null);

      // 3. Create or update Lead for Admin CRM Tracking
      const existingLead = await prisma.lead.findFirst({
        where: { phone: cleanPhone },
        orderBy: { updatedAt: "desc" }
      });

      if (existingLead) {
        await prisma.lead.update({
          where: { id: existingLead.id },
          data: {
            name: input.name,
            source: "worker_registration",
            status: "QUALIFIED",
            notes: existingLead.notes ? `${existingLead.notes}\n\n${notes}` : notes
          }
        });
      } else {
        await prisma.lead.create({
          data: {
            name: input.name,
            phone: cleanPhone,
            source: "worker_registration",
            status: "QUALIFIED",
            notes
          }
        });
      }

      return res.status(201).json({
        data: staff,
        message: "Worker registration received. You are now in the Marac Workers verified partner network."
      });
    } catch (error) {
      return next(error);
    }
  }
);

// 2. Public active workers list (for storefront dispatch display)
staffRouter.get("/public", async (_req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
        isActive: true,
        currentLat: true,
        currentLng: true,
        lastLocationAt: true
      },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    return res.json({ data: staff });
  } catch (error) {
    return next(error);
  }
});

// 3. Admin protected staff management routes
staffRouter.get("/", ...requireRoles("ADMIN", "MANAGER"), async (_req, res, next) => {
  try {
    const staff = await prisma.staff.findMany({
      include: {
        bookings: {
          select: {
            id: true,
            bookingCode: true,
            status: true,
            preferredDate: true
          },
          orderBy: { createdAt: "desc" },
          take: 5
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return res.json({ data: staff });
  } catch (error) {
    return next(error);
  }
});

staffRouter.post("/", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = staffCreateSchema.parse(req.body);
    const cleanPhone = input.phone.trim().replace(/\D/g, "");

    const staff = await prisma.staff.create({
      data: {
        name: input.name,
        phone: cleanPhone,
        role: input.role || "General Worker",
        isActive: input.isActive ?? true
      }
    });

    await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: { name: input.name, role: "STAFF" },
      create: { name: input.name, phone: cleanPhone, role: "STAFF" }
    }).catch(() => null);

    return res.status(201).json({ data: staff });
  } catch (error) {
    return next(error);
  }
});

staffRouter.patch("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const input = staffUpdateSchema.parse(req.body);

    const updateData: Record<string, unknown> = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;
    if (input.phone) updateData.phone = input.phone.trim().replace(/\D/g, "");

    const staff = await prisma.staff.update({
      where: { id },
      data: updateData
    });

    return res.json({ data: staff });
  } catch (error) {
    return next(error);
  }
});

staffRouter.delete("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    await prisma.staff.delete({ where: { id } });
    return res.json({ success: true, message: "Staff record removed" });
  } catch (error) {
    return next(error);
  }
});
