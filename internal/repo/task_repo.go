package repo

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
)

type TaskRepo interface {
	List(ctx context.Context, p ListParams) ([]Task, error)
	Insert(ctx context.Context, in CreateTaskInput) error
	SoftDelete(ctx context.Context, id int64) error
	SetCompleted(ctx context.Context, id int64, done bool) error
}

type PgTaskRepo struct{ pool *pgxpool.Pool }

func NewPgTaskRepo(pool *pgxpool.Pool) *PgTaskRepo { return &PgTaskRepo{pool: pool} }

func (r *PgTaskRepo) List(ctx context.Context, p ListParams) ([]Task, error) {
	q := `
	  SELECT id, NULL::text AS user_id, title, description, due_at, priority, status,
	         created_at, updated_at, completed_at, deleted_at, sort_order
	    FROM tasks
	   WHERE deleted_at IS NULL
	`
	args := []any{}
	if p.Status != nil {
		q += ` AND status = $1`
		args = append(args, *p.Status)
	}


	rows, err := r.pool.Query(ctx, q, args...)
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
	_, err := r.pool.Exec(ctx, `
		INSERT INTO tasks(title, description, due_at, priority, status)
		VALUES ($1,$2,$3,$4,'active')
	`, in.Title, in.Description, in.DueAt, in.Priority)
	return err
}

func (r *PgTaskRepo) SoftDelete(ctx context.Context, id int64) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE tasks SET deleted_at = now(), status = 'archived' WHERE id = $1
	`, id)
	return err
}

func (r *PgTaskRepo) SetCompleted(ctx context.Context, id int64, done bool) error {
	if done {
		_, err := r.pool.Exec(ctx, `
			UPDATE tasks SET status='completed', completed_at=now() WHERE id=$1
		`, id)
		return err
	}
	_, err := r.pool.Exec(ctx, `
		UPDATE tasks SET status='active', completed_at=NULL WHERE id=$1
	`, id)
	return err
}
