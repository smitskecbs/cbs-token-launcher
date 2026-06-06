-- Add admin-controlled verified flag to launch submissions.
ALTER TABLE launch_submissions
  ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;
