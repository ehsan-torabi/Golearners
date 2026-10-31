// Admin curriculum use-cases: sections and lessons (sanitized on write).
package courseadmin

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// SectionInput for create/update.
type SectionInput struct {
	Title    string `json:"title"`
	Position int    `json:"position"`
}

func (s *Service) CreateSection(ctx context.Context, actor Actor, courseID uuid.UUID, in SectionInput) (*course.Section, error) {
	if len(in.Title) < 1 || len(in.Title) > 200 {
		return nil, apperr.ErrValidation
	}
	if _, err := s.d.Courses.ByID(ctx, courseID); err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	sec := &course.Section{
		ID: uuid.Must(uuid.NewV7()), CourseID: courseID,
		Title: in.Title, Position: in.Position,
	}
	if err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Sections.Create(ctx, sec); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.section.create", "course_section", sec.ID.String(), nil, sec)
	}); err != nil {
		return nil, err
	}
	return sec, nil
}

func (s *Service) UpdateSection(ctx context.Context, actor Actor, id uuid.UUID, in SectionInput) error {
	if len(in.Title) < 1 || len(in.Title) > 200 {
		return apperr.ErrValidation
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Sections.Update(ctx, &course.Section{ID: id, Title: in.Title, Position: in.Position}); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.section.update", "course_section", id.String(), nil, in)
	})
}

func (s *Service) DeleteSection(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Sections.Delete(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.section.delete", "course_section", id.String(), nil, nil)
	})
}

func (s *Service) ReorderSections(ctx context.Context, actor Actor, courseID uuid.UUID, ids []uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Sections.Reorder(ctx, courseID, ids); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.section.reorder", "course", courseID.String(), nil, ids)
	})
}

// LessonInput for create/update. SectionID is required on create; on update
// it is optional (omit to keep the lesson in its current section).
type LessonInput struct {
	SectionID       *uuid.UUID          `json:"section_id"`
	Title           string              `json:"title"`
	ContentHTML     string              `json:"content_html"`
	Position        int                 `json:"position"`
	IsPreview       bool                `json:"is_preview"`
	DurationSeconds int                 `json:"duration_seconds"`
	Status          course.LessonStatus `json:"status"`
	MediaID         *uuid.UUID          `json:"media_id"`
}

func (s *Service) CreateLesson(ctx context.Context, actor Actor, sectionID uuid.UUID, in LessonInput) (*course.Lesson, error) {
	if len(in.Title) < 1 || len(in.Title) > 200 {
		return nil, apperr.ErrValidation
	}
	if _, err := s.d.Sections.ByID(ctx, sectionID); err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	l := &course.Lesson{
		ID: uuid.Must(uuid.NewV7()), SectionID: sectionID,
		Title: in.Title, ContentHTML: s.d.Sanitize(in.ContentHTML),
		Position: in.Position, IsPreview: in.IsPreview,
		DurationSeconds: in.DurationSeconds, Status: in.Status, MediaID: in.MediaID,
	}
	if err := s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Lessons.Create(ctx, l); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.lesson.create", "lesson", l.ID.String(), nil, l)
	}); err != nil {
		return nil, err
	}
	return l, nil
}

func (s *Service) UpdateLesson(ctx context.Context, actor Actor, id uuid.UUID, in LessonInput) error {
	if len(in.Title) < 1 || len(in.Title) > 200 {
		return apperr.ErrValidation
	}
	existing, err := s.d.Lessons.ByID(ctx, id)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return apperr.ErrNotFound
		}
		return err
	}
	sectionID := existing.SectionID
	if in.SectionID != nil {
		sectionID = *in.SectionID
	}
	l := &course.Lesson{
		ID: id, SectionID: sectionID, Title: in.Title, ContentHTML: s.d.Sanitize(in.ContentHTML),
		Position: in.Position, IsPreview: in.IsPreview,
		DurationSeconds: in.DurationSeconds, Status: in.Status, MediaID: in.MediaID,
	}
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Lessons.Update(ctx, l); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.lesson.update", "lesson", id.String(), nil, l)
	})
}

func (s *Service) DeleteLesson(ctx context.Context, actor Actor, id uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Lessons.Delete(ctx, id); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.lesson.delete", "lesson", id.String(), nil, nil)
	})
}

func (s *Service) ReorderLessons(ctx context.Context, actor Actor, sectionID uuid.UUID, ids []uuid.UUID) error {
	return s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Lessons.Reorder(ctx, sectionID, ids); err != nil {
			return err
		}
		return s.audit(ctx, actor, "course.lesson.reorder", "course_section", sectionID.String(), nil, ids)
	})
}
