import { Router, type NextFunction, type Response } from "express";
import { Prisma } from "@prisma/client";
import type { ServiceCatalogEventSnapshot } from "@the-wings/types";
import { serviceCreateSchema, serviceUpdateSchema } from "@the-wings/validation";
import { prisma } from "../db/prisma.js";
import { isStaffRole, optionalAuth, requireRoles } from "../middleware/auth.js";
import { logger } from "../services/logger.js";

import { defaultCategories, defaultServices } from "../data/catalog.js";

export const servicesRouter = Router();

async function ensureDefaultCategories() {
  for (const cat of defaultCategories) {
    await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, description: cat.description, sortOrder: cat.sortOrder },
      create: cat
    }).catch(() => {});
  }
}

async function ensureDefaultServices() {
  const serviceCount = await prisma.service.count();
  if (serviceCount > 0) return;

  const categories = await prisma.serviceCategory.findMany();
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]));

  for (const svc of defaultServices) {
    const categoryId = categoryMap.get(svc.categorySlug);
    if (!categoryId) continue;

    await prisma.service.upsert({
      where: { slug: svc.slug },
      update: {
        categoryId,
        name: svc.name,
        description: svc.description,
        icon: svc.icon,
        basePrice: svc.basePrice,
        originalPrice: svc.originalPrice,
        durationMin: svc.durationMin,
        sortOrder: svc.sortOrder,
        groupLabel: svc.groupLabel,
        priceLabel: svc.priceLabel,
        originalPriceLabel: svc.originalPriceLabel,
        discountLabel: svc.discountLabel
      },
      create: {
        categoryId,
        name: svc.name,
        slug: svc.slug,
        description: svc.description,
        icon: svc.icon,
        basePrice: svc.basePrice,
        originalPrice: svc.originalPrice,
        durationMin: svc.durationMin,
        sortOrder: svc.sortOrder,
        groupLabel: svc.groupLabel,
        priceLabel: svc.priceLabel,
        originalPriceLabel: svc.originalPriceLabel,
        discountLabel: svc.discountLabel,
        isActive: true
      }
    }).catch(() => {});
  }
}

servicesRouter.get("/categories", async (_req, res, next) => {
  try {
    await ensureDefaultCategories();
    const categories = await prisma.serviceCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" }
    });
    res.json({ data: categories });
  } catch (error) {
    next(error);
  }
});

servicesRouter.get("/events", async (req, res, next) => {
  let initialSnapshot: ServiceCatalogEventSnapshot;

  try {
    await ensureDefaultCategories();
    initialSnapshot = await loadServiceCatalogSnapshot();
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

  function send(event: string, data: ServiceCatalogEventSnapshot | { ok: true; timestamp: string }) {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  async function publish() {
    const snapshot = await loadServiceCatalogSnapshot();
    if (snapshot.revision !== previousRevision) {
      previousRevision = snapshot.revision;
      send("catalog:update", snapshot);
      return;
    }

    send("heartbeat", { ok: true, timestamp: new Date().toISOString() });
  }

  send("connected", initialSnapshot);

  const interval = setInterval(() => {
    publish().catch((error: unknown) => {
      send("catalog:error", { ok: true, timestamp: new Date().toISOString() });
      logger.error("Service catalog event stream failed", { error });
    });
  }, 5000);

  req.on("close", () => {
    closed = true;
    clearInterval(interval);
    res.end();
  });
});

servicesRouter.get("/popular", async (req, res, next) => {
  try {
    const limit = clampLimit(req.query.limit);
    const rankedItems = await prisma.bookingItem.groupBy({
      by: ["serviceId"],
      where: {
        serviceId: { not: null },
        booking: {
          status: { notIn: ["CANCELLED", "REFUNDED"] }
        }
      },
      _count: { _all: true },
      _sum: { quantity: true },
      orderBy: [{ _sum: { quantity: "desc" } }, { _count: { serviceId: "desc" } }],
      take: limit * 2
    });

    const ranking = new Map(
      rankedItems
        .filter((item): item is typeof item & { serviceId: string } => Boolean(item.serviceId))
        .map((item, index) => [
          item.serviceId,
          {
            index,
            bookingCount: item._count._all,
            bookedQuantity: item._sum.quantity ?? 0
          }
        ])
    );

    const rankedServiceIds = Array.from(ranking.keys());
    const rankedServices = rankedServiceIds.length > 0
      ? await prisma.service.findMany({
          where: { id: { in: rankedServiceIds }, isActive: true },
          include: { category: true }
        })
      : [];

    const orderedRankedServices = rankedServices
      .map((service) => {
        const rank = ranking.get(service.id);
        return {
          ...service,
          bookingCount: rank?.bookingCount ?? 0,
          bookedQuantity: rank?.bookedQuantity ?? 0,
          __rankIndex: rank?.index ?? Number.MAX_SAFE_INTEGER
        };
      })
      .sort((left, right) => left.__rankIndex - right.__rankIndex)
      .slice(0, limit)
      .map(({ __rankIndex: _rankIndex, ...service }) => service);

    if (orderedRankedServices.length >= limit) {
      return res.json({ data: orderedRankedServices });
    }

    const fallbackServices = await prisma.service.findMany({
      where: {
        isActive: true,
        id: { notIn: orderedRankedServices.map((service) => service.id) }
      },
      include: { category: true },
      orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
      take: limit - orderedRankedServices.length
    });

    return res.json({
      data: [
        ...orderedRankedServices,
        ...fallbackServices.map((service) => ({
          ...service,
          bookingCount: 0,
          bookedQuantity: 0
        }))
      ]
    });
  } catch (error) {
    next(error);
  }
});

servicesRouter.get("/", optionalAuth, async (req, res, next) => {
  try {
    await ensureDefaultCategories();
    await ensureDefaultServices();
    const user = (req as typeof req & { authUser?: { role: "ADMIN" | "MANAGER" | "STAFF" | "CUSTOMER" } }).authUser;
    const canSeeInactive = Boolean(user && isStaffRole(user.role));
    if (req.query.includeInactive === "true" && !canSeeInactive) {
      return res.status(403).json({ error: "You do not have permission to view inactive services" });
    }

    const services = await prisma.service.findMany({
      where: req.query.includeInactive === "true" && canSeeInactive ? undefined : { isActive: true },
      include: { category: true },
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }]
    });
    res.json({ data: services });
  } catch (error) {
    next(error);
  }
});

servicesRouter.post("/", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = await parseServiceCreateBody(req.body);
    const service = await prisma.service.create({ data: input });
    res.status(201).json({ data: service });
  } catch (error) {
    handleServiceWriteError(error, res, next);
  }
});

servicesRouter.patch("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const input = await parseServiceUpdateBody(req.body);
    const service = await prisma.service.update({
      where: { id: String(req.params.id ?? "") },
      data: input
    });
    res.json({ data: service });
  } catch (error) {
    handleServiceWriteError(error, res, next);
  }
});

servicesRouter.delete("/:id", ...requireRoles("ADMIN", "MANAGER"), async (req, res, next) => {
  try {
    const service = await prisma.service.update({
      where: { id: String(req.params.id ?? "") },
      data: { isActive: false }
    });
    res.json({ data: service });
  } catch (error) {
    handleServiceWriteError(error, res, next);
  }
});

function handleServiceWriteError(error: unknown, res: Response, next: NextFunction) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "A service with this slug already exists. Use a unique slug." });
    }

    if (error.code === "P2003") {
      return res.status(400).json({ error: "Choose a valid service category before saving." });
    }

    if (error.code === "P2025") {
      return res.status(404).json({ error: "Service was not found." });
    }
  }

  return next(error);
}

async function parseServiceCreateBody(body: unknown) {
  await ensureDefaultCategories();
  const input = serviceCreateSchema.parse(normalizeServiceBody(body, { defaultDescription: true }));
  const categoryId = await resolveServiceCategoryId(input.categoryId);
  const nextSortOrder = input.sortOrder > 0 ? input.sortOrder : (await prisma.service.count()) + 1;

  return {
    ...input,
    categoryId,
    sortOrder: nextSortOrder
  };
}

async function parseServiceUpdateBody(body: unknown) {
  await ensureDefaultCategories();
  const input = serviceUpdateSchema.parse(normalizeServiceBody(body, { defaultDescription: false }));
  if (!input.categoryId) return input;

  return {
    ...input,
    categoryId: await resolveServiceCategoryId(input.categoryId)
  };
}

function normalizeServiceBody(body: unknown, options: { defaultDescription: boolean }) {
  if (!body || typeof body !== "object") return body;
  const input = body as Record<string, unknown>;
  const name = normalizeText(input.name) ?? "";
  const slug = normalizeText(input.slug) || slugify(name);
  const description = normalizeText(input.description) ?? "";
  const normalized: Record<string, unknown> = { ...input };

  if (input.categoryId !== undefined || options.defaultDescription) normalized.categoryId = normalizeText(input.categoryId) || "toilet-bath";
  if (input.name !== undefined || options.defaultDescription) normalized.name = name;
  if (input.slug !== undefined || options.defaultDescription) normalized.slug = slug;
  if (input.icon !== undefined) normalized.icon = normalizeText(input.icon);
  if (input.imageUrl !== undefined) normalized.imageUrl = normalizeText(input.imageUrl);
  if (input.basePrice !== undefined) normalized.basePrice = normalizeInteger(input.basePrice);
  if (input.groupLabel !== undefined) normalized.groupLabel = normalizeNullableText(input.groupLabel);
  if (input.priceLabel !== undefined) normalized.priceLabel = normalizeNullableText(input.priceLabel);
  if (input.originalPrice !== undefined) normalized.originalPrice = normalizeNullableInteger(input.originalPrice);
  if (input.originalPriceLabel !== undefined) normalized.originalPriceLabel = normalizeNullableText(input.originalPriceLabel);
  if (input.discountLabel !== undefined) normalized.discountLabel = normalizeNullableText(input.discountLabel);
  if (input.durationMin !== undefined) normalized.durationMin = normalizeInteger(input.durationMin);
  if (input.sortOrder !== undefined) normalized.sortOrder = normalizeInteger(input.sortOrder);
  if (input.isActive !== undefined) normalized.isActive = normalizeBoolean(input.isActive);

  if (input.description !== undefined || options.defaultDescription) {
    return {
      ...normalized,
      description: description.length >= 10 ? description : name ? `${name} service by Marac Workers.` : description
    };
  }

  return normalized;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() || undefined : undefined;
}

function normalizeNullableText(value: unknown) {
  if (value === null) return null;
  return normalizeText(value);
}

function normalizeInteger(value: unknown) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;

  const numericText = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/)?.[0];
  return numericText ? Number(numericText) : undefined;
}

function normalizeNullableInteger(value: unknown) {
  if (value === null) return null;
  return normalizeInteger(value);
}

function normalizeBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return value;
}

function clampLimit(value: unknown) {
  const parsed = normalizeInteger(value);
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) return 5;
  return Math.min(Math.max(Math.floor(parsed), 1), 12);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function resolveServiceCategoryId(categoryId: string) {
  const category = await prisma.serviceCategory.findFirst({
    where: {
      OR: [{ id: categoryId }, { slug: categoryId }]
    }
  });
  if (category) return category.id;

  const fallbackCategory = await prisma.serviceCategory.findFirst({
    orderBy: { sortOrder: "asc" }
  });
  if (fallbackCategory) return fallbackCategory.id;

  throw new Error("No service categories are available.");
}

async function loadServiceCatalogSnapshot(): Promise<ServiceCatalogEventSnapshot> {
  const [activeServices, activeCategories, latestService, latestCategory] = await Promise.all([
    prisma.service.count({ where: { isActive: true } }),
    prisma.serviceCategory.count({ where: { isActive: true } }),
    prisma.service.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        categoryId: true,
        isActive: true,
        updatedAt: true
      }
    }),
    prisma.serviceCategory.findFirst({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        updatedAt: true
      }
    })
  ]);

  const revision = [
    activeServices,
    activeCategories,
    latestService?.id ?? "no-service",
    latestService?.updatedAt.toISOString() ?? "no-service-time",
    latestCategory?.id ?? "no-category",
    latestCategory?.updatedAt.toISOString() ?? "no-category-time"
  ].join(":");

  return {
    revision,
    timestamp: new Date().toISOString(),
    activeServices,
    activeCategories,
    latestService: latestService
      ? {
          id: latestService.id,
          name: latestService.name,
          categoryId: latestService.categoryId,
          isActive: latestService.isActive,
          updatedAt: latestService.updatedAt.toISOString()
        }
      : null,
    latestCategory: latestCategory
      ? {
          id: latestCategory.id,
          name: latestCategory.name,
          slug: latestCategory.slug,
          updatedAt: latestCategory.updatedAt.toISOString()
        }
      : null
  };
}
