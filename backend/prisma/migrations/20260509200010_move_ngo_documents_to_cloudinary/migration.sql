/*
  Warnings:

  - You are about to drop the column `ngoSsmDocumentPath` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `ngoSupportingDocPaths` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "ngoSsmDocumentPath",
DROP COLUMN "ngoSupportingDocPaths",
ADD COLUMN     "ngoSsmDocumentPublicId" TEXT,
ADD COLUMN     "ngoSsmDocumentUrl" TEXT,
ADD COLUMN     "ngoSupportingDocPublicIds" TEXT[],
ADD COLUMN     "ngoSupportingDocUrls" TEXT[];
