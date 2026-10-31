// Command bootstrap creates or promotes the owner (first admin) account.
// Idempotent: safe to re-run. Usage:
//
//	go run ./cmd/bootstrap -mobile 09121234567 -password 'StrongPass123' -name 'استاد'
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/google/uuid"

	"golearn/backend/internal/adapter/passwordhasher"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/platform/config"
	"golearn/backend/internal/platform/postgres"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/repository"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, "bootstrap:", err)
		os.Exit(1)
	}
}

func run() error {
	var (
		mobile   = flag.String("mobile", "", "owner mobile 09xxxxxxxxx (required)")
		password = flag.String("password", "", "owner password (required, 8..72 chars)")
		name     = flag.String("name", "مدیر سایت", "owner display name")
	)
	flag.Parse()
	if *mobile == "" || *password == "" {
		return errors.New("-mobile and -password are required")
	}
	if err := identity.ValidateMobile(*mobile); err != nil {
		return err
	}
	if err := identity.ValidatePassword(*password); err != nil {
		return err
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	cfg, err := config.Load()
	if err != nil {
		return err
	}
	pool, err := postgres.New(ctx, cfg.DatabaseURL)
	if err != nil {
		return err
	}
	defer pool.Close()

	users := repository.NewUserRepo(pool)
	hasher := passwordhasher.New()

	user, err := users.ByMobile(ctx, *mobile)
	switch {
	case errors.Is(err, ports.ErrNotFound):
		hash, herr := hasher.Hash(*password)
		if herr != nil {
			return herr
		}
		user = &identity.User{
			ID:           uuid.Must(uuid.NewV7()),
			Mobile:       *mobile,
			FullName:     *name,
			PasswordHash: hash,
			Status:       identity.StatusActive,
		}
		if err := users.Create(ctx, user); err != nil {
			return err
		}
		fmt.Println("created owner user", user.ID)
	case err != nil:
		return err
	default:
		hash, herr := hasher.Hash(*password)
		if herr != nil {
			return herr
		}
		if err := users.UpdatePassword(ctx, user.ID, hash); err != nil {
			return err
		}
		fmt.Println("updated password for existing user", user.ID)
	}

	if err := users.AddRole(ctx, user.ID, identity.RoleOwner); err != nil {
		return err
	}
	if err := users.SetMobileVerified(ctx, user.ID); err != nil {
		return err
	}

	// the owner is also the (single) instructor: course creation requires the profile
	instructors := repository.NewInstructorRepo(pool)
	if err := instructors.Upsert(ctx, &course.Instructor{
		UserID: user.ID, Headline: "مدرس دوره‌های برنامه‌نویسی",
	}); err != nil {
		return err
	}
	fmt.Println("owner role granted; mobile marked verified; instructor profile ready")
	return nil
}
