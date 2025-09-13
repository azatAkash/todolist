package repo

import (
	"context"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Task struct {
	ID          int64      `json:"id"`
	UserID      *string    `json:"user_id,omitempty"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	Priority    string     `json:"priority"` // low|medium|high
	Status      string     `json:"status"`   // active|completed|archived
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	DeletedAt   *time.Time `json:"deleted_at,omitempty"`
	SortOrder   int        `json:"sort_order"`
}

type CreateTaskInput struct {
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	Priority    string     `json:"priority"`
}

type TaskFilter struct {
	Status string // all|active|completed|archived
	Sort   string // created|due|priority
}

type TaskRepo interface {
	List(ctx context.Context, f TaskFilter) ([]Task, error)
	Insert(ctx context.Context, in CreateTaskInput) error
	SoftDelete(ctx context.Context, id int64) error
	SetCompleted(ctx context.Context, id int64, done bool) error
}

type PgTaskRepo struct{ pool *pgxpool.Pool }

func NewPgTaskRepo(pool *pgxpool.Pool) *PgTaskRepo { return &PgTaskRepo{pool: pool} }

func (r *PgTaskRepo) List(ctx context.Context, f TaskFilter) ([]Task, error) {
	q := `
	  SELECT id, NULL::text AS user_id, title, description, due_at, priority, status,
	         created_at, updated_at, completed_at, deleted_at, sort_order
	    FROM tasks
	   WHERE deleted_at IS NULL
	     AND (CASE WHEN $1::text = 'all' THEN TRUE ELSE status::text = $1::text END)
	`
	switch strings.ToLower(f.Sort) {
	case "due":
		q += " ORDER BY due_at NULLS LAST, created_at DESC"
	case "priority":
		q += " ORDER BY priority DESC, created_at DESC"
	default:
		q += " ORDER BY created_at DESC"
	}

	rows, err := r.pool.Query(ctx, q, f.Status)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []Task
	for rows.Next() {
		var t Task
		if err := rows.Scan(
			&t.ID, &t.UserID, &t.Title, &t.Description, &t.DueAt, &t.Priority, &t.Status,
			&t.CreatedAt, &t.UpdatedAt, &t.CompletedAt, &t.DeletedAt, &t.SortOrder,
		); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r *PgTaskRepo) Insert(ctx context.Context, in CreateTaskInput) error {
	if in.Priority == "" {
		in.Priority = "medium"
	}
	_, err := r.pool.Exec(ctx, `
		INSERT INTO tasks(title, description, due_at, priority, status)
		VALUES ($1,$2,$3,$4,'active')
	`, in.Title, in.Description, in.DueAt, in.Priority)
	return err
}

func (r *PgTaskRepo) SoftDelete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `UPDATE tasks SET deleted_at = now(), status='archived' WHERE id=$1`, id)
	return err
}

func (r *PgTaskRepo) SetCompleted(ctx context.Context, id int64, done bool) error {
	if done {
		_, err := r.pool.Exec(ctx, `UPDATE tasks SET status='completed', completed_at=now() WHERE id=$1`, id)
		return err
	}
	_, err := r.pool.Exec(ctx, `UPDATE tasks SET status='active', completed_at=NULL WHERE id=$1`, id)
	return err
}
