// Package jobqueue implements ports.JobQueue with asynq.
package jobqueue

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/hibiken/asynq"

	"golearn/backend/internal/worker"
)

// Queue is the producer side used by the API and the worker itself.
type Queue struct{ client *asynq.Client }

func New(client *asynq.Client) *Queue { return &Queue{client: client} }

// EnqueueIngest schedules the media-ingest task.
func (q *Queue) EnqueueIngest(ctx context.Context, mediaID uuid.UUID) error {
	payload, err := json.Marshal(worker.IngestPayload{MediaID: mediaID})
	if err != nil {
		return fmt.Errorf("marshal ingest payload: %w", err)
	}
	_, err = q.client.EnqueueContext(ctx, asynq.NewTask(worker.TypeMediaIngest, payload),
		asynq.MaxRetry(5), asynq.Queue("media"))
	if err != nil {
		return fmt.Errorf("enqueue ingest: %w", err)
	}
	return nil
}

// EnqueuePoll schedules a status-poll task with delay.
func (q *Queue) EnqueuePoll(ctx context.Context, mediaID uuid.UUID, attempt int, delay time.Duration) error {
	payload, err := json.Marshal(worker.PollPayload{MediaID: mediaID, Attempt: attempt})
	if err != nil {
		return fmt.Errorf("marshal poll payload: %w", err)
	}
	_, err = q.client.EnqueueContext(ctx, asynq.NewTask(worker.TypeMediaPoll, payload),
		asynq.ProcessIn(delay), asynq.MaxRetry(3), asynq.Queue("media"))
	if err != nil {
		return fmt.Errorf("enqueue poll: %w", err)
	}
	return nil
}
