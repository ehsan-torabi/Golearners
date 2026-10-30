// asynq task handlers: ingest a registered master file into the VOD, then
// poll provider status until ready/failed.
package worker

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/hibiken/asynq"

	"golearn/backend/internal/domain/course"
	"golearn/backend/internal/ports"
)

// Deps for task handlers.
type Deps struct {
	Media          ports.MediaRepo
	Video          ports.VideoPlatform
	Queue          ports.JobQueue
	Log            *slog.Logger
	MaxPolls       int           // poll attempts before marking failed
	NextPollIn     time.Duration // delay between status polls
	ReconcileAfter time.Duration // stuck-payment threshold for reconciliation
}

// NewMux builds the asynq handler mux.
func NewMux(d Deps) *asynq.ServeMux {
	mux := asynq.NewServeMux()
	mux.HandleFunc(TypeMediaIngest, d.handleIngest)
	mux.HandleFunc(TypeMediaPoll, d.handlePoll)
	return mux
}

func (d *Deps) handleIngest(ctx context.Context, t *asynq.Task) error {
	var p IngestPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode ingest payload: %w", err)
	}
	m, err := d.Media.ByID(ctx, p.MediaID)
	if err != nil {
		// unknown media: log + drop (task cannot succeed on retry)
		d.Log.Error("ingest: media not found", "media_id", p.MediaID, "err", err)
		return nil
	}
	if m.Status != course.MediaUploaded {
		d.Log.Info("ingest: skip non-uploaded asset", "media_id", m.ID, "status", m.Status)
		return nil
	}
	remoteID, err := d.Video.Ingest(ctx, m.StorageKey)
	if err != nil {
		return fmt.Errorf("provider ingest: %w", err) // retryable
	}
	if err := d.Media.SetIngested(ctx, m.ID, d.Video.Name(), remoteID); err != nil {
		return err
	}
	if err := d.Queue.EnqueuePoll(ctx, m.ID, 1, d.NextPollIn); err != nil {
		return fmt.Errorf("enqueue poll: %w", err)
	}
	d.Log.Info("ingested", "media_id", m.ID, "provider", d.Video.Name(), "remote", remoteID)
	return nil
}

func (d *Deps) handlePoll(ctx context.Context, t *asynq.Task) error {
	var p PollPayload
	if err := json.Unmarshal(t.Payload(), &p); err != nil {
		return fmt.Errorf("decode poll payload: %w", err)
	}
	m, err := d.Media.ByID(ctx, p.MediaID)
	if err != nil {
		d.Log.Error("poll: media not found", "media_id", p.MediaID, "err", err)
		return nil
	}
	if m.Status != course.MediaProcessing {
		return nil // already terminal
	}
	st, err := d.Video.Status(ctx, ptrValue(m.VODRemoteID))
	if err != nil {
		return fmt.Errorf("provider status: %w", err) // retryable via asynq
	}
	switch st {
	case ports.VideoReady:
		return d.Media.SetStatus(ctx, m.ID, course.MediaReady, "")
	case ports.VideoFailed:
		return d.Media.SetStatus(ctx, m.ID, course.MediaFailed, "provider reported failure")
	default: // still processing — re-schedule
		if p.Attempt >= d.MaxPolls {
			return d.Media.SetStatus(ctx, m.ID, course.MediaFailed, "poll attempts exhausted")
		}
		if err := d.Queue.EnqueuePoll(ctx, m.ID, p.Attempt+1, d.NextPollIn); err != nil {
			return fmt.Errorf("re-enqueue poll: %w", err)
		}
	}
	return nil
}

func ptrValue(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
