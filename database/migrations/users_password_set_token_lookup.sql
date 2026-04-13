-- Fast path for POST /api/auth/validate-token (avoid scanning all pending invites with bcrypt).
-- Run manually if you do not use TypeORM synchronize.

ALTER TABLE users
  ADD COLUMN password_set_token_lookup VARCHAR(64) NULL
  COMMENT 'SHA-256 hex of plain invite token'
  AFTER password_set_token;

CREATE INDEX IDX_users_password_set_token_lookup ON users (password_set_token_lookup);
