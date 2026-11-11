-- Migration 001: foreign-key delete rules + invoices.project_name
--
-- Run ONCE against the existing Neon database (create_all never alters existing
-- tables). Idempotent: safe to re-run. Executed as a single transaction by
-- migrations/run_migration.py. If you paste this into the Neon SQL editor instead,
-- wrap it in BEGIN; ... COMMIT;
--
-- Constraint names are PostgreSQL's defaults (<table>_<column>_fkey).

-- 1) invoices.project_name: snapshot of the project title
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);

-- 2) BACKFILL existing invoices from their linked project, BEFORE any project can be deleted
UPDATE invoices i
SET    project_name = p.title
FROM   projects p
WHERE  i.project_id = p.id
  AND  i.project_name IS NULL;

-- 3) Invoices survive project deletion (project_id -> NULL)
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE invoices ADD CONSTRAINT invoices_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- 4) Deleting a project removes its tasks; deleting a task removes its time entries
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_project_id_fkey;
ALTER TABLE tasks ADD CONSTRAINT tasks_project_id_fkey
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE time_entries DROP CONSTRAINT IF EXISTS time_entries_task_id_fkey;
ALTER TABLE time_entries ADD CONSTRAINT time_entries_task_id_fkey
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- 5) Deleting a client removes its projects, conversations and (via conversations) messages.
--    invoices.client_id is intentionally left as-is (blocking): the API returns a 409
--    "This client has invoices. Delete them first."
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_client_id_fkey;
ALTER TABLE projects ADD CONSTRAINT projects_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_client_id_fkey;
ALTER TABLE conversations ADD CONSTRAINT conversations_client_id_fkey
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
