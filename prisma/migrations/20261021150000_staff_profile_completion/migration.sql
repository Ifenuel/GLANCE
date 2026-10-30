-- Staff accounts (GLANCE Network Officer, communication manager, chapter
-- administrator) have no member record, so their personal details live on the
-- user row. profileCompletedAt stays NULL for accounts created by invitation;
-- the portal refuses to open anything else until the person has filled these
-- in, which is how "forced profile completion" is enforced server-side.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "gender" "Gender" DEFAULT 'PREFER_NOT_TO_SAY';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "department" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "academicLevel" "AcademicLevel";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "position" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileCompletedAt" TIMESTAMP(3);
