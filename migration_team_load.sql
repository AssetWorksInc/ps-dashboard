-- Team & Load: capacity/utilization tracking, imported by hand from an
-- OpenAir export (format varies pull to pull, so no fixed schema is
-- assumed on the source side -- see lib/teamLoadReport.ts). Each import is
-- kept as its own dated/labeled snapshot so the Team & Load page can show
-- a multi-period trend, not just the latest pull.

CREATE TABLE IF NOT EXISTS team_load_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT,
  period_label TEXT NOT NULL,
  imported_by TEXT,
  row_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_load_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_id UUID NOT NULL REFERENCES team_load_imports(id) ON DELETE CASCADE,
  consultant_name TEXT NOT NULL,
  planned_hours NUMERIC,
  capacity_hours NUMERIC,
  utilization_pct NUMERIC,
  extra JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_team_load_rows_import_id ON team_load_rows(import_id);
CREATE INDEX IF NOT EXISTS idx_team_load_rows_consultant_name ON team_load_rows(consultant_name);
CREATE INDEX IF NOT EXISTS idx_team_load_imports_created_at ON team_load_imports(created_at);
