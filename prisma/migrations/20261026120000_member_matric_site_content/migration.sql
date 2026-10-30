-- MemberProfile.matricNo + SiteContent key/value CMS store
ALTER TABLE "MemberProfile" ADD COLUMN "matricNo" TEXT;

CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);
