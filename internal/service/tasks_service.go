package service

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"todolist/internal/repo"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type TaskService struct{ r repo.TaskRepo }

func NewTaskService(r repo.TaskRepo) *TaskService { return &TaskService{r: r} }

// normalize a value against an allow-list; return default on empty/unknown
func norm(v, def string, allowed ...string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	if v == "" {
		return def
	}
	for _, a := range allowed {
		if v == a {
			return v
		}
	}
	return def
}

// List returns tasks filtered by status + dueRange, and sorted by key/dir.
// dueRange: "all" | "today" | "week" | "overdue"
func (s *TaskService) List(
	ctx context.Context,
	status, sortKey, sortDir, dueRange string,
) ([]repo.Task, error) {

	st := norm(status, "all", "all", "active", "completed", "archived")
	key := norm(sortKey, "created", "created", "priority")
	dir := norm(sortDir, "asc", "asc", "desc")
	dr := norm(dueRange, "all", "all", "today", "week", "overdue")

	// 1) Pull by status only (repo stays data-only)
	var p repo.ListParams
	if st != "all" {
		p.Status = &st
	}
	items, err := s.r.List(ctx, p)
	if err != nil {
		return nil, err
	}

	// 2) In-service filter by due date window
	items = filterByDue(items, dr, time.Now())

	// 3) Domain sorting
	s.sortTasks(items, key, dir)

	runtime.LogInfof(ctx, "List: status=%s sort=%s %s due=%s -> %d",
		st, key, strings.ToUpper(dir), dr, len(items))
	return items, nil
}

// filterByDue keeps tasks whose DueAt falls into the selected window.
// "today":   [today 00:00, tomorrow 00:00)
// "week":    [today 00:00, today+7d 00:00)
// "overdue": (-inf, today 00:00)
// "all":     no filtering
func filterByDue(src []repo.Task, dr string, now time.Time) []repo.Task {
	if dr == "all" {
		return src
	}
	loc := now.Location()
	y, m, d := now.Date()
	start := time.Date(y, m, d, 0, 0, 0, 0, loc) // start of today
	endToday := start.Add(24 * time.Hour)
	endWeek := start.Add(7 * 24 * time.Hour)

	out := make([]repo.Task, 0, len(src))
	for _, t := range src {
		if t.DueAt == nil {
			continue // tasks without due date are excluded from date windows
		}
		due := t.DueAt.In(loc)
		switch dr {
		case "today":
			if !due.Before(start) && due.Before(endToday) {
				out = append(out, t)
			}
		case "week":
			if !due.Before(start) && due.Before(endWeek) {
				out = append(out, t)
			}
		case "overdue":
			if due.Before(start) {
				out = append(out, t)
			}
		}
	}
	return out
}

// Create inserts a task, then returns the default list view.
func (s *TaskService) Create(ctx context.Context, in repo.CreateTaskInput) ([]repo.Task, error) {
	if strings.TrimSpace(in.Title) == "" {
		return nil, errors.New("title is required")
	}
	if in.Priority == "" {
		in.Priority = "medium"
	}
	if err := s.r.Insert(ctx, in); err != nil {
		return nil, err
	}
	// After mutations return the default listing (all/created/DESC, due=all)
	return s.List(ctx, "all", "created", "desc", "all")
}

// RemoveByID soft-deletes a task, then returns the default list view.
func (s *TaskService) RemoveByID(ctx context.Context, id int64) ([]repo.Task, error) {
	if err := s.r.SoftDelete(ctx, id); err != nil {
		return nil, err
	}
	return s.List(ctx, "all", "created", "desc", "all")
}

// ToggleComplete marks/unmarks completion, then returns the default list view.
func (s *TaskService) ToggleComplete(ctx context.Context, id int64, done bool) ([]repo.Task, error) {
	if err := s.r.SetCompleted(ctx, id, done); err != nil {
		return nil, err
	}
	return s.List(ctx, "all", "created", "desc", "all")
}

// sortTasks sorts in place using stable rules so equal keys preserve order.
func (s *TaskService) sortTasks(ts []repo.Task, key, dir string) {
	sort.SliceStable(ts, func(i, j int) bool {
		a, b := ts[i], ts[j]

		switch key {
		case "priority":
			rank := func(p string) int {
				switch strings.ToLower(p) {
				case "low":
					return 1
				case "medium":
					return 2
				case "high":
					return 3
				default:
					return 0
				}
			}
			pa, pb := rank(a.Priority), rank(b.Priority)
			if pa != pb {
				if dir == "asc" {
					return pa < pb
				}
				return pa > pb
			}
			// tie-breakers: created_at then id, same direction
			if !a.CreatedAt.Equal(b.CreatedAt) {
				if dir == "asc" {
					return a.CreatedAt.Before(b.CreatedAt)
				}
				return a.CreatedAt.After(b.CreatedAt)
			}
			if dir == "asc" {
				return a.ID < b.ID
			}
			return a.ID > b.ID

		default: // "created"
			if !a.CreatedAt.Equal(b.CreatedAt) {
				if dir == "asc" {
					return a.CreatedAt.Before(b.CreatedAt)
				}
				return a.CreatedAt.After(b.CreatedAt)
			}
			if dir == "asc" {
				return a.ID < b.ID
			}
			return a.ID > b.ID
		}
	})
}
