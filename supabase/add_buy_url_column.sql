-- Optional buy link for live launch submissions (admin-edited).
ALTER TABLE launch_submissions
  ADD COLUMN IF NOT EXISTS buy_url text;
