// Package worker runs background jobs (asynq): media ingest + status poll.
package worker

import (
	"github.com/google/uuid"
)

// Task type names.
const (
	TypeMediaIngest = "media:ingest"
	TypeMediaPoll   = "media:poll"
)

// IngestPayload travels in the task payload.
type IngestPayload struct {
	MediaID uuid.UUID `json:"media_id"`
}

// PollPayload for status polling.
type PollPayload struct {
	MediaID uuid.UUID `json:"media_id"`
	Attempt int       `json:"attempt"`
}
