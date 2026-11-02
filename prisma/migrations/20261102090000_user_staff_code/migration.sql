-- Staff accounts (GLANCE team, communications, secretariat) are not chapter
-- members and therefore have no member GLN code; their profile identity badge
-- used to read "—". This reference is issued at first profile completion.
ALTER TABLE "User" ADD COLUMN "staffCode" TEXT;
CREATE UNIQUE INDEX "User_staffCode_key" ON "User"("staffCode") WHERE "staffCode" IS NOT NULL;
