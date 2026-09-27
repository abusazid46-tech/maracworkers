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
  alternatePhone: z.string().trim().optional(),
  trade: z.string().trim().min(2, "Trade is required"),
  locality: z.string().trim().optional(),
  address: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  dailyRate: z.union([z.string(), z.number()]).optional(),
  aadhaarNumber: z.string().trim().optional(),
  emergencyContact: z.string().trim().optional(),
  skills: z.string().trim().optional()
});

const staffCreateSchema = z.object({
  name: z.string().trim().min(2),
  phone: phoneSchema,
  role: z.string().trim().optional(),
  isActive: z.boolean().optional().default(true),
  verificationStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional().default("APPROVED"),
  locality: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  dailyRate: z.number().optional()
});

const staffUpdateSchema = z.object({
  name: z.string().trim().min(2).optional(),
  phone: phoneSchema.optional(),
  role: z.string().trim().optional(),
  isActive: z.boolean().optional(),
  verificationStatus: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  locality: z.string().trim().optional(),
  experience: z.string().trim().optional(),
  dailyRate: z.number().optional(),
  verificationNotes: z.string().trim().optional()
});

// Helper to generate a readable registration code
function generateRegistrationCode() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `MW-WRK-${dateStr}-${rand}`;
}

// 1. Public worker registration from storefront
staffRouter.post(
  "/register",
  rateLimit({ keyPrefix: "staff-register", windowMs: 15 * 60 * 1000, max: 20 }),
  async (req, res, next) => {
    try {
      const input = workerRegisterSchema.parse(req.body);
      const cleanPhone = input.phone.trim().replace(/\D/g, "");
      const cleanAltPhone = input.alternatePhone ? input.alternatePhone.trim().replace(/\D/g, "") : null;
      const parsedDailyRate = input.dailyRate ? Number(String(input.dailyRate).replace(/\D/g, "")) || null : null;
      const regCode = generateRegistrationCode();

      const notesArr = [
        `Code: ${regCode}`,
        `Trade: ${input.trade}`,
        input.locality ? `Locality: ${input.locality}` : null,
        input.address ? `Address: ${input.address}` : null,
        input.experience ? `Experience: ${input.experience}` : null,
        parsedDailyRate ? `Rate: Rs. ${parsedDailyRate}/day` : null,
        input.aadhaarNumber ? `Aadhaar: ${input.aadhaarNumber}` : null,
        cleanAltPhone ? `Alt Phone: ${cleanAltPhone}` : null,
        input.emergencyContact ? `Emergency Contact: ${input.emergencyContact}` : null,
        input.skills ? `Skills: ${input.skills}` : null
      ].filter(Boolean);

      const notes = notesArr.join(" | ");

      // Check if this worker already has a record
      const existingStaff = await prisma.staff.findUnique({
        where: { phone: cleanPhone }
      });

      let staff: any;
      try {
        if (existingStaff) {
          staff = await prisma.staff.update({
            where: { phone: cleanPhone },
            data: {
              name: input.name,
              role: input.trade,
              registrationCode: existingStaff.registrationCode || regCode,
              locality: input.locality || existingStaff.locality,
              address: input.address || existingStaff.address,
              experience: input.experience || existingStaff.experience,
              dailyRate: parsedDailyRate ?? existingStaff.dailyRate,
              aadhaarNumber: input.aadhaarNumber || existingStaff.aadhaarNumber,
              alternatePhone: cleanAltPhone || existingStaff.alternatePhone,
              emergencyContact: input.emergencyContact || existingStaff.emergencyContact,
              skills: input.skills || existingStaff.skills
            }
          });
        } else {
          staff = await prisma.staff.create({
            data: {
              name: input.name,
              phone: cleanPhone,
              role: input.trade,
              isActive: false,
              verificationStatus: "PENDING",
              registrationCode: regCode,
              locality: input.locality || null,
              address: input.address || null,
              experience: input.experience || null,
              dailyRate: parsedDailyRate,
              aadhaarNumber: input.aadhaarNumber || null,
              alternatePhone: cleanAltPhone,
              emergencyContact: input.emergencyContact || null,
              skills: input.skills || null
            }
          });
        }
      } catch (prismaErr) {
        const generatedId = existingStaff?.id || ("mw_" + Math.random().toString(36).substring(2, 10));
        await prisma.$executeRawUnsafe(
          `INSERT INTO Staff (id, name, phone, role, isActive, verificationStatus, registrationCode, locality, address, experience, dailyRate, aadhaarNumber, alternatePhone, emergencyContact, skills, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, 0, 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
           ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role), registrationCode=COALESCE(registrationCode, VALUES(registrationCode)), locality=VALUES(locality), address=VALUES(address), experience=VALUES(experience), dailyRate=VALUES(dailyRate), aadhaarNumber=VALUES(aadhaarNumber), alternatePhone=VALUES(alternatePhone), emergencyContact=VALUES(emergencyContact), skills=VALUES(skills), updatedAt=NOW()`,
          generatedId, input.name, cleanPhone, input.trade, regCode, input.locality || null, input.address || null, input.experience || null, parsedDailyRate, input.aadhaarNumber || null, cleanAltPhone, input.emergencyContact || null, input.skills || null
        );
        const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM Staff WHERE phone = ? LIMIT 1`, cleanPhone);
        staff = rows[0] || { id: generatedId, name: input.name, phone: cleanPhone, role: input.trade, verificationStatus: "PENDING", registrationCode: regCode };
      }

      // 2. Create or update Lead for Admin CRM Tracking
      try {
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
              status: "NEW",
              notes: `${notes}\n\n[Previous Notes]: ${existingLead.notes || ""}`
            }
          });
        } else {
          await prisma.lead.create({
            data: {
              name: input.name,
              phone: cleanPhone,
              source: "worker_registration",
              status: "NEW",
              notes
            }
          });
        }
      } catch (leadErr) {
        console.warn("Could not sync lead:", leadErr);
      }

      return res.status(201).json({
        data: staff,
        registrationCode: staff.registrationCode || regCode,
        message: "Worker registration submitted successfully! Your application is in progress and will be activated upon admin verification."
      });
    } catch (error: any) {
      console.error("STAFF_REGISTER_ERROR:", error);
      return res.status(500).json({ error: error?.message || "Worker registration failed." });
    }
  }
);

// 2. Public lookup for worker registration status
staffRouter.get("/registration-status/:codeOrPhone", async (req, res, next) => {
  try {
    const query = String(req.params.codeOrPhone).trim();
    const cleanPhone = query.replace(/\D/g, "");

    let staff: any = null;
    try {
      staff = await prisma.staff.findFirst({
        where: {
          OR: [
            { registrationCode: query },
            cleanPhone.length >= 10 ? { phone: cleanPhone } : { id: "__none__" }
          ]
        },
        select: {
          id: true,
          name: true,
          role: true,
          phone: true,
          verificationStatus: true,
          registrationCode: true,
          locality: true,
          experience: true,
          isActive: true,
          verifiedAt: true,
          verificationNotes: true,
          createdAt: true
        }
      });
    } catch {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, role, phone, verificationStatus, registrationCode, locality, experience, isActive, verifiedAt, verificationNotes, createdAt FROM Staff WHERE registrationCode = ? OR (LENGTH(?) >= 10 AND phone = ?) LIMIT 1`,
        query, cleanPhone, cleanPhone
      );
      staff = rows[0] || null;
    }

    if (!staff) {
      return res.status(404).json({ error: "Registration not found with provided code or phone number." });
    }

    return res.json({ data: staff });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to check registration status." });
  }
});

// 3. Public active workers list (for storefront dispatch display)
staffRouter.get("/public", async (_req, res, next) => {
  try {
    let staff: any[] = [];
    try {
      staff = await prisma.staff.findMany({
        where: { isActive: true, verificationStatus: "APPROVED" },
        select: {
          id: true,
          name: true,
          role: true,
          isActive: true,
          verificationStatus: true,
          currentLat: true,
          currentLng: true,
          lastLocationAt: true
        },
        orderBy: { createdAt: "desc" },
        take: 20
      });
    } catch {
      staff = await prisma.$queryRawUnsafe<any[]>(
        `SELECT id, name, role, isActive, verificationStatus, currentLat, currentLng, lastLocationAt FROM Staff WHERE isActive = 1 AND (verificationStatus = 'APPROVED' OR verificationStatus IS NULL) ORDER BY createdAt DESC LIMIT 20`
      );
    }
    return res.json({ data: staff });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to fetch public worker list." });
  }
});

// 4. Admin: verify or reject worker application
staffRouter.post("/:id/verify", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const { action, notes } = req.body; // action: "APPROVED" | "REJECTED"

    if (action !== "APPROVED" && action !== "REJECTED") {
      return res.status(400).json({ error: "Action must be 'APPROVED' or 'REJECTED'" });
    }

    const isApproved = action === "APPROVED";
    let staff: any = null;

    try {
      staff = await prisma.staff.update({
        where: { id },
        data: {
          verificationStatus: action,
          isActive: isApproved,
          verifiedAt: isApproved ? new Date() : null,
          verificationNotes: notes ? String(notes).trim() : undefined
        }
      });
    } catch {
      await prisma.$executeRawUnsafe(
        `UPDATE Staff SET verificationStatus = ?, isActive = ?, verifiedAt = ?, verificationNotes = ?, updatedAt = NOW() WHERE id = ?`,
        action, isApproved ? 1 : 0, isApproved ? new Date() : null, notes || null, id
      );
      const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM Staff WHERE id = ? LIMIT 1`, id);
      staff = rows[0] || { id, verificationStatus: action, isActive: isApproved };
    }

    // Also update User role if user exists
    if (isApproved && staff?.phone) {
      await prisma.user.upsert({
        where: { phone: staff.phone },
        update: { role: "STAFF", isActive: true },
        create: { name: staff.name, phone: staff.phone, role: "STAFF", isActive: true }
      }).catch(() => null);
    }

    // Update Lead status in CRM
    if (staff?.phone) {
      await prisma.lead.updateMany({
        where: { phone: staff.phone },
        data: {
          status: isApproved ? "WON" : "LOST",
          notes: notes ? `Admin Verification: ${action} - ${notes}` : `Admin Verification: ${action}`
        }
      }).catch(() => null);
    }

    return res.json({
      data: staff,
      message: `Worker ${staff?.name || "applicant"} is now ${isApproved ? "Approved & Active" : "Rejected"}.`
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to verify worker." });
  }
});

// 5. Admin protected staff management routes
staffRouter.get("/", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const whereClause: Record<string, unknown> = {};

    if (status && status !== "ALL") {
      whereClause.verificationStatus = status;
    }

    let staff: any[] = [];
    try {
      staff = await prisma.staff.findMany({
        where: whereClause,
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
    } catch {
      const rows = await prisma.$queryRawUnsafe<any[]>(
        status && status !== "ALL"
          ? `SELECT * FROM Staff WHERE verificationStatus = ? ORDER BY createdAt DESC`
          : `SELECT * FROM Staff ORDER BY createdAt DESC`,
        ...(status && status !== "ALL" ? [status] : [])
      );
      staff = rows.map((r) => ({ ...r, bookings: [] }));
    }
    return res.json({ data: staff });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || "Failed to fetch staff roster." });
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
        isActive: input.isActive ?? true,
        verificationStatus: input.verificationStatus || "APPROVED",
        locality: input.locality,
        experience: input.experience,
        dailyRate: input.dailyRate
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
    if (input.verificationStatus !== undefined) updateData.verificationStatus = input.verificationStatus;
    if (input.locality !== undefined) updateData.locality = input.locality;
    if (input.experience !== undefined) updateData.experience = input.experience;
    if (input.dailyRate !== undefined) updateData.dailyRate = input.dailyRate;
    if (input.verificationNotes !== undefined) updateData.verificationNotes = input.verificationNotes;
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
