package catalog

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/domain/identity"
	"golearn/backend/internal/ports/fakes"
)

func TestInstructorProfileResolvesName(t *testing.T) {
	users := fakes.NewUserRepo()
	uid := uuid.New()
	if err := users.Create(context.Background(), &identity.User{
		ID: uid, Mobile: "09120000000", FullName: "اهسان ربیع‌پور",
		Status: identity.StatusActive, CreatedAt: time.Now(),
	}); err != nil {
		t.Fatalf("create user: %v", err)
	}
	instructors := &fakes.InstructorRepo{}
	avatar := uuid.New()
	if err := instructors.Upsert(context.Background(), &course.Instructor{
		UserID: uid, Headline: "مدرس توسعه وب", AvatarMediaID: &avatar,
		Socials: map[string]string{"github": "github.com/golearn"},
	}); err != nil {
		t.Fatalf("upsert instructor: %v", err)
	}

	got, err := NewService(Deps{
		Courses: fakes.NewCatalogCourses(), Instructors: instructors, Users: users,
	}).InstructorProfile(context.Background())
	if err != nil {
		t.Fatalf("profile: %v", err)
	}
	if got.FullName != "اهسان ربیع‌پور" {
		t.Errorf("full_name = %q, want the anchored user's name", got.FullName)
	}
	if got.AvatarMediaID == nil || *got.AvatarMediaID != avatar {
		t.Errorf("avatar_media_id = %v, want %s", got.AvatarMediaID, avatar)
	}
	if got.Socials["github"] != "github.com/golearn" {
		t.Errorf("socials = %v, want the stored entry", got.Socials)
	}
}

func TestInstructorProfileMissingRow(t *testing.T) {
	_, err := NewService(Deps{
		Courses: fakes.NewCatalogCourses(), Instructors: &fakes.InstructorRepo{}, Users: fakes.NewUserRepo(),
	}).InstructorProfile(context.Background())
	if err == nil {
		t.Fatalf("missing profile must surface not-found, got %v", err)
	}
}
