// Package media implements admin media management: presigned direct uploads,
// registration, the ingest hand-off, and the admin grid.
package media

import (
	"context"
	"errors"
	"fmt"
	"path"
	"strings"
	"time"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// Upload limits (docs/06 §2).
const (
	MaxVideoBytes = 2 << 30 // 2 GiB
	MaxImageBytes = 10 << 20
	MaxPDFBytes   = 50 << 20
	PresignTTL    = 10 * time.Minute
)

// MIME allowlist → canonical kind + extension.
var mimeAllowlist = map[string]struct {
	Kind course.MediaKind
	Ext  string
}{
	"video/mp4":       {course.MediaVideo, "mp4"},
	"video/quicktime": {course.MediaVideo, "mov"},
	"image/jpeg":      {course.MediaImage, "jpg"},
	"image/png":       {course.MediaImage, "png"},
	"image/webp":      {course.MediaImage, "webp"},
	"application/pdf": {course.MediaPDF, "pdf"},
}

type Deps struct {
	Storage ports.Storage
	Queue   ports.JobQueue
	Media   ports.MediaRepo
	Audit   ports.AuditRepo
	TX      ports.Transactor
}

type Service struct{ d Deps }

func NewService(d Deps) *Service { return &Service{d: d} }

// Actor for audit rows.
type Actor struct {
	ID        uuid.UUID
	IP        string
	UserAgent string
}

// PresignUpload validates the upload request and returns a single-object
// presigned PUT plus the storage key the browser must upload to.
func (s *Service) PresignUpload(ctx context.Context, actor Actor, mime string, sizeBytes int64) (*UploadTicket, error) {
	kind, ok := kindOf(mime)
	if !ok {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("mime %q not allowed", mime))
	}
	max := int64(MaxImageBytes)
	switch kind {
	case course.MediaVideo:
		max = MaxVideoBytes
	case course.MediaPDF:
		max = MaxPDFBytes
	}
	if sizeBytes <= 0 || sizeBytes > max {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("size %d outside limit %d", sizeBytes, max))
	}
	key := storageKey(kind)
	url, err := s.d.Storage.PresignPut(ctx, key, mime, PresignTTL)
	if err != nil {
		return nil, err
	}
	return &UploadTicket{
		UploadURL: url, StorageKey: key, Kind: string(kind),
		ExpiresAt: time.Now().Add(PresignTTL),
	}, nil
}

// UploadTicket is the presign response.
type UploadTicket struct {
	UploadURL  string    `json:"upload_url"`
	StorageKey string    `json:"storage_key"`
	Kind       string    `json:"kind"`
	ExpiresAt  time.Time `json:"expires_at"`
}

func kindOf(mime string) (course.MediaKind, bool) {
	if m, ok := mimeAllowlist[mime]; ok {
		return m.Kind, true
	}
	return "", false
}

func extOf(mime string) string {
	return mimeAllowlist[mime].Ext
}

// storageKey generates the server-side UUID path (no user input in keys).
func storageKey(kind course.MediaKind) string {
	dir := "misc"
	switch kind {
	case course.MediaVideo:
		dir = "video"
	case course.MediaImage:
		dir = "image"
	case course.MediaPDF:
		dir = "pdf"
	}
	now := time.Now().UTC()
	name := "master." + extOf(mimeFromKind(kind))
	return path.Join("media", dir, now.Format("2006"), now.Format("01"), uuid.Must(uuid.NewV7()).String(), name)
}

// canonicalMime is the single mime per kind used for generated storage keys.
// It must be deterministic: the key extension and the register check have to
// agree, and a map lookup would pick a random allowlist entry per call.
var canonicalMime = map[course.MediaKind]string{
	course.MediaVideo: "video/mp4",
	course.MediaImage: "image/jpeg",
	course.MediaPDF:   "application/pdf",
}

func mimeFromKind(kind course.MediaKind) string {
	if mime, ok := canonicalMime[kind]; ok {
		return mime
	}
	return "application/octet-stream"
}

var _ = strings.TrimSpace
var _ = errors.Is
