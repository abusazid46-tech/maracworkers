import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(24, "JWT_SECRET must be at least 24 characters"),
  CORS_ORIGIN: z.string().default("http://localhost:3000,http://localhost:3001"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  ERROR_MONITOR_WEBHOOK_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional().transform((value) => value?.trim().replace(/^["']|["']$/g, "") || undefined),
  OTP_DEBUG_ENABLED: z.coerce.boolean().default(false),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_GRAPH_VERSION: z.string().default("v20.0"),
  WHATSAPP_ADMIN_PHONE: z.string().optional(),
  KEEP_ALIVE_URL: z.string().url().optional(),
  KEEP_ALIVE_INTERVAL_MINUTES: z.coerce.number().int().positive().default(14)
});

export const env = envSchema.parse(process.env);

const requiredCorsOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://maracworkers.onrender.com",
  "https://www.thewingsgroup.online",
  "https://thewingsgroup.online",
  "https://the-wings-group1.vercel.app",
  "https://the-wings-group-admin.vercel.app"
];

function normalizeOrigin(origin: string) {
  return origin.trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
}

export const corsOrigins = Array.from(
  new Set([
    ...requiredCorsOrigins,
    ...env.CORS_ORIGIN.split(",")
      .map(normalizeOrigin)
      .filter(Boolean)
  ])
);

export function isCorsOriginAllowed(origin?: string) {
  if (!origin) return true;
  const normalizedOrigin = normalizeOrigin(origin);
  try {
    return corsOrigins.includes(normalizedOrigin) || /\.vercel\.app$/.test(new URL(normalizedOrigin).hostname);
  } catch {
    return false;
  }
}
