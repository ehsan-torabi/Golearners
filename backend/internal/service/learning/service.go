// Package learning implements the learner-panel use-cases: my courses with
// progress, course curriculum with access flags, and progress upserts.
package learning

import (
	"context"
	"errors"
	"sort"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

type Deps struct {
	Entitlements ports.EntitlementRepo
	Progress     ports.LearningRepo
	Courses      ports.CourseRepo
	Sections     ports.SectionRepo
	Lessons      ports.LessonRepo
}

type Service struct{ d Deps }

func NewService(d Deps) *Service { return &Service{d: d} }

// MyCourse summarizes one entitled course for the dashboard grid.
type MyCourse struct {
	Course       *course.Course
	GrantedAt    time.Time
	ProgressPct  int
	ResumeLesson *uuid.UUID // first uncompleted lesson
}

// MyCourses lists the learner's entitled courses with progress.
func (s *Service) MyCourses(ctx context.Context, userID uuid.UUID) ([]*MyCourse, error) {
	ents, err := s.d.Entitlements.ListForUser(ctx, userID)
	if err != nil {
		return nil, err
	}
	out := make([]*MyCourse, 0, len(ents))
	for _, e := range ents {
		c, err := s.d.Courses.ByID(ctx, e.CourseID)
		if err != nil {
			if errors.Is(err, ports.ErrNotFound) {
				continue // course deleted; entitlement lingers until cleanup
			}
			return nil, err
		}
		mc := &MyCourse{Course: c, GrantedAt: e.GrantedAt}
		if mc.ProgressPct, mc.ResumeLesson, err = s.progressFor(ctx, userID, c.ID); err != nil {
			return nil, err
		}
		out = append(out, mc)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].GrantedAt.After(out[j].GrantedAt) })
	return out, nil
}

// progressFor computes completion % and the resume point.
func (s *Service) progressFor(ctx context.Context, userID, courseID uuid.UUID) (int, *uuid.UUID, error) {
	lessons, err := s.d.Lessons.ListByCourse(ctx, courseID)
	if err != nil {
		return 0, nil, err
	}
	if len(lessons) == 0 {
		return 0, nil, nil
	}
	rows, err := s.d.Progress.ForUserInCourse(ctx, userID, courseID)
	if err != nil {
		return 0, nil, err
	}
	completed := map[uuid.UUID]bool{}
	resume := map[uuid.UUID]bool{}
	for _, r := range rows {
		if r.CompletedAt != nil {
			completed[r.LessonID] = true
		}
		resume[r.LessonID] = true
	}
	done := 0
	var firstOpen *uuid.UUID
	for _, l := range lessons {
		if completed[l.ID] {
			done++
			continue
		}
		if firstOpen == nil && (l.Status == course.LessonPublished || l.Status == course.LessonReady) {
			first := l.ID
			firstOpen = &first
		}
	}
	pct := done * 100 / len(lessons)
	if firstOpen == nil {
		for _, l := range lessons {
			first := l.ID
			firstOpen = &first
			break
		}
	}
	return pct, firstOpen, nil
}

// CurriculumLesson is one lesson row of the panel curriculum.
type CurriculumLesson struct {
	Lesson          *course.Lesson
	Accessible      bool
	PositionSeconds int
	Completed       bool
}

// Curriculum returns sections + lessons with access flags and progress.
func (s *Service) Curriculum(ctx context.Context, userID uuid.UUID, slug string) ([]*course.Section, []*CurriculumLesson, error) {
	c, err := s.d.Courses.BySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, nil, apperr.ErrNotFound
		}
		return nil, nil, err
	}
	owned, err := s.d.Entitlements.HasActive(ctx, userID, c.ID)
	if err != nil {
		return nil, nil, err
	}
	lessons, err := s.d.Lessons.ListByCourse(ctx, c.ID)
	if err != nil {
		return nil, nil, err
	}
	rows, err := s.d.Progress.ForUserInCourse(ctx, userID, c.ID)
	if err != nil {
		return nil, nil, err
	}
	pos := map[uuid.UUID]*ports.LessonProgress{}
	for _, r := range rows {
		pos[r.LessonID] = r
	}
	out := make([]*CurriculumLesson, 0, len(lessons))
	for _, l := range lessons {
		accessible := owned || l.IsPreview
		cl := &CurriculumLesson{Lesson: l, Accessible: accessible}
		if r := pos[l.ID]; r != nil {
			cl.PositionSeconds = r.PositionSeconds
			cl.Completed = r.CompletedAt != nil
		}
		out = append(out, cl)
	}
	sections, err := s.d.Sections.ListByCourse(ctx, c.ID)
	return sections, out, err
}

// ProgressInput for the upsert.
type ProgressInput struct {
	PositionSeconds int
	Completed       *bool
}

// SetProgress stores playback position/completion after an access check.
func (s *Service) SetProgress(ctx context.Context, userID, lessonID uuid.UUID, in ProgressInput) error {
	l, err := s.d.Lessons.ByID(ctx, lessonID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return apperr.ErrNotFound
		}
		return err
	}
	if !l.IsPreview {
		sec, err := s.d.Sections.ByID(ctx, l.SectionID)
		if err != nil {
			return err
		}
		owned, err := s.d.Entitlements.HasActive(ctx, userID, sec.CourseID)
		if err != nil {
			return err
		}
		if !owned {
			return apperr.ErrForbidden
		}
	}
	p := &ports.LessonProgress{
		UserID: userID, LessonID: lessonID, PositionSeconds: in.PositionSeconds,
	}
	if in.Completed != nil && *in.Completed {
		now := time.Now()
		p.CompletedAt = &now
	}
	return s.d.Progress.Upsert(ctx, p)
}

// ProgressOf returns one lesson's saved progress for the player resume.
func (s *Service) ProgressOf(ctx context.Context, userID, lessonID uuid.UUID) (*ports.LessonProgress, error) {
	rows, err := s.d.Progress.ForUserInCourse(ctx, userID, uuid.Nil)
	if err != nil {
		return nil, err
	}
	for _, r := range rows {
		if r.LessonID == lessonID {
			return r, nil
		}
	}
	return nil, nil
}
