-- CreateTable
CREATE TABLE "SavedVatProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "taxId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedVatProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedVatProfile_userId_idx" ON "SavedVatProfile"("userId");

-- AddForeignKey
ALTER TABLE "SavedVatProfile" ADD CONSTRAINT "SavedVatProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
