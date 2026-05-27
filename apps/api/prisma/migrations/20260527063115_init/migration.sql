-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'AGENT', 'ADMIN');

-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('STANDARD', 'PREMIUM', 'AGENT');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'HELD', 'PRICING_PENDING', 'TICKETED', 'EXPIRED', 'CANCELLED', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "MarkupType" AS ENUM ('PERCENT', 'FIXED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'REVIEWING', 'CONTACTED_AIRLINE', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RefundKind" AS ENUM ('REFUND', 'EXCHANGE', 'PASSENGER_CHANGE');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('SEPAY', 'PAYOS', 'VNPAY', 'MOMO', 'ZALOPAY', 'CARD', 'BANK_TRANSFER');

-- CreateEnum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('PENDING', 'PROCESSING', 'PAID', 'PARTIAL', 'EXPIRED', 'CANCELLED', 'FAILED', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "HuntStatus" AS ENUM ('HUNTING', 'FOUND', 'PAUSED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "HuntFlexibility" AS ENUM ('EXACT_DATE', 'DATE_RANGE', 'WEEK_OF_MONTH', 'WHOLE_MONTH', 'ANY_DAY');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('HUNT_FOUND', 'HUNT_PROGRESS', 'BOOKING_CONFIRMED', 'BOOKING_TICKETED', 'BOOKING_REMINDER', 'PAYMENT_SUCCESS', 'PAYMENT_FAILED', 'CHECKIN_OPEN', 'PRICE_DROP', 'SOL_MESSAGE', 'VOUCHER_NEW', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'TELEGRAM', 'EMAIL', 'ZALO', 'IN_APP');

-- CreateEnum
CREATE TYPE "VoucherType" AS ENUM ('AMOUNT', 'PERCENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "googleId" TEXT,
    "googleEmail" TEXT,
    "fullName" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "tier" "MembershipTier" NOT NULL DEFAULT 'STANDARD',
    "milesBalance" INTEGER NOT NULL DEFAULT 0,
    "avatarUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'vi',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "blockReason" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtpChallenge" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedPassenger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "isChild" BOOLEAN NOT NULL DEFAULT false,
    "cccd" TEXT,
    "passport" TEXT,
    "nationality" TEXT DEFAULT 'VN',
    "passportExp" TIMESTAMP(3),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "adt" INTEGER NOT NULL DEFAULT 1,
    "chd" INTEGER NOT NULL DEFAULT 0,
    "inf" INTEGER NOT NULL DEFAULT 0,
    "cabin" TEXT NOT NULL DEFAULT 'economy',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "pnr" TEXT,
    "sessionId" TEXT,
    "airline" TEXT,
    "flightNumber" TEXT,
    "aircraft" TEXT,
    "fromCode" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "departTime" TIMESTAMP(3) NOT NULL,
    "arriveTime" TIMESTAMP(3),
    "duration" TEXT,
    "cabin" TEXT NOT NULL DEFAULT 'economy',
    "totalNetPrice" INTEGER NOT NULL,
    "totalSellPrice" INTEGER NOT NULL,
    "totalMarkup" INTEGER NOT NULL DEFAULT 0,
    "appliedMarkupRuleId" TEXT,
    "appliedMarkupRuleSnapshot" JSONB,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "fee" INTEGER NOT NULL DEFAULT 0,
    "addons" INTEGER NOT NULL DEFAULT 0,
    "voucherDiscount" INTEGER NOT NULL DEFAULT 0,
    "appliedVoucherCode" TEXT,
    "vatCompanyName" TEXT NOT NULL,
    "vatTaxId" TEXT NOT NULL,
    "vatAddress" TEXT NOT NULL,
    "vatEmail" TEXT,
    "vatStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "vatInvoiceNumber" TEXT,
    "vatIssuedAt" TIMESTAMP(3),
    "vatProviderRef" TEXT,
    "priceLockedAt" TIMESTAMP(3),
    "ttlExpiresAt" TIMESTAMP(3),
    "rawMuadiJson" JSONB,
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarkupRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "channelScope" TEXT,
    "airlineCode" TEXT,
    "routeFrom" TEXT,
    "routeTo" TEXT,
    "cabin" TEXT,
    "paxType" TEXT,
    "domestic" BOOLEAN,
    "tierScope" "MembershipTier"[],
    "type" "MarkupType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxAmount" INTEGER,
    "minAmount" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarkupRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "RefundKind" NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "userReason" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cskhAssignedTo" TEXT,
    "cskhNote" TEXT,
    "airlineResponse" TEXT,
    "refundAmount" INTEGER,
    "refundProcessedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,

    CONSTRAINT "RefundRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPassenger" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "gender" TEXT,
    "dob" TIMESTAMP(3),
    "isChild" BOOLEAN NOT NULL DEFAULT false,
    "cccd" TEXT,
    "passport" TEXT,
    "seatCode" TEXT,
    "baggage" TEXT,

    CONSTRAINT "BookingPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingPnr" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "airline" TEXT NOT NULL,
    "pnr" TEXT NOT NULL,
    "timelimit" TIMESTAMP(3),
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingPnr_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingTimelineEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "payload" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingTimelineEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentIntent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "providerOrderCode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'VND',
    "status" "PaymentIntentStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutUrl" TEXT,
    "qrCodeData" TEXT,
    "accountNumber" TEXT,
    "bin" TEXT,
    "expiresAt" TIMESTAMP(3),
    "rawCreatePayload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "paymentIntentId" TEXT,
    "provider" "PaymentProvider" NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "transactionRef" TEXT,
    "proofUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankTransaction" (
    "id" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reference" TEXT,
    "rawPayload" JSONB NOT NULL,
    "matchedIntentId" TEXT,
    "status" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hunt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "HuntStatus" NOT NULL DEFAULT 'HUNTING',
    "fromCode" TEXT NOT NULL,
    "toCode" TEXT NOT NULL,
    "flexibility" "HuntFlexibility" NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "windowEnd" TIMESTAMP(3) NOT NULL,
    "targetPrice" INTEGER NOT NULL,
    "bestPriceFound" INTEGER,
    "bestPriceDate" TIMESTAMP(3),
    "pax" INTEGER NOT NULL DEFAULT 1,
    "cabin" TEXT NOT NULL DEFAULT 'economy',
    "airlines" TEXT[],
    "channels" TEXT[],
    "intervalMinutes" INTEGER NOT NULL DEFAULT 120,
    "nextRunAt" TIMESTAMP(3),
    "lastRunAt" TIMESTAMP(3),
    "failureStreak" INTEGER NOT NULL DEFAULT 0,
    "emptyStreak" INTEGER NOT NULL DEFAULT 0,
    "scansCount" INTEGER NOT NULL DEFAULT 0,
    "notifsSentCount" INTEGER NOT NULL DEFAULT 0,
    "autoDisabledAt" TIMESTAMP(3),
    "autoDisabledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hunt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HuntRun" (
    "id" TEXT NOT NULL,
    "huntId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationMs" INTEGER,
    "resultCount" INTEGER NOT NULL DEFAULT 0,
    "cheapestPrice" INTEGER,
    "cheapestDate" TIMESTAMP(3),
    "rawResults" JSONB,
    "diffSummary" JSONB,
    "triggeredNotif" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,

    CONSTRAINT "HuntRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "telegramEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "zaloEnabled" BOOLEAN NOT NULL DEFAULT false,
    "telegramChatId" TEXT,
    "zaloUserId" TEXT,
    "quietHoursStart" TEXT,
    "quietHoursEnd" TEXT,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ctaUrl" TEXT,
    "ctaLabel" TEXT,
    "payload" JSONB,
    "readAt" TIMESTAMP(3),
    "huntId" TEXT,
    "bookingId" TEXT,
    "channelsAttempted" "NotificationChannel"[],
    "channelsSucceeded" "NotificationChannel"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,
    "toolCallsJson" JSONB,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "VoucherType" NOT NULL,
    "value" INTEGER NOT NULL,
    "maxDiscount" INTEGER,
    "minOrder" INTEGER,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "totalQuantity" INTEGER,
    "perUserLimit" INTEGER NOT NULL DEFAULT 1,
    "airlineFilter" TEXT[],
    "tierFilter" "MembershipTier"[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVoucher" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "usedBookingId" TEXT,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorType" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MuadiSession" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "agentCode" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordEnc" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "serverDiff" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "busy" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "lastRefreshedAt" TIMESTAMP(3),
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MuadiSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'VN',
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Airline" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "color" TEXT,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Airline_pkey" PRIMARY KEY ("code")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_expiresAt_idx" ON "RefreshToken"("expiresAt");

-- CreateIndex
CREATE INDEX "OtpChallenge_phone_createdAt_idx" ON "OtpChallenge"("phone", "createdAt");

-- CreateIndex
CREATE INDEX "OtpChallenge_expiresAt_idx" ON "OtpChallenge"("expiresAt");

-- CreateIndex
CREATE INDEX "SavedPassenger_userId_idx" ON "SavedPassenger"("userId");

-- CreateIndex
CREATE INDEX "SearchHistory_userId_createdAt_idx" ON "SearchHistory"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_orderCode_key" ON "Booking"("orderCode");

-- CreateIndex
CREATE INDEX "Booking_userId_status_idx" ON "Booking"("userId", "status");

-- CreateIndex
CREATE INDEX "Booking_status_ttlExpiresAt_idx" ON "Booking"("status", "ttlExpiresAt");

-- CreateIndex
CREATE INDEX "Booking_departTime_idx" ON "Booking"("departTime");

-- CreateIndex
CREATE INDEX "Booking_vatStatus_vatIssuedAt_idx" ON "Booking"("vatStatus", "vatIssuedAt");

-- CreateIndex
CREATE INDEX "MarkupRule_active_priority_idx" ON "MarkupRule"("active", "priority");

-- CreateIndex
CREATE INDEX "MarkupRule_airlineCode_routeFrom_routeTo_idx" ON "MarkupRule"("airlineCode", "routeFrom", "routeTo");

-- CreateIndex
CREATE INDEX "RefundRequest_bookingId_idx" ON "RefundRequest"("bookingId");

-- CreateIndex
CREATE INDEX "RefundRequest_status_requestedAt_idx" ON "RefundRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "BookingPassenger_bookingId_idx" ON "BookingPassenger"("bookingId");

-- CreateIndex
CREATE INDEX "BookingPnr_bookingId_idx" ON "BookingPnr"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "BookingPnr_airline_pnr_key" ON "BookingPnr"("airline", "pnr");

-- CreateIndex
CREATE INDEX "BookingTimelineEvent_bookingId_occurredAt_idx" ON "BookingTimelineEvent"("bookingId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentIntent_providerOrderCode_key" ON "PaymentIntent"("providerOrderCode");

-- CreateIndex
CREATE INDEX "PaymentIntent_bookingId_idx" ON "PaymentIntent"("bookingId");

-- CreateIndex
CREATE INDEX "PaymentIntent_status_idx" ON "PaymentIntent"("status");

-- CreateIndex
CREATE INDEX "Payment_bookingId_idx" ON "Payment"("bookingId");

-- CreateIndex
CREATE INDEX "Payment_paymentIntentId_idx" ON "Payment"("paymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "BankTransaction_dedupeKey_key" ON "BankTransaction"("dedupeKey");

-- CreateIndex
CREATE INDEX "BankTransaction_provider_receivedAt_idx" ON "BankTransaction"("provider", "receivedAt");

-- CreateIndex
CREATE INDEX "BankTransaction_status_idx" ON "BankTransaction"("status");

-- CreateIndex
CREATE INDEX "Hunt_userId_status_idx" ON "Hunt"("userId", "status");

-- CreateIndex
CREATE INDEX "Hunt_nextRunAt_status_idx" ON "Hunt"("nextRunAt", "status");

-- CreateIndex
CREATE INDEX "HuntRun_huntId_startedAt_idx" ON "HuntRun"("huntId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Conversation_userId_updatedAt_idx" ON "Conversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "ChatMessage_conversationId_createdAt_idx" ON "ChatMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoucherTemplate_code_key" ON "VoucherTemplate"("code");

-- CreateIndex
CREATE INDEX "UserVoucher_userId_status_idx" ON "UserVoucher"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserVoucher_userId_templateId_key" ON "UserVoucher"("userId", "templateId");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MuadiSession_label_key" ON "MuadiSession"("label");

-- CreateIndex
CREATE INDEX "MuadiSession_active_busy_idx" ON "MuadiSession"("active", "busy");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedPassenger" ADD CONSTRAINT "SavedPassenger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_appliedMarkupRuleId_fkey" FOREIGN KEY ("appliedMarkupRuleId") REFERENCES "MarkupRule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefundRequest" ADD CONSTRAINT "RefundRequest_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPassenger" ADD CONSTRAINT "BookingPassenger_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingPnr" ADD CONSTRAINT "BookingPnr_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTimelineEvent" ADD CONSTRAINT "BookingTimelineEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentIntent" ADD CONSTRAINT "PaymentIntent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_paymentIntentId_fkey" FOREIGN KEY ("paymentIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankTransaction" ADD CONSTRAINT "BankTransaction_matchedIntentId_fkey" FOREIGN KEY ("matchedIntentId") REFERENCES "PaymentIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hunt" ADD CONSTRAINT "Hunt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HuntRun" ADD CONSTRAINT "HuntRun_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_huntId_fkey" FOREIGN KEY ("huntId") REFERENCES "Hunt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVoucher" ADD CONSTRAINT "UserVoucher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVoucher" ADD CONSTRAINT "UserVoucher_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "VoucherTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
