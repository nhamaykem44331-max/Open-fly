-- AlterTable
ALTER TABLE "Hunt" ADD COLUMN     "autoHoldContactEmail" TEXT,
ADD COLUMN     "autoHoldContactPhone" TEXT,
ADD COLUMN     "autoHoldEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "autoHoldMaxHolds" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "autoHoldPassengers" JSONB,
ADD COLUMN     "autoHoldsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastAutoHeldBookingId" TEXT;

-- CreateTable
CREATE TABLE "RoutePriceObservation" (
    "id" TEXT NOT NULL,
    "fromCode" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "departDate" TIMESTAMP(3) NOT NULL,
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "cabin" TEXT NOT NULL DEFAULT 'economy',
    "fareClass" TEXT,
    "netPriceVnd" INTEGER NOT NULL,
    "sellPriceVnd" INTEGER NOT NULL,
    "seatAvailable" INTEGER,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "huntRunId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'hunt',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoutePriceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutePriceObservation_fromCode_toCode_departDate_idx" ON "RoutePriceObservation"("fromCode", "toCode", "departDate");

-- CreateIndex
CREATE INDEX "RoutePriceObservation_fromCode_toCode_observedAt_idx" ON "RoutePriceObservation"("fromCode", "toCode", "observedAt");
