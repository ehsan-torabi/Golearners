// Package course is the course-context domain: catalog, curriculum, reviews,
// and media assets (docs/03 §3). Pure domain — stdlib + uuid only.
package course

import (
	"time"

	"github.com/google/uuid"
)

// Level is a course difficulty.
type Level string

// Course levels.
const (
	LevelBeginner     Level = "beginner"
	LevelIntermediate Level = "intermediate"
	LevelAdvanced     Level = "advanced"
)

// Status is the course lifecycle status.
type Status string

// Course statuses.
const (
	StatusDraft     Status = "draft"
	StatusPublished Status = "published"
	StatusArchived  Status = "archived"
)

// LessonStatus is the lesson readiness status.
type LessonStatus string

// Lesson statuses.
const (
	LessonDraft     LessonStatus = "draft"
	LessonReady     LessonStatus = "ready"
	LessonPublished LessonStatus = "published"
)

// MediaKind classifies stored files.
type MediaKind string

// Media kinds.
const (
	MediaVideo MediaKind = "video"
	MediaImage MediaKind = "image"
	MediaPDF   MediaKind = "pdf"
)

// MediaStatus is the processing pipeline status.
type MediaStatus string

// Media statuses.
const (
	MediaUploaded   MediaStatus = "uploaded"
	MediaProcessing MediaStatus = "processing"
	MediaReady      MediaStatus = "ready"
	MediaFailed     MediaStatus = "failed"
)

// ReviewStatus is the moderation status of a course review.
type ReviewStatus string

// Review statuses.
const (
	ReviewPending  ReviewStatus = "pending"
	ReviewApproved ReviewStatus = "approved"
	ReviewRejected ReviewStatus = "rejected"
)

// EntitlementSource is how a user obtained course access.
type EntitlementSource string

// Entitlement sources.
const (
	EntitlementPurchase       EntitlementSource = "purchase"
	EntitlementGrant          EntitlementSource = "grant"
	EntitlementRefundReversed EntitlementSource = "refund_reversed"
)

// Course is the aggregate root of the catalog.
type Course struct {
	ID                 uuid.UUID
	Slug               string
	InstructorID       uuid.UUID
	Title              string
	Summary            string
	DescriptionHTML    string
	CoverMediaID       *uuid.UUID
	PromoVideoMediaID  *uuid.UUID
	Level              Level
	Status             Status
	PriceRial          int64
	CompareAtPriceRial *int64
	IsFeatured         bool
	PrerequisitesHTML  string
	Outcomes           []string
	PublishedAt        *time.Time
	MetaTitle          *string
	MetaDescription    *string
	OGImageMediaID     *uuid.UUID
	DeletedAt          *time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// Section groups lessons within a course.
type Section struct {
	ID       uuid.UUID `json:"id"`
	CourseID uuid.UUID `json:"course_id"`
	Title    string    `json:"title"`
	Position int       `json:"position"`
}

// Lesson is a single unit of the curriculum.
type Lesson struct {
	ID              uuid.UUID    `json:"id"`
	SectionID       uuid.UUID    `json:"section_id"`
	Title           string       `json:"title"`
	ContentHTML     string       `json:"content_html"`
	Position        int          `json:"position"`
	IsPreview       bool         `json:"is_preview"`
	DurationSeconds int          `json:"duration_seconds"`
	Status          LessonStatus `json:"status"`
	MediaID         *uuid.UUID   `json:"media_id"`
	CreatedAt       time.Time    `json:"created_at"`
	UpdatedAt       time.Time    `json:"updated_at"`
}

// Category is a course taxonomy term.
type Category struct {
	ID          uuid.UUID  `json:"id"`
	Slug        string     `json:"slug"`
	Title       string     `json:"title"`
	Icon        string     `json:"icon"`
	IconMediaID *uuid.UUID `json:"icon_media_id"`
	Position    int        `json:"position"`
}

// Review is a moderated learner rating.
type Review struct {
	ID         uuid.UUID    `json:"id"`
	CourseID   uuid.UUID    `json:"course_id"`
	UserID     uuid.UUID    `json:"user_id"`
	Rating     int          `json:"rating"`
	Body       string       `json:"body"`
	Status     ReviewStatus `json:"status"`
	ApprovedAt *time.Time   `json:"approved_at"`
	// Joined for display; empty until the repo query carries it.
	AuthorName  string     `json:"author_name"`
	CourseTitle string     `json:"course_title"`
	SubmittedAt *time.Time `json:"submitted_at"`
}

// MediaAsset is a stored file (video/image/pdf) with pipeline status.
type MediaAsset struct {
	ID           uuid.UUID
	Kind         MediaKind
	StorageKey   string
	Filename     string // original uploader-provided name, display only
	Mime         string
	SizeBytes    int64
	Checksum     *string
	Status       MediaStatus
	DurationSecs *int
	VODProvider  *string
	VODRemoteID  *string
	ErrorMessage *string
	UploadedBy   *uuid.UUID
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

// Entitlement grants a user access to a course (lifetime when ExpiresAt is nil).
type Entitlement struct {
	ID        uuid.UUID
	UserID    uuid.UUID
	CourseID  uuid.UUID
	Source    EntitlementSource
	GrantedAt time.Time
	ExpiresAt *time.Time
	OrderID   *uuid.UUID
	RevokedAt *time.Time
}

// Instructor is the public teacher profile (single row in v1).
type Instructor struct {
	UserID        uuid.UUID
	Headline      string
	BioHTML       string
	AvatarMediaID *uuid.UUID
	Socials       map[string]string
}

// PlaybackSession audits a playback-URL issuance.
type PlaybackSession struct {
	ID        uuid.UUID
	UserID    *uuid.UUID
	LessonID  uuid.UUID
	IssuedAt  time.Time
	ExpiresAt time.Time
	IP        string
}

// LessonAttachment is a downloadable file attached to a lesson.
type LessonAttachment struct {
	ID            uuid.UUID `json:"id"`
	LessonID      uuid.UUID `json:"lesson_id"`
	MediaID       uuid.UUID `json:"media_id"`
	Title         string    `json:"title"`
	AllowDownload bool      `json:"allow_download"`
}

// LessonProgress tracks watch position + completion per user/lesson.
type LessonProgress struct {
	ID              uuid.UUID
	UserID          uuid.UUID
	LessonID        uuid.UUID
	PositionSeconds int
	CompletedAt     *time.Time
	UpdatedAt       time.Time
}
