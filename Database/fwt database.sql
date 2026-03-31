
use freelancer_work_tracker;
USE freelancer_work_tracker;

-- ══════════════════════════════════════════
-- 1) users table mein phone aur bio add karo
-- ══════════════════════════════════════════
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone VARCHAR(30)  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bio   TEXT         DEFAULT NULL;

-- ══════════════════════════════════════════
-- 2) user_settings table (naya)
-- ══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS user_settings (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL UNIQUE,

  -- Currency & Tax
  currency             VARCHAR(10)   DEFAULT 'USD',
  tax_label            VARCHAR(50)   DEFAULT 'Tax',
  tax_rate             DECIMAL(5,2)  DEFAULT 0.00,

  -- Language
  language             VARCHAR(10)   DEFAULT 'en',

  -- Appearance
  theme                VARCHAR(20)   DEFAULT 'light',
  accent_color         VARCHAR(20)   DEFAULT '#6c47ff',
  compact_mode         TINYINT(1)    DEFAULT 0,

  -- Notifications
  notif_invoice_paid   TINYINT(1)    DEFAULT 1,
  notif_project_update TINYINT(1)    DEFAULT 1,
  notif_task_reminder  TINYINT(1)    DEFAULT 0,
  notif_weekly_report  TINYINT(1)    DEFAULT 1,
  notif_email_digest   TINYINT(1)    DEFAULT 0,
  notif_browser_push   TINYINT(1)    DEFAULT 0,

  created_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ══════════════════════════════════════════
-- Verify
-- ══════════════════════════════════════════
SHOW TABLES;
DESCRIBE users;
DESCRIBE user_settings;