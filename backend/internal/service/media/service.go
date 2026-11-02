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
	"unicode"

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
func (s *Service) PresignUpload(ctx context.Context, actor Actor, mime string, sizeBytes int64, filename string) (*UploadTicket, error) {
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
	key := storageKey(kind, mime, filename)
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

// storageKey generates the server-side unique path. The object keeps the
// uploader's original (sanitized) name so the library stays readable; the UUID
// directory guarantees uniqueness — no user-controlled path structure.
func storageKey(kind course.MediaKind, mime, filename string) string {
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
	name := sanitizeName(filename) + "." + extOf(mime)
	return path.Join("media", dir, now.Format("2006"), now.Format("01"),
		uuid.Must(uuid.NewV7()).String(), name)
}

// nameMaxRunes caps the name portion so keys stay manageable.
const nameMaxRunes = 80

// displayName keeps the original filename for display: directory components
// and control runes stripped, capped. Rendered text escapes it in the UI.
func displayName(filename string) string {
	base := filename
	if i := strings.LastIndexAny(base, `/\`); i >= 0 {
		base = base[i+1:]
	}
	base = strings.Map(func(r rune) rune {
		if r < 0x20 || r == 0x7f {
			return -1
		}
		return r
	}, strings.TrimSpace(base))
	const displayMax = 200
	runes := []rune(base)
	if len(runes) > displayMax {
		base = string(runes[:displayMax])
	}
	return base
}

// sanitizeName keeps the readable part of the original filename: unicode
// letters and digits (Persian included), everything else folded to '-'.
// Empty or fully-unsafe names fall back to "file".
func sanitizeName(filename string) string {
	base := filename
	if i := strings.LastIndexAny(base, `/\`); i >= 0 {
		base = base[i+1:]
	}
	if i := strings.LastIndexByte(base, '.'); i > 0 {
		base = base[:i] // the extension comes from the mime allowlist, not the name
	}
	base = strings.TrimSpace(base)
	if base == "" {
		return "file"
	}
	var b strings.Builder
	lastDash := false
	for _, r := range base {
		switch {
		case unicode.IsLetter(r) || unicode.IsDigit(r):
			b.WriteRune(r)
			lastDash = false
		default:
			if !lastDash && b.Len() > 0 {
				b.WriteByte('-')
				lastDash = true
			}
		}
		if b.Len() >= nameMaxRunes {
			break
		}
	}
	out := strings.Trim(b.String(), "-")
	if out == "" {
		return "file"
	}
	return out
}

var _ = strings.TrimSpace
var _ = errors.Is
