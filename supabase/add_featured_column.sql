-- Add admin-controlled featured flag to launch submissions.
ALTER TABLE launch_submissions
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
