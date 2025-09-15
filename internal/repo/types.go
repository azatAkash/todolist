package repo

import "time"

type Task struct {
	ID          int64      `json:"id"`
	UserID      *string    `json:"user_id,omitempty"`
	Title       string     `json:"title"`
	Description *string    `json:"description,omitempty"`
	DueAt       *time.Time `json:"due_at,omitempty"`
	Priority    string     `json:"priority"` // "low"|"medium"|"high"
	Status      string     `json:"status"`   // "active"|"completed"|"archived"
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
	Priority    string     `json:"priority"` // "low"|"medium"|"high"
}

// Query params that are purely storage-level.
// No "all" value here: nil means "no status filter".
type ListParams struct {
	Status *string // nil => all statuses (except soft-deleted)
}
