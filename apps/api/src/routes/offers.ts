import { Router, type NextFunction, type Request, type Response } from "express";
import { Prisma, type User } from "@prisma/client";
import { offerBannerCreateSchema, offerBannerUpdateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";
import { optionalAuth, requireRoles, type AuthedRequest } from "../middleware/auth.js";

export const offersRouter = Router();

const offerInclude = {
  service: true,
  category: true
} satisfies Prisma.OfferBannerInclude;

offersRouter.get("/active", async (req, res, next) => {
  try {
    const now = new Date();
    const serviceId = normalizeText(req.query.serviceId);
    const categoryId = normalizeText(req.query.categoryId);
    const targetFilters: Prisma.OfferBannerWhereInput[] = [{ serviceId: null, categoryId: null }];
    if (serviceId) targetFilters.push({ serviceId });
    if (categoryId) targetFilters.push({ categoryId });

    const offers = await prisma.offerBanner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
          { OR: targetFilters }
        ]
      },
      include: offerInclude,
      orderBy: [{ serviceId: "desc" }, { categoryId: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }]
    });

    return res.json({ data: offers });
  } catch (error) {
    return next(error);
  }
});

offersRouter.get("/", optionalAuth, async (req: Request, res, next) => {
  try {
    const authUser = (req as Request & { authUser?: User }).authUser;
    const isAdminOrManager = authUser && (authUser.role === "ADMIN" || authUser.role === "MANAGER");
    if (isAdminOrManager) {
      const offers = await prisma.offerBanner.findMany({
        include: offerInclude,
        orderBy: [{ isActive: "desc" }, { sortOrder: "asc" }, { updatedAt: "desc" }]
      });
      return res.json({ data: offers });
    }

    const now = new Date();
    const offers = await prisma.offerBanner.findMany({
      where: {
        isActive: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }
        ]
      },
      include: offerInclude,
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
    });
    return res.json({ data: offers });
  } catch (error) {
    return next(error);
  }
});

offersRouter.post("/", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = parseOfferCreateBody(req.body);
    const offer = await prisma.offerBanner.create({
      data: input,
      include: offerInclude
    });
    return res.status(201).json({ data: offer });
  } catch (error) {
    return handleOfferWriteError(error, res, next);
  }
});

offersRouter.patch("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = parseOfferUpdateBody(req.body);
    const offer = await prisma.offerBanner.update({
      where: { id: String(req.params.id ?? "") },
      data: input,
      include: offerInclude
    });
    return res.json({ data: offer });
  } catch (error) {
    return handleOfferWriteError(error, res, next);
  }
});

offersRouter.delete("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const offer = await prisma.offerBanner.update({
      where: { id: String(req.params.id ?? "") },
      data: { isActive: false },
      include: offerInclude
    });
    return res.json({ data: offer });
  } catch (error) {
    return handleOfferWriteError(error, res, next);
  }
});

function parseOfferCreateBody(body: unknown) {
  const input = offerBannerCreateSchema.parse(normalizeOfferBody(body));
  return {
    ...input,
    startsAt: input.startsAt ? new Date(input.startsAt) : null,
    endsAt: input.endsAt ? new Date(input.endsAt) : null
  };
}

function parseOfferUpdateBody(body: unknown) {
  const input = offerBannerUpdateSchema.parse(normalizeOfferBody(body));
  return {
    ...input,
    startsAt: input.startsAt ? new Date(input.startsAt) : input.startsAt,
    endsAt: input.endsAt ? new Date(input.endsAt) : input.endsAt
  };
}

function normalizeOfferBody(body: unknown) {
  if (!body || typeof body !== "object") return body;
  const input = body as Record<string, unknown>;
  const normalized: Record<string, unknown> = { ...input };

  for (const field of ["title", "ctaLabel"]) {
    if (field in input) normalized[field] = normalizeText(input[field]);
  }

  for (const field of ["subtitle", "serviceId", "categoryId", "imageUrl", "discountText", "startsAt", "endsAt"]) {
    if (field in input) normalized[field] = normalizeText(input[field]) ?? null;
  }

  for (const field of ["offerPrice", "originalPrice", "sortOrder"]) {
    if (field in input) normalized[field] = normalizeInteger(input[field]);
  }

  if ("isActive" in input) normalized.isActive = normalizeBoolean(input.isActive);
  return normalized;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function normalizeInteger(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;

  const numericText = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0];
  return numericText ? Number(numericText) : undefined;
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return value;
}

function handleOfferWriteError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return res.status(400).json({ error: "Choose a valid offer service or category before saving." });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Offer banner was not found." });
    }
  }

  return next(error);
}
