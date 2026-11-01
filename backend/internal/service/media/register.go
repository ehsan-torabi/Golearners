// Registration + grid + deletion for media assets.
package media

import (
	"context"
	"errors"
	"fmt"
	"path"
	"strings"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// RegisterInput arrives after the browser finished the presigned PUT.
type RegisterInput struct {
	StorageKey string
	Filename   string
	Mime       string
	SizeBytes  int64
	Checksum   string
}

// Register records the uploaded object and hands it to the ingest worker.
func (s *Service) Register(ctx context.Context, actor Actor, in RegisterInput) (*course.MediaAsset, error) {
	kind, ok := kindOf(in.Mime)
	if !ok {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("mime %q not allowed", mimeForError(in.Mime)))
	}
	dir := map[course.MediaKind]string{
		course.MediaVideo: "video", course.MediaImage: "image", course.MediaPDF: "pdf",
	}[kind]
	prefix := "media/" + dir + "/"
	// the storage key is generated from the kind (canonical mime), so the
	// extension check must use the same canonical mime, not the uploaded one
	// (a PNG upload lands on master.jpg by design).
	if !strings.HasPrefix(in.StorageKey, prefix) ||
		path.Ext(in.StorageKey) != "."+extOf(mimeFromKind(kind)) {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("storage key does not match issued pattern"))
	}
	// size re-check against the stored object (never trust the browser)
	info, err := s.d.Storage.Stat(ctx, in.StorageKey)
	if err != nil {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("uploaded object not found"))
	}
	max := int64(MaxImageBytes)
	switch kind {
	case course.MediaVideo:
		max = MaxVideoBytes
	case course.MediaPDF:
		max = MaxPDFBytes
	}
	if info.SizeBytes > max {
		return nil, apperr.ErrValidation.Wrap(fmt.Errorf("stored object %d exceeds limit", info.SizeBytes))
	}
	var checksum *string
	if in.Checksum != "" {
		checksum = &in.Checksum
	}
	m := &course.MediaAsset{
		ID: uuid.Must(uuid.NewV7()), Kind: kind, StorageKey: in.StorageKey,
		Mime: in.Mime, SizeBytes: info.SizeBytes, Checksum: checksum,
		Status: course.MediaUploaded, UploadedBy: &actor.ID,
	}
	err = s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Media.Create(ctx, m); err != nil {
			return err
		}
		entry := &ports.AuditEntry{
			ID: uuid.Must(uuid.NewV7()), ActorID: &actor.ID,
			Action: "media.register", EntityType: "media", EntityID: strPtr(m.ID.String()),
			IP: actor.IP, UserAgent: actor.UserAgent,
		}
		return s.d.Audit.Insert(ctx, entry)
	})
	if err != nil {
		return nil, err
	}
	if err := s.d.Queue.EnqueueIngest(ctx, m.ID); err != nil {
		// asset stays 'uploaded'; the reconcile can retry (phase 6 worker)
		return m, fmt.Errorf("enqueue ingest: %w", err)
	}
	return m, nil
}

func mimeForError(mime string) string { return mime }

func strPtr(s string) *string { return &s }

var _ = errors.Is
