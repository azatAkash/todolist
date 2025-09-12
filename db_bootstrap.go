package main

import (
	"context"
	"database/sql"
	"embed"
	"errors"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib" // database/sql driver
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// вшиваем все .sql из папки migrations
//go:embed migrations/*.sql
var migFS embed.FS

// SetupDB: грузим .env, ждём готовности контейнера, применяем миграцию, отдаём пул.
func SetupDB(ctx context.Context) (*pgxpool.Pool, error) {
	_ = godotenv.Load()
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return nil, errors.New("DATABASE_URL is empty")
	}

	// небольшой ретрай на случай, если контейнер ещё стартует
	deadline := time.Now().Add(20 * time.Second)
	for {
		if err := applyMigration(dsn); err == nil {
			break
		} else {
			if time.Now().After(deadline) {
				return nil, err
			}
			time.Sleep(1 * time.Second)
		}
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return nil, err
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	runtime.LogInfo(ctx, "DB ready")
	return pool, nil
}

func applyMigration(dsn string) error {
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return err
	}
	defer db.Close()

	// выполняем один файл migrations/init.sql
	b, err := migFS.ReadFile("migrations/init.sql")
	if err != nil {
		return err
	}
	_, err = db.Exec(string(b))
	return err
}
