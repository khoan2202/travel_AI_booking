BEGIN;
CREATE TABLE admin_audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(60) NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  entity_id INTEGER NOT NULL,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at DESC);
COMMIT;
