-- Add explicit Muadi hold/payment deadlines for booking hold flow.
ALTER TABLE "Booking" ADD COLUMN "muadiHoldExpiresAt" TIMESTAMP(3);
ALTER TABLE "Booking" ADD COLUMN "paymentDeadline" TIMESTAMP(3);
