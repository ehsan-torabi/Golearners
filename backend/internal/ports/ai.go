// AI assistant port types: the human-in-the-loop draft pipeline and usage
// metering (docs/04). Content kinds wait for an explicit admin approval
// before anything touches posts/courses; report kinds are read-only.
package ports

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

// AI draft kinds. Content kinds produce a diff and need approval; report
// kinds render immediately and never mutate anything.
const (
	AIKindBlogPost    = "blog_post"
	AIKindCourseCopy  = "course_copy"
	AIKindSEO         = "seo"
	AIKindStatsReport = "stats_report"
	AIKindFreeform    = "freeform"
)

// AI draft statuses. "pending" waits for a decision, "applied"/"rejected"
// are terminal outcomes, "ready" marks read-only reports, "failed" marks an
// approval that could not be applied.
const (
	AIStatusPending  = "pending"
	AIStatusApplied  = "applied"
	AIStatusRejected = "rejected"
	AIStatusReady    = "ready"
	AIStatusFailed   = "failed"
)

// AIDraft is one AI proposal (or report) with its before/after snapshots.
type AIDraft struct {
	ID               int64          `json:"id"`
	Kind             string         `json:"kind"`
	Action           string         `json:"action"` // create | update | none
	TargetType       string         `json:"target_type"`
	TargetID         *uuid.UUID     `json:"target_id,omitempty"`
	TargetLabel      string         `json:"target_label"`
	Status           string         `json:"status"`
	Summary          string         `json:"summary"`
	Notes            string         `json:"notes"`
	Instructions     string         `json:"instructions"`
	Original         json.RawMessage `json:"original,omitempty"` // nil for creates
	Proposed         json.RawMessage `json:"proposed"`
	Provider         string         `json:"provider"`
	Model            string         `json:"model"`
	PromptTokens     int            `json:"prompt_tokens"`
	CompletionTokens int            `json:"completion_tokens"`
	CreatedBy        *uuid.UUID     `json:"created_by,omitempty"`
	Error            string         `json:"error"`
	CreatedAt        time.Time      `json:"created_at"`
	DecidedAt        *time.Time     `json:"decided_at,omitempty"`
	AppliedAt        *time.Time     `json:"applied_at,omitempty"`
}

// AIDraftFilter narrows the admin worklist.
type AIDraftFilter struct {
	Status string
	Kind   string
}

// AIDraftRepo stores and decides drafts.
type AIDraftRepo interface {
	Create(ctx context.Context, d *AIDraft) error
	ByID(ctx context.Context, id int64) (*AIDraft, error)
	List(ctx context.Context, f AIDraftFilter, page, perPage int) ([]*AIDraft, int, error)
	// SetStatus moves a draft to one of the decided states and stamps
	// decided_at; errNote is stored for "failed".
	SetStatus(ctx context.Context, id int64, status string, errNote string) error
	MarkApplied(ctx context.Context, id int64) error
	Delete(ctx context.Context, id int64) error
}

// AIUsageSummary aggregates one window of provider calls.
type AIUsageSummary struct {
	Requests         int            `json:"requests"`
	OK               int            `json:"ok"`
	Failed           int            `json:"failed"`
	PromptTokens     int64          `json:"prompt_tokens"`
	CompletionTokens int64          `json:"completion_tokens"`
	ByKind           map[string]int `json:"by_kind"`
}

// AIUsageDay is one Tehran-day slice for charts.
type AIUsageDay struct {
	Day              string `json:"day"`
	Requests         int    `json:"requests"`
	PromptTokens     int64  `json:"prompt_tokens"`
	CompletionTokens int64  `json:"completion_tokens"`
}

// AIUsageRepo meters provider calls (cost accounting, no content).
type AIUsageRepo interface {
	Insert(ctx context.Context, kind, provider, model string, ok bool,
		promptTokens, completionTokens, durationMs int, errNote string) error
	Summary(ctx context.Context, days int) (*AIUsageSummary, error)
	Daily(ctx context.Context, days int) ([]AIUsageDay, error)
}
