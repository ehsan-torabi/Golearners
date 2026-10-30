// Command migrate applies SQL migrations (golang-migrate). Bundled as a Go
// command so no external CLI is required: `go run ./cmd/migrate up|down [n]|version`.
// Reads DATABASE_URL and MIGRATIONS_DIR (default "migrations").
package main

import (
	"database/sql"
	"errors"
	"fmt"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	pgxv5 "github.com/golang-migrate/migrate/v4/database/pgx/v5"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "migrate:", err)
		os.Exit(1)
	}
}

func run() error {
	args := os.Args[1:]
	if len(args) == 0 {
		return errors.New("usage: migrate up | down [n] | version")
	}

	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		return errors.New("DATABASE_URL is required")
	}
	dir := os.Getenv("MIGRATIONS_DIR")
	if dir == "" {
		dir = "migrations"
	}

	sqlDB, err := sql.Open("pgx", dbURL)
	if err != nil {
		return fmt.Errorf("open database: %w", err)
	}
	defer sqlDB.Close()

	driver, err := pgxv5.WithInstance(sqlDB, &pgxv5.Config{})
	if err != nil {
		return fmt.Errorf("build migrate driver: %w", err)
	}
	m, err := migrate.NewWithDatabaseInstance("file://"+dir, "postgres", driver)
	if err != nil {
		return fmt.Errorf("init migrate: %w", err)
	}

	switch args[0] {
	case "up":
		if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return err
		}
		fmt.Println("migrations up to date")
	case "down":
		steps := 1
		if len(args) > 1 {
			steps, err = strconv.Atoi(args[1])
			if err != nil || steps < 1 {
				return fmt.Errorf("invalid step count %q", args[1])
			}
		}
		if err := m.Steps(-steps); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			return err
		}
		fmt.Printf("rolled back %d step(s)\n", steps)
	case "version":
		v, dirty, err := m.Version()
		if errors.Is(err, migrate.ErrNilVersion) {
			fmt.Println("no migrations applied")
			return nil
		}
		if err != nil {
			return err
		}
		fmt.Printf("version %d (dirty=%v)\n", v, dirty)
	default:
		return fmt.Errorf("unknown command %q (want up|down|version)", args[0])
	}
	return nil
}
