// Package local is the offline VideoPlatform adapter: no transcoding — the
// stored master plays via short-lived presigned GET. The security model
// (private storage + entitlement check + expiring URLs) matches the
// production provider path; only the rendition format differs (docs/06 note).
package local

import (
	"context"
	"fmt"
	"time"

	"golearn/backend/internal/ports"
)

// VideoPlatform implements ports.VideoPlatform against the private bucket.
type VideoPlatform struct {
	storage ports.Storage
	ttl     time.Duration
}

func New(storage ports.Storage, ttl time.Duration) *VideoPlatform {
	return &VideoPlatform{storage: storage, ttl: ttl}
}

func (v *VideoPlatform) Name() string { return "local" }

// Ingest verifies the object exists and adopts its key as the remote ID.
func (v *VideoPlatform) Ingest(ctx context.Context, key string) (string, error) {
	if _, err := v.storage.Stat(ctx, key); err != nil {
		return "", fmt.Errorf("ingest: %w", err)
	}
	return key, nil
}

func (v *VideoPlatform) Status(_ context.Context, _ string) (ports.VideoStatus, error) {
	return ports.VideoReady, nil
}

// Playback issues a presigned GET for the stored master.
func (v *VideoPlatform) Playback(ctx context.Context, remoteID string, opts ports.PlaybackOptions) (string, time.Time, error) {
	ttl := v.ttl
	if opts.TTL > 0 {
		ttl = opts.TTL
	}
	exp := time.Now().Add(ttl)
	url, _, err := v.storage.PresignGet(ctx, remoteID, ttl)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("playback presign: %w", err)
	}
	return url, exp, nil
}

func (v *VideoPlatform) Delete(ctx context.Context, remoteID string) error {
	return v.storage.Delete(ctx, remoteID)
}
