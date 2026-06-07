-- Launch Analytics V1: page view totals per public launch id.
-- launch_id uses catalog ids (e.g. cbs-coin, mango, submission-{uuid}).

CREATE TABLE IF NOT EXISTS launch_analytics (
  launch_id text PRIMARY KEY,
  page_views integer NOT NULL DEFAULT 0 CHECK (page_views >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS launch_analytics_updated_at_idx
  ON launch_analytics (updated_at DESC);

CREATE OR REPLACE FUNCTION increment_launch_page_view(p_launch_id text)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_page_views integer;
BEGIN
  INSERT INTO launch_analytics (launch_id, page_views)
  VALUES (p_launch_id, 1)
  ON CONFLICT (launch_id)
  DO UPDATE SET
    page_views = launch_analytics.page_views + 1,
    updated_at = now()
  RETURNING page_views INTO v_page_views;

  RETURN v_page_views;
END;
$$;

-- PostgREST / service_role access (required for API RPC calls).
GRANT SELECT, INSERT, UPDATE ON TABLE public.launch_analytics TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_launch_page_view(text) TO service_role;
