-- Migration 003: daily AI-chat rate-limit counters (per IP / user / client / global).
-- Additive and idempotent. Run once against Neon:
--   python migrations/run_migration.py migrations/003_chat_usage.sql
CREATE TABLE IF NOT EXISTS chat_usage (
    scope         VARCHAR(30) NOT NULL,
    subject       VARCHAR(80) NOT NULL,
    usage_date    DATE        NOT NULL,
    message_count INTEGER     NOT NULL DEFAULT 0,
    PRIMARY KEY (scope, subject, usage_date)
);
