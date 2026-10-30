-- Staff accounts (GLANCE Network Officer, communication manager) have no
-- MemberProfile row, so their profile photo lives on the account itself.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarPublicId" TEXT;
