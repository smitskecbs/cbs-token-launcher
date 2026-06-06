-- Community interest votes for launch submissions.
ALTER TABLE launch_submissions
  ADD COLUMN IF NOT EXISTS interest_count integer NOT NULL DEFAULT 0;

-- Interest for static/catalog mints without a submission row.
CREATE TABLE IF NOT EXISTS launch_interest (
  mint_address text PRIMARY KEY,
  interest_count integer NOT NULL DEFAULT 0 CHECK (interest_count >= 0)
);
