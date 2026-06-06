-- Project update timeline for static launches and Supabase submissions.
CREATE TABLE IF NOT EXISTS launch_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES launch_submissions(id) ON DELETE CASCADE,
  launch_id text,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT launch_updates_target_check CHECK (
    (submission_id IS NOT NULL AND launch_id IS NULL)
    OR (submission_id IS NULL AND launch_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS launch_updates_submission_id_created_at_idx
  ON launch_updates (submission_id, created_at DESC);

CREATE INDEX IF NOT EXISTS launch_updates_launch_id_created_at_idx
  ON launch_updates (launch_id, created_at DESC);
