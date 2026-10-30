// Package playback issues short-lived signed playback URLs after an
// entitlement check, auditing every issuance (docs/06 §3-5).
package playback

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// Issuance rate limits (docs/06 §3).
const (
	PerUserPerMinute = 30
	PerAnonPerMinute = 10
)

type Deps struct {
	Lessons      ports.LessonRepo
	Sections     ports.SectionRepo
	Entitlements ports.EntitlementRepo
	Media        ports.MediaRepo
	Video        ports.VideoPlatform
	Sessions     ports.PlaybackSessionRepo
	Throttle     ports.Throttler
	TTL          time.Duration
}

type Service struct{ d Deps }

func NewService(d Deps) *Service { return &Service{d: d} }

// Playback is the response payload.
type Playback struct {
	URL       string
	ExpiresAt time.Time
	LessonID  uuid.UUID
}

// ForLesson applies the access rules of docs/06 §5 and issues a signed URL:
// preview lessons play for anyone; paid lessons need an active entitlement.
func (s *Service) ForLesson(ctx context.Context, viewer *uuid.UUID, lessonID uuid.UUID, ip string) (*Playback, error) {
	l, err := s.d.Lessons.ByID(ctx, lessonID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	allowed := l.IsPreview
	if !allowed && viewer != nil {
		sec, err := s.d.Sections.ByID(ctx, l.SectionID)
		if err != nil {
			return nil, err
		}
		allowed, err = s.d.Entitlements.HasActive(ctx, *viewer, sec.CourseID)
		if err != nil {
			return nil, err
		}
	}
	if !allowed {
		if viewer == nil {
			return nil, apperr.ErrUnauthenticated
		}
		return nil, apperr.ErrForbidden
	}

	m, err := s.mediaOf(ctx, l)
	if err != nil {
		return nil, err
	}
	// per-user issuance limit (anonymous users are throttled per-IP at the router)
	if viewer != nil {
		ok, _, err := s.d.Throttle.Hit(ctx, "pbuser:"+viewer.String(), PerUserPerMinute, time.Minute)
		if err != nil {
			return nil, err
		}
		if !ok {
			return nil, apperr.ErrRateLimited
		}
	}
	url, exp, err := s.d.Video.Playback(ctx, deref(m.VODRemoteID), ports.PlaybackOptions{TTL: s.d.TTL, BindIP: ip})
	if err != nil {
		return nil, err
	}
	sess := &course.PlaybackSession{
		ID: uuid.Must(uuid.NewV7()), UserID: viewer, LessonID: l.ID,
		IssuedAt: time.Now(), ExpiresAt: exp, IP: ip,
	}
	if err := s.d.Sessions.Insert(ctx, sess); err != nil {
		return nil, err
	}
	return &Playback{URL: url, ExpiresAt: exp, LessonID: l.ID}, nil
}

// mediaOf validates the lesson has ready video media.
func (s *Service) mediaOf(ctx context.Context, l *course.Lesson) (*course.MediaAsset, error) {
	if l.MediaID == nil {
		return nil, errNoMedia
	}
	m, err := s.d.Media.ByID(ctx, *l.MediaID)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return nil, errNoMedia
		}
		return nil, err
	}
	if m.Kind != course.MediaVideo || m.Status != course.MediaReady {
		return nil, errNoMedia
	}
	return m, nil
}

// errNoMedia is a fixed error so callers cannot distinguish media state details.
var errNoMedia = errors.New("lesson has no ready video media")

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
