-- Migration 002: per-day AI chat counter for the demo user.
-- Additive and idempotent. Run once against Neon:
--   python migrations/run_migration.py migrations/002_demo_chat_usage.sql
CREATE TABLE IF NOT EXISTS demo_chat_usage (
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    usage_date    DATE    NOT NULL,
    message_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);
