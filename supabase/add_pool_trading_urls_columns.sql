ALTER TABLE launch_submissions
  ADD COLUMN IF NOT EXISTS pool_url text,
  ADD COLUMN IF NOT EXISTS raydium_url text,
  ADD COLUMN IF NOT EXISTS jupiter_url text;
