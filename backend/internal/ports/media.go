// Media-delivery ports: private object storage, managed VOD, job queue,
// playback-session audit, and lesson attachments (docs/06).
package ports

import (
	"context"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/domain/course"
)

// Storage is the private S3-compatible object storage port.
type Storage interface {
	PresignPut(ctx context.Context, key, contentType string, ttl time.Duration) (url string, err error)
	PresignGet(ctx context.Context, key string, ttl time.Duration) (url string, mime string, err error)
	Stat(ctx context.Context, key string) (ObjectInfo, error)
	Delete(ctx context.Context, key string) error
}

// ObjectInfo is the metadata returned by Storage.Stat.
type ObjectInfo struct {
	SizeBytes int64
	ETag      string
}

// VideoStatus is the provider-side processing state.
type VideoStatus string

// Video statuses.
const (
	VideoProcessing VideoStatus = "processing"
	VideoReady      VideoStatus = "ready"
	VideoFailed     VideoStatus = "failed"
)

// PlaybackOptions bound a playback URL.
type PlaybackOptions struct {
	TTL    time.Duration
	BindIP string
}

// VideoPlatform is the managed-VOD port (docs/06 §1).
type VideoPlatform interface {
	Name() string
	Ingest(ctx context.Context, key string) (remoteID string, err error)
	Status(ctx context.Context, remoteID string) (VideoStatus, error)
	Playback(ctx context.Context, remoteID string, opts PlaybackOptions) (url string, expiresAt time.Time, err error)
	Delete(ctx context.Context, remoteID string) error
}

// JobQueue enqueues background work (asynq-backed).
type JobQueue interface {
	EnqueueIngest(ctx context.Context, mediaID uuid.UUID) error
	EnqueuePoll(ctx context.Context, mediaID uuid.UUID, attempt int, delay time.Duration) error
}

// PlaybackSessionRepo audits every playback URL issuance.
type PlaybackSessionRepo interface {
	Insert(ctx context.Context, s *course.PlaybackSession) error
}

// AttachmentRepo — downloadable lesson attachments.
type AttachmentRepo interface {
	ByID(ctx context.Context, id uuid.UUID) (*course.LessonAttachment, error)
	ListByLesson(ctx context.Context, lessonID uuid.UUID) ([]*course.LessonAttachment, error)
	Create(ctx context.Context, a *course.LessonAttachment) error
	Delete(ctx context.Context, id uuid.UUID) error
}
