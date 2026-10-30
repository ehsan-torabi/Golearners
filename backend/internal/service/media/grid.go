// Admin grid + deletion for media assets.
package media

import (
	"context"
	"errors"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// List is the admin grid.
func (s *Service) List(ctx context.Context, status string, page, perPage int) ([]*course.MediaAsset, int, error) {
	return s.d.Media.List(ctx, status, page, perPage)
}

// Delete removes the asset metadata + storage object (best effort) and audits.
func (s *Service) Delete(ctx context.Context, actor Actor, id uuid.UUID) error {
	m, err := s.d.Media.ByID(ctx, id)
	if err != nil {
		if errors.Is(err, ports.ErrNotFound) {
			return apperr.ErrNotFound
		}
		return err
	}
	err = s.d.TX.WithinTx(ctx, func(ctx context.Context) error {
		if err := s.d.Media.Delete(ctx, id); err != nil {
			return err
		}
		entry := &ports.AuditEntry{
			ID: uuid.Must(uuid.NewV7()), ActorID: &actor.ID,
			Action: "media.delete", EntityType: "media", EntityID: strPtr(id.String()),
			IP: actor.IP, UserAgent: actor.UserAgent,
		}
		return s.d.Audit.Insert(ctx, entry)
	})
	if err != nil {
		return err
	}
	// physical cleanup is best effort — metadata is already gone
	_ = s.d.Storage.Delete(ctx, m.StorageKey)
	return nil
}
