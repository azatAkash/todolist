package service

import (
	"context"
	"errors"
	"strings"
	"todolist/internal/repo"
)

type TaskService struct {
	r repo.TaskRepo
}

func NewTaskService(r repo.TaskRepo) *TaskService { return &TaskService{r: r} }

func norm(val, def string, allow ...string) string {
	v := strings.ToLower(strings.TrimSpace(val))
	if v == "" {
		return def
	}
	for _, a := range allow {
		if v == a {
			return v
		}
	}
	return def
}

func (s *TaskService) List(ctx context.Context, status, sort string) ([]repo.Task, error) {
	f := repo.TaskFilter{
		Status: norm(status, "all", "all", "active", "completed", "archived"),
		Sort:   norm(sort, "created", "created", "due", "priority"),
	}
	return s.r.List(ctx, f)
}

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
	return s.r.List(ctx, repo.TaskFilter{Status: "all", Sort: "created"})
}

func (s *TaskService) RemoveByID(ctx context.Context, id int64) ([]repo.Task, error) {
	if err := s.r.SoftDelete(ctx, id); err != nil {
		return nil, err
	}
	return s.r.List(ctx, repo.TaskFilter{Status: "all", Sort: "created"})
}

func (s *TaskService) ToggleComplete(ctx context.Context, id int64, done bool) ([]repo.Task, error) {
	if err := s.r.SetCompleted(ctx, id, done); err != nil {
		return nil, err
	}
	return s.r.List(ctx, repo.TaskFilter{Status: "all", Sort: "created"})
}
