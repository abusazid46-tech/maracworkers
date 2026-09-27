-- AlterEnum: Add EN_ROUTE to BookingStatus
ALTER TYPE "BookingStatus" ADD VALUE IF NOT EXISTS 'EN_ROUTE' AFTER 'ASSIGNED';

-- AlterTable: Add geo columns to Booking
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "latitude" DECIMAL(65,30);
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "longitude" DECIMAL(65,30);

-- AlterTable: Add tracking columns to Staff
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "currentLat" DECIMAL(65,30);
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "currentLng" DECIMAL(65,30);
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "lastHeading" DOUBLE PRECISION;
ALTER TABLE "Staff" ADD COLUMN IF NOT EXISTS "lastLocationAt" TIMESTAMP(3);

-- CreateIndex: AuthOtp indexes
CREATE INDEX IF NOT EXISTS "AuthOtp_phone_createdAt_idx" ON "AuthOtp"("phone", "createdAt");
CREATE INDEX IF NOT EXISTS "AuthOtp_expiresAt_idx" ON "AuthOtp"("expiresAt");

-- CreateIndex: OfferBanner indexes (may already exist from prior migration)
CREATE INDEX IF NOT EXISTS "OfferBanner_isActive_sortOrder_idx" ON "OfferBanner"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "OfferBanner_serviceId_idx" ON "OfferBanner"("serviceId");
CREATE INDEX IF NOT EXISTS "OfferBanner_categoryId_idx" ON "OfferBanner"("categoryId");
CREATE INDEX IF NOT EXISTS "OfferBanner_startsAt_endsAt_idx" ON "OfferBanner"("startsAt", "endsAt");
