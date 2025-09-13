package main

import (
	"context"
	"todolist/internal/repo"
	"todolist/internal/service"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx     context.Context
	pool    *pgxpool.Pool
	service *service.TaskService
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	pool, err := SetupDB(ctx)
	if err != nil {
		runtime.LogFatalf(ctx, "DB setup failed: %v", err)
	}
	a.pool = pool

	r := repo.NewPgTaskRepo(pool)
	a.service = service.NewTaskService(r)
}

/* --------- Методы для JS (имена как у вас на фронте) --------- */

func (a *App) ListTasks(status, sort string) ([]repo.Task, error) {
	return a.service.List(a.ctx, status, sort)
}

func (a *App) CreateTask(in repo.CreateTaskInput) ([]repo.Task, error) {
	ts, err := a.service.Create(a.ctx, in)
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", ts)
	}
	return ts, err
}

func (a *App) RemoveTaskByID(id int64) ([]repo.Task, error) {
	ts, err := a.service.RemoveByID(a.ctx, id)
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", ts)
	}
	return ts, err
}

func (a *App) ToggleComplete(id int64, done bool) ([]repo.Task, error) {
	ts, err := a.service.ToggleComplete(a.ctx, id, done)
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", ts)
	}
	return ts, err
}
