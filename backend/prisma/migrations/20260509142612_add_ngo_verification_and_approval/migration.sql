-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "approvalNotes" TEXT,
ADD COLUMN     "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "ngoAddress" TEXT,
ADD COLUMN     "ngoContactPhone" TEXT,
ADD COLUMN     "ngoDescription" TEXT,
ADD COLUMN     "ngoOrganizationName" TEXT,
ADD COLUMN     "ngoRegistrationNumber" TEXT,
ADD COLUMN     "ngoSsmDocumentPath" TEXT,
ADD COLUMN     "ngoSupportingDocPaths" TEXT[];
