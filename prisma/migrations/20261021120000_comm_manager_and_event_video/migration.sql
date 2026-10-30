-- The communication manager is a secretariat account scoped to content:
-- events, media and news, without chapter/member administration.
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'COMM_MANAGER';

-- Events can carry a teaser or aftermovie link (YouTube) shown on the
-- public events page alongside the listing.
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
