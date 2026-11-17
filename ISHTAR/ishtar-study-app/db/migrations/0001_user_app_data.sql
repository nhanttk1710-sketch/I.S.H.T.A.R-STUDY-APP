-- I.S.H.T.A.R cloud data document
-- Apply AFTER Better Auth has created its PostgreSQL "user" table.
-- Non-destructive: creates only the app-owned data table and index.

CREATE TABLE IF NOT EXISTS public.user_app_data (
  user_id text PRIMARY KEY REFERENCES public."user"(id) ON DELETE CASCADE,
  schema_version integer NOT NULL DEFAULT 1 CHECK (schema_version >= 1),
  data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(data) = 'object'),
  revision bigint NOT NULL DEFAULT 0 CHECK (revision >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_app_data_updated_at_idx
  ON public.user_app_data (updated_at DESC);

COMMENT ON TABLE public.user_app_data IS
  'One versioned JSONB study-data document per Better Auth user. Writes must use optimistic revision checks in authenticated server routes.';
COMMENT ON COLUMN public.user_app_data.revision IS
  'Monotonically increasing revision; increment atomically on every accepted write.';
COMMENT ON COLUMN public.user_app_data.data IS
  'Account-owned study data only. Never store credentials, sessions, tokens, or device-only UI state here.';
