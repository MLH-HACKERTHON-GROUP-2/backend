-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "adminUserId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Pharmacy" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_adminUserId_key" ON "Hospital"("adminUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Pharmacy_userId_key" ON "Pharmacy"("userId");

-- AddForeignKey
ALTER TABLE "Hospital" ADD CONSTRAINT "Hospital_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pharmacy" ADD CONSTRAINT "Pharmacy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

