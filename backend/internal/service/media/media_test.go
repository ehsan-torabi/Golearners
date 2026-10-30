// Media service validation tests (mime allowlist, size caps, key pattern).
package media_test

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports/fakes"
	"golearn/backend/internal/service/media"
)

func newService(storage *fakes.Storage) (*media.Service, *fakes.Queue, *fakes.MediaRepo, *fakes.AuditSink) {
	q := &fakes.Queue{}
	m := fakes.NewMediaRepo()
	a := &fakes.AuditSink{}
	svc := media.NewService(media.Deps{
		Storage: storage, Queue: q, Media: m, Audit: a, TX: fakes.Transactor{},
	})
	return svc, q, m, a
}

func TestPresignRejectsDisallowedMime(t *testing.T) {
	svc, _, _, _ := newService(fakes.NewStorage())
	_, err := svc.PresignUpload(context.Background(), media.Actor{ID: uuid.Must(uuid.NewV7())},
		"application/x-msdownload", 100)
	require.ErrorIs(t, err, apperr.ErrValidation)
}

func TestPresignRejectsOversize(t *testing.T) {
	svc, _, _, _ := newService(fakes.NewStorage())
	_, err := svc.PresignUpload(context.Background(), media.Actor{ID: uuid.Must(uuid.NewV7())},
		"video/mp4", media.MaxVideoBytes+1)
	require.ErrorIs(t, err, apperr.ErrValidation)

	ticket, err := svc.PresignUpload(context.Background(), media.Actor{ID: uuid.Must(uuid.NewV7())},
		"video/mp4", 1<<20)
	require.NoError(t, err)
	require.NotEmpty(t, ticket.UploadURL)
	require.Contains(t, ticket.StorageKey, "media/video/")
}

func TestRegisterValidatesKeyAndObject(t *testing.T) {
	storage := fakes.NewStorage()
	svc, q, repo, audit := newService(storage)
	actor := media.Actor{ID: uuid.Must(uuid.NewV7())}
	ctx := context.Background()

	// object absent from storage
	_, err := svc.Register(ctx, actor, media.RegisterInput{
		StorageKey: "media/video/2026/01/x/master.mp4", Mime: "video/mp4", SizeBytes: 10,
	})
	require.Error(t, err)

	// object exists but key mismatches mime extension
	storage.Put("media/image/2026/01/x/master.mp4", 100)
	_, err = svc.Register(ctx, actor, media.RegisterInput{
		StorageKey: "media/image/2026/01/x/master.mp4", Mime: "video/mp4", SizeBytes: 10,
	})
	require.Error(t, err)

	// happy path: object + matching key
	storage.Put("media/video/2026/01/x/master.mp4", 1<<20)
	m, err := svc.Register(ctx, actor, media.RegisterInput{
		StorageKey: "media/video/2026/01/x/master.mp4", Mime: "video/mp4",
	})
	require.NoError(t, err)
	require.Equal(t, course.MediaUploaded, m.Status)
	require.Len(t, q.Ingests, 1, "ingest enqueued")
	require.Equal(t, 1, audit.Entries, "registration audited")
	stored, err := repo.ByID(ctx, m.ID)
	require.NoError(t, err)
	require.Equal(t, int64(1<<20), stored.SizeBytes, "size from storage, not browser")
}
