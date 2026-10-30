// Playback authz matrix (docs/06 section 5) + issuance audit, fully offline.
package playback_test

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/require"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports/fakes"
	"golearn/backend/internal/service/playback"
)

type env struct {
	svc      *playback.Service
	lessons  *fakes.LessonRepo
	sections *fakes.SectionRepo
	ents     *fakes.EntitlementRepo
	media    *fakes.MediaRepo
	sessions *fakes.PlaybackSessions
}

func newEnv() *env {
	lessons := fakes.NewLessonRepo()
	sections := fakes.NewSectionRepo()
	ents := fakes.NewEntitlementRepo()
	media := fakes.NewMediaRepo()
	sessions := &fakes.PlaybackSessions{}
	svc := playback.NewService(playback.Deps{
		Lessons: lessons, Sections: sections, Entitlements: ents,
		Media: media, Video: fakes.VideoPlatform{Name_: "local"},
		Sessions: sessions, Throttle: fakes.NewThrottler(),
		TTL: 5 * time.Minute,
	})
	return &env{svc: svc, lessons: lessons, sections: sections, ents: ents, media: media, sessions: sessions}
}

// seedLesson wires lesson -> section -> course plus a ready video asset.
func (e *env) seedLesson(t *testing.T, isPreview bool) (lessonID, userID, courseID uuid.UUID) {
	t.Helper()
	ctx := context.Background()
	sectionID := uuid.Must(uuid.NewV7())
	courseID = uuid.Must(uuid.NewV7())
	lessonID = uuid.Must(uuid.NewV7())
	e.sections.Link(sectionID, courseID)

	vid := &course.MediaAsset{
		ID: uuid.Must(uuid.NewV7()), Kind: course.MediaVideo,
		StorageKey: "media/video/x/master.mp4", Status: course.MediaReady,
	}
	require.NoError(t, e.media.Create(ctx, vid))
	remote := "media/video/x/master.mp4"
	vid.VODRemoteID = &remote
	e.media.Add(vid)

	l := &course.Lesson{
		ID: lessonID, SectionID: sectionID, Title: "l", Status: course.LessonReady,
		IsPreview: isPreview, MediaID: &vid.ID,
	}
	e.lessons.Add(l)
	return lessonID, uuid.Must(uuid.NewV7()), courseID
}

func TestPreviewPlaysForAnonymous(t *testing.T) {
	e := newEnv()
	lessonID, _, _ := e.seedLesson(t, true)
	_ = lessonID

	p, err := e.svc.ForLesson(context.Background(), nil, lessonID, "1.2.3.4")
	require.NoError(t, err)
	require.NotEmpty(t, p.URL)
	require.Equal(t, 1, e.sessions.Count(), "issuance audited")
}

func TestPaidLessonDeniesAnonymousAndNonEntitled(t *testing.T) {
	e := newEnv()
	lessonID, other, courseID := e.seedLesson(t, false)
	_ = courseID

	_, err := e.svc.ForLesson(context.Background(), nil, lessonID, "1.2.3.4")
	require.ErrorIs(t, err, apperr.ErrUnauthenticated)

	_, err = e.svc.ForLesson(context.Background(), &other, lessonID, "1.2.3.4")
	require.ErrorIs(t, err, apperr.ErrForbidden)
	require.Equal(t, 0, e.sessions.Count(), "denied requests never issue URLs")
}

func TestEntitledUserPlays(t *testing.T) {
	e := newEnv()
	lessonID, user, courseID := e.seedLesson(t, false)
	e.ents.Allow(user, courseID)

	p, err := e.svc.ForLesson(context.Background(), &user, lessonID, "1.2.3.4")
	require.NoError(t, err)
	require.NotEmpty(t, p.URL)
	require.WithinDuration(t, time.Now().Add(5*time.Minute), p.ExpiresAt, time.Minute)
}

func TestLessonWithoutReadyMediaRejected(t *testing.T) {
	e := newEnv()
	lessonID, user, courseID := e.seedLesson(t, false)
	e.ents.Allow(user, courseID)
	// strip the lesson's media
	l, _ := e.lessons.ByID(context.Background(), lessonID)
	l.MediaID = nil
	e.lessons.Add(l)

	_, err := e.svc.ForLesson(context.Background(), &user, lessonID, "1.2.3.4")
	require.Error(t, err)
}
