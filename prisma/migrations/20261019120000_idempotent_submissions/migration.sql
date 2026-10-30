-- Public forms must be safe under concurrent load.
--
-- The handlers already look for an existing pending record before inserting,
-- but check-then-create is a race: two identical requests arriving together (a
-- double-click, a retried fetch, two visitors on a slow connection) both pass
-- the check and both insert. Under real traffic that is exactly what happens,
-- so the duplicate is prevented at the database instead of being filtered in
-- application code. The handlers treat the resulting unique violation as
-- "already submitted" and answer with the same friendly confirmation.

-- Join applications: one live application per email address.
CREATE UNIQUE INDEX IF NOT EXISTS "JoinApplication_email_pending_key"
ON "JoinApplication" (LOWER(email))
WHERE status = 'PENDING';

-- Chapter applications: one live application per institution, regardless of
-- the casing the applicant happened to type.
CREATE UNIQUE INDEX IF NOT EXISTS "ChapterApplication_institution_pending_key"
ON "ChapterApplication" (LOWER(institution))
WHERE status = 'PENDING';

-- Contact messages: the browser sends an idempotency key once per form render,
-- so a repeated submission of the same form cannot store twice.
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "submissionToken" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ContactMessage_submissionToken_key"
ON "ContactMessage" ("submissionToken");
