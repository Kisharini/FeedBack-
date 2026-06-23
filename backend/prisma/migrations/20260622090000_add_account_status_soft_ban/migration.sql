CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'BANNED');

ALTER TABLE "users"
ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE';
