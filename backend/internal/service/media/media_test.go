// Media service validation tests (mime allowlist, size caps, key pattern).
package media_test

import (
	"context"
	"strings"
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
		"application/x-msdownload", 100, "")
	require.ErrorIs(t, err, apperr.ErrValidation)
}

func TestPresignRejectsOversize(t *testing.T) {
	svc, _, _, _ := newService(fakes.NewStorage())
	_, err := svc.PresignUpload(context.Background(), media.Actor{ID: uuid.Must(uuid.NewV7())},
		"video/mp4", media.MaxVideoBytes+1, "")
	require.ErrorIs(t, err, apperr.ErrValidation)

	ticket, err := svc.PresignUpload(context.Background(), media.Actor{ID: uuid.Must(uuid.NewV7())},
		"video/mp4", 1<<20, "")
	require.NoError(t, err)
	require.NotEmpty(t, ticket.UploadURL)
	require.Contains(t, ticket.StorageKey, "media/video/")
}

func TestStorageKeyKeepsOriginalName(t *testing.T) {
	svc, _, _, _ := newService(fakes.NewStorage())
	ctx := context.Background()
	actor := media.Actor{ID: uuid.Must(uuid.NewV7())}

	ticket, err := svc.PresignUpload(ctx, actor, "image/png", 100,
		"Simon Stålenhag Wallpapers-THE LABYRINTH -2020- - l_garage01.png")
	require.NoError(t, err)
	// unique uuid dir + readable original name + real mime extension
	require.Regexp(t, `^media/image/\d{4}/\d{2}/[0-9a-f-]{36}/Simon-Stålenhag-Wallpapers-THE-LABYRINTH-2020-l-garage01\.png$`,
		ticket.StorageKey)

	// a second presign of the same file lands on a different unique key
	second, err := svc.PresignUpload(ctx, actor, "image/png", 100,
		"Simon Stålenhag Wallpapers-THE LABYRINTH -2020- - l_garage01.png")
	require.NoError(t, err)
	require.NotEqual(t, ticket.StorageKey, second.StorageKey)

	// empty/unsafe names fall back to "file"; extension follows the mime
	fallback, err := svc.PresignUpload(ctx, actor, "image/jpeg", 100, " . ")
	require.NoError(t, err)
	require.True(t, strings.HasSuffix(fallback.StorageKey, "/file.jpg"), fallback.StorageKey)

	// path traversal components never reach the key
	traversal, err := svc.PresignUpload(ctx, actor, "image/jpeg", 100, "../../etc/passwd.jpg")
	require.NoError(t, err)
	require.NotContains(t, traversal.StorageKey, "..")
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
	storage.Put("media/image/2026/01/x/photo.mp4", 100)
	_, err = svc.Register(ctx, actor, media.RegisterInput{
		StorageKey: "media/image/2026/01/x/photo.mp4", Mime: "video/mp4", SizeBytes: 10,
	})
	require.Error(t, err)

	// video: registered as uploaded, handed to the ingest worker
	storage.Put("media/video/2026/01/x/lesson.mp4", 1<<20)
	m, err := svc.Register(ctx, actor, media.RegisterInput{
		StorageKey: "media/video/2026/01/x/lesson.mp4", Mime: "video/mp4", Filename: "lesson.mp4",
	})
	require.NoError(t, err)
	require.Equal(t, course.MediaUploaded, m.Status)
	require.Len(t, q.Ingests, 1, "ingest enqueued")
	require.Equal(t, 1, audit.Entries, "registration audited")
	stored, err := repo.ByID(ctx, m.ID)
	require.NoError(t, err)
	require.Equal(t, int64(1<<20), stored.SizeBytes, "size from storage, not browser")
	require.Equal(t, "lesson.mp4", stored.Filename)
}

func TestRegisterImageIsReadyWithoutIngest(t *testing.T) {
	storage := fakes.NewStorage()
	svc, q, repo, _ := newService(storage)
	actor := media.Actor{ID: uuid.Must(uuid.NewV7())}
	ctx := context.Background()

	storage.Put("media/image/2026/11/cover.png", 4096)
	m, err := svc.Register(ctx, actor, media.RegisterInput{
		StorageKey: "media/image/2026/11/cover.png", Mime: "image/png", Filename: "cover.png",
	})
	require.NoError(t, err)
	require.Equal(t, course.MediaReady, m.Status, "images need no transcoding")
	require.Empty(t, q.Ingests, "no ingest for images")
	stored, err := repo.ByID(ctx, m.ID)
	require.NoError(t, err)
	require.Equal(t, "cover.png", stored.Filename)
}
