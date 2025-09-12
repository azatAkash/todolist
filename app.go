package main

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx  context.Context
	pool *pgxpool.Pool
}

func NewApp() *App { return &App{} }

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	pool, err := SetupDB(ctx) // you already have this
	if err != nil {
		runtime.LogFatalf(ctx, "DB setup failed: %v", err)
	}
	a.pool = pool
}

/* ---------- JS-exposed API (must be Exported) ---------- */

// ListTodos returns task titles in order
func (a *App) ListTodos() ([]string, error) {
	rows, err := a.pool.Query(a.ctx, `SELECT title FROM tasks ORDER BY id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []string
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			return nil, err
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// AddTodo inserts a task and emits an update event
func (a *App) AddTodo(title string) ([]string, error) {
	if title == "" {
		return a.ListTodos()
	}
	if _, err := a.pool.Exec(a.ctx, `INSERT INTO tasks(title) VALUES($1)`, title); err != nil {
		return nil, err
	}
	todos, err := a.ListTodos()
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", todos)
	}
	return todos, err
}

// RemoveTodo deletes by list index (offset) and emits an update
func (a *App) RemoveTodo(index int) ([]string, error) {
	_, err := a.pool.Exec(a.ctx, `
	  DELETE FROM tasks
	  WHERE id = (
	    SELECT id FROM tasks ORDER BY id OFFSET $1 LIMIT 1
	  )`, index)
	if err != nil {
		return nil, err
	}
	todos, err := a.ListTodos()
	if err == nil {
		runtime.EventsEmit(a.ctx, "todos:changed", todos)
	}
	return todos, err
}
