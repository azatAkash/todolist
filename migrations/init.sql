-- enums
DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low','medium','high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('active','completed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- (опционально) таблица пользователей на будущее — сейчас можно иметь 1 локального пользователя.
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- для gen_random_uuid()

CREATE TABLE IF NOT EXISTS app_user (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username    text UNIQUE NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- основная таблица задач
CREATE TABLE IF NOT EXISTS tasks (
  id            bigserial PRIMARY KEY,
  title         text NOT NULL,                     -- короткий текст задачи
  user_id       uuid REFERENCES app_user(id) ON DELETE SET NULL,
  description   text,                              -- детализация (опционально)
  due_at        timestamptz,                       -- дата/время выполнения (для фильтров: сегодня/неделя/просроч.)
  priority      task_priority NOT NULL DEFAULT 'medium',
  status        task_status  NOT NULL DEFAULT 'active',
  created_at    timestamptz  NOT NULL DEFAULT now(),
  updated_at    timestamptz  NOT NULL DEFAULT now(),
  completed_at  timestamptz,                       -- выставляется при статусе completed
  deleted_at    timestamptz,                       -- мягкое удаление (если нужно)
  sort_order    int          NOT NULL DEFAULT 0    -- пользовательская сортировка (drag&drop), если потребуется
);

-- updated_at автозаполнение
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tasks_set_updated ON tasks;
CREATE TRIGGER trg_tasks_set_updated
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- completed_at автозаполнение/сброс
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    NEW.completed_at := COALESCE(NEW.completed_at, now());
  ELSIF NEW.status <> 'completed' THEN
    NEW.completed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_tasks_set_completed ON tasks;
CREATE TRIGGER trg_tasks_set_completed
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_completed_at();

-- индексы под частые фильтры/сортировки
CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority      ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at    ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_at        ON tasks(due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_active_partial
  ON tasks(id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_tasks_completed_partial
  ON tasks(completed_at DESC) WHERE status = 'completed';

-- полезные представления (опционально)
CREATE OR REPLACE VIEW v_tasks_active AS
  SELECT * FROM tasks WHERE status = 'active'  AND deleted_at IS NULL;

CREATE OR REPLACE VIEW v_tasks_completed AS
  SELECT * FROM tasks WHERE status = 'completed' AND deleted_at IS NULL;


