package courseadmin

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// InstructorInput is the editable about-the-teacher profile. Socials keys are
// a fixed set (github, linkedin, website, email) so the UI stays simple.
type InstructorInput struct {
	Headline      string
	BioHTML       string
	AvatarMediaID *uuid.UUID
	Socials       map[string]string
}

var socialKeys = map[string]bool{
	"github": true, "linkedin": true, "website": true, "email": true,
}

// Instructor returns the primary profile; a missing row is an empty profile,
// not an error, so the console can fill it the first time.
func (s *Service) Instructor(ctx context.Context) (*course.Instructor, error) {
	i, err := s.d.Instructors.Primary(ctx)
	if errors.Is(err, ports.ErrNotFound) {
		return &course.Instructor{Socials: map[string]string{}}, nil
	}
	if err != nil {
		return nil, err
	}
	return i, nil
}

// UpdateInstructor upserts the profile. The row's PK is a users.id, so a first
// save anchors it to the acting admin (the de-facto site owner in v1).
func (s *Service) UpdateInstructor(ctx context.Context, actor Actor, in InstructorInput) error {
	if len(in.Headline) > 200 {
		return apperr.ErrValidation
	}
	socials := map[string]string{}
	for k, v := range in.Socials {
		if !socialKeys[k] || len(v) > 300 {
			return apperr.ErrValidation
		}
		if v != "" {
			socials[k] = v
		}
	}
	current, err := s.d.Instructors.Primary(ctx)
	if err != nil && !errors.Is(err, ports.ErrNotFound) {
		return err
	}
	userID := actor.ID
	if current != nil {
		userID = current.UserID
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		i := &course.Instructor{
			UserID: userID, Headline: in.Headline, BioHTML: s.d.Sanitize(in.BioHTML),
			AvatarMediaID: in.AvatarMediaID, Socials: socials,
		}
		if err := s.d.Instructors.Upsert(ctx, i); err != nil {
			return err
		}
		return s.audit(ctx, actor, "instructor.update", "instructor", userID.String(), nil, in)
	})
}
