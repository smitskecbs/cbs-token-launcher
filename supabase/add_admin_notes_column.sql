ALTER TABLE launch_submissions
  ADD COLUMN IF NOT EXISTS admin_notes text;
