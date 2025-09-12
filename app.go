package main

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type Task struct {
	ID          int64      `json:"id"`
	UserID      *string    `json:"user_id,omitempty"` // use *uuid.UUID if you have it
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	Priority    string     `json:"priority"` // 'low'|'medium'|'high'
	Status      string     `json:"status"`   // 'active'|'completed'|'archived'
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
	SortOrder   int        `json:"sort_order"`
}

type App struct {
	ctx  context.Context
	pool *pgxpool.Pool
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	pool, err := SetupDB(ctx)
	if err != nil {
		runtime.LogFatalf(ctx, "DB setup failed: %v", err)
	}
	a.pool = pool
}

/* ------------ API exposed to JS ------------ */

// List with basic filters/sort
func (a *App) ListTasks(status, sort string) ([]Task, error) {
	q := `
  SELECT id, NULL::text AS user_id, title, description, due_at, priority, status,
         created_at, updated_at, completed_at, deleted_at, sort_order
    FROM tasks
   WHERE deleted_at IS NULL
     AND (
           CASE WHEN $1::text = 'all'
                THEN TRUE
                ELSE status::text = $1::text
           END
         )
`

	switch sort {
	case "due":
		q += " ORDER BY due_at NULLS LAST, created_at DESC"
	case "priority":
		q += " ORDER BY priority DESC, created_at DESC"
	default:
		q += " ORDER BY created_at DESC"
	}

	rows, err := a.pool.Query(a.ctx, q, status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Task
	for rows.Next() {
		var t Task
		if err := rows.Scan(&t.ID, &t.UserID, &t.Title, &t.Description, &t.DueAt, &t.Priority, &t.Status,
			&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt, &t.DeletedAt, &t.SortOrder); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

type CreateTaskInput struct {
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	Priority    string     `json:"priority"` // low|medium|high
}

func (a *App) CreateTask(in CreateTaskInput) ([]Task, error) {
	if in.Title == "" {
		return a.ListTasks("all", "created")
	}
	if in.Priority == "" {
		in.Priority = "medium"
	}
	_, err := a.pool.Exec(a.ctx,
		`INSERT INTO tasks(title, description, due_at, priority, status)
		 VALUES ($1,$2,$3,$4,'active')`,
		in.Title, in.Description, in.DueAt, in.Priority)
	if err != nil {
		return nil, err
	}
	todos, err := a.ListTasks("all", "created")
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", todos)
	}
	return todos, err
}

func (a *App) RemoveTaskByID(id int64) ([]Task, error) { // soft delete
	_, err := a.pool.Exec(a.ctx,
		`UPDATE tasks SET deleted_at = now(), status='archived' WHERE id = $1`, id)
	if err != nil {
		return nil, err
	}
	todos, err := a.ListTasks("all", "created")
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", todos)
	}
	return todos, err
}

func (a *App) ToggleComplete(id int64, done bool) ([]Task, error) {
	if done {
		_, _ = a.pool.Exec(a.ctx, `UPDATE tasks SET status='completed', completed_at=now() WHERE id=$1`, id)
	} else {
		_, _ = a.pool.Exec(a.ctx, `UPDATE tasks SET status='active', completed_at=NULL WHERE id=$1`, id)
	}
	todos, err := a.ListTasks("all", "created")
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", todos)
	}
	return todos, err
}
