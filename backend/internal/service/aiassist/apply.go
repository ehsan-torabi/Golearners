package aiassist

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"

	courseSlug "golearn/backend/internal/domain/course"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/ports"
	"golearn/backend/internal/service/contentadmin"
	"golearn/backend/internal/service/courseadmin"
)

// Approve applies a pending content draft to its target and marks it applied.
// This is the only path from an AI proposal to real data, and it runs because
// an admin pressed "approve" on the shown diff.
func (s *Service) Approve(ctx context.Context, actor Actor, id int64) (*ports.AIDraft, error) {
	draft, err := s.d.Drafts.ByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if draft.Status != ports.AIStatusPending {
		return nil, apperr.ErrAIDecided
	}
	var applyErr error
	switch draft.Kind {
	case ports.AIKindBlogPost:
		applyErr = s.applyBlogPost(ctx, actor, draft)
	case ports.AIKindCourseCopy:
		applyErr = s.applyCourse(ctx, actor, draft)
	case ports.AIKindSEO:
		applyErr = s.applySEO(ctx, actor, draft)
	default:
		return nil, apperr.ErrAINotApplicable
	}
	if applyErr != nil {
		_ = s.d.Drafts.SetStatus(ctx, id, ports.AIStatusFailed, truncate(applyErr.Error(), 500))
		return nil, applyErr
	}
	if err := s.d.Drafts.MarkApplied(ctx, id); err != nil {
		return nil, err
	}
	s.audit(ctx, actor, "ai.draft.apply", id, map[string]any{
		"kind": draft.Kind, "action": draft.Action, "target_id": draft.TargetID,
	})
	return s.d.Drafts.ByID(ctx, id)
}

// Reject declines a pending draft; the proposal keeps its audit trail.
func (s *Service) Reject(ctx context.Context, actor Actor, id int64) (*ports.AIDraft, error) {
	draft, err := s.d.Drafts.ByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if draft.Status != ports.AIStatusPending {
		return nil, apperr.ErrAIDecided
	}
	if err := s.d.Drafts.SetStatus(ctx, id, ports.AIStatusRejected, ""); err != nil {
		return nil, err
	}
	s.audit(ctx, actor, "ai.draft.reject", id, map[string]any{"kind": draft.Kind})
	return s.d.Drafts.ByID(ctx, id)
}

// List is the admin worklist.
func (s *Service) List(ctx context.Context, f ports.AIDraftFilter, page, perPage int) ([]*ports.AIDraft, int, error) {
	return s.d.Drafts.List(ctx, f, page, perPage)
}

// ByID returns one draft with its snapshots.
func (s *Service) ByID(ctx context.Context, id int64) (*ports.AIDraft, error) {
	return s.d.Drafts.ByID(ctx, id)
}

// Delete removes a decided (or abandoned) draft from the worklist.
func (s *Service) Delete(ctx context.Context, actor Actor, id int64) error {
	draft, err := s.d.Drafts.ByID(ctx, id)
	if err != nil {
		return err
	}
	if draft.Status == ports.AIStatusPending {
		return apperr.ErrValidation.Wrap(fmt.Errorf("پیش‌نویس در انتظار تصمیم است؛ ابتدا تأیید یا ردش کنید"))
	}
	if err := s.d.Drafts.Delete(ctx, id); err != nil {
		return err
	}
	s.audit(ctx, actor, "ai.draft.delete", id, map[string]any{"kind": draft.Kind})
	return nil
}

// Usage feeds the small metering view in the panel.
func (s *Service) Usage(ctx context.Context, days int) (*ports.AIUsageSummary, []ports.AIUsageDay, error) {
	if days <= 0 || days > 365 {
		days = 30
	}
	sum, err := s.d.Usage.Summary(ctx, days)
	if err != nil {
		return nil, nil, err
	}
	daily, err := s.d.Usage.Daily(ctx, days)
	if err != nil {
		return nil, nil, err
	}
	return sum, daily, nil
}

// --- apply overlays ---------------------------------------------------------

// overlayOnly semantics: an absent or empty proposed field means "keep the
// current value"; the AI can only change what it shows.

func (s *Service) applyBlogPost(ctx context.Context, actor Actor, draft *ports.AIDraft) error {
	var p blogPayload
	if err := json.Unmarshal(draft.Proposed, &p); err != nil {
		return apperr.ErrAINotApplicable.Wrap(err)
	}
	if draft.Action == "create" {
		in := contentadmin.PostInput{
			Title: p.Title, Slug: p.Slug, Excerpt: p.Excerpt,
			BodyHTML: p.BodyHTML, TagTitles: p.TagTitles,
			// 0 → the content service re-estimates reading time
			ReadingMinutes: 0,
		}
		if in.Slug == "" {
			if slug, err := courseSlug.NormalizeSlug(p.Title); err == nil {
				in.Slug = slug
			}
		}
		if p.MetaTitle != "" {
			in.MetaTitle = &p.MetaTitle
		}
		if p.MetaDescription != "" {
			in.MetaDescription = &p.MetaDescription
		}
		_, err := s.d.Content.CreatePost(ctx, actor, in, actor.ID)
		return err
	}
	if draft.TargetID == nil {
		return apperr.ErrAINotApplicable
	}
	in, err := s.currentPostInput(ctx, *draft.TargetID)
	if err != nil {
		return err
	}
	if p.Title != "" {
		in.Title = p.Title
	}
	if p.Slug != "" {
		in.Slug = p.Slug
	}
	if p.Excerpt != "" {
		in.Excerpt = p.Excerpt
	}
	if p.BodyHTML != "" {
		in.BodyHTML = p.BodyHTML
	}
	if p.MetaTitle != "" {
		in.MetaTitle = &p.MetaTitle
	}
	if p.MetaDescription != "" {
		in.MetaDescription = &p.MetaDescription
	}
	if len(p.TagTitles) > 0 {
		in.TagTitles = p.TagTitles
	}
	_, err = s.d.Content.UpdatePost(ctx, actor, *draft.TargetID, *in)
	return err
}

// currentPostInput rebuilds a full PostInput from the stored post so the
// services' PUT-style updates only change what the draft proposed.
func (s *Service) currentPostInput(ctx context.Context, id uuid.UUID) (*contentadmin.PostInput, error) {
	post, err := s.d.Posts.ByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	tags, err := s.d.Posts.TagsOf(ctx, post.ID)
	if err != nil {
		return nil, err
	}
	titles := make([]string, 0, len(tags))
	for _, t := range tags {
		titles = append(titles, t.Title)
	}
	return &contentadmin.PostInput{
		Title: post.Title, Slug: post.Slug, Excerpt: post.Excerpt,
		BodyHTML: post.BodyHTML, CoverMediaID: post.CoverMediaID,
		CategoryID: post.CategoryID, SeriesID: post.SeriesID,
		SeriesPart: post.SeriesPart, Featured: post.Featured,
		OGImageMediaID: post.OGImageMediaID,
		MetaTitle:      post.MetaTitle, MetaDescription: post.MetaDescription,
		TagTitles:      titles,
		ReadingMinutes: 0,
	}, nil
}

func (s *Service) applyCourse(ctx context.Context, actor Actor, draft *ports.AIDraft) error {
	if draft.TargetID == nil {
		return apperr.ErrAINotApplicable
	}
	var p coursePayload
	if err := json.Unmarshal(draft.Proposed, &p); err != nil {
		return apperr.ErrAINotApplicable.Wrap(err)
	}
	in, err := s.currentCourseInput(ctx, *draft.TargetID)
	if err != nil {
		return err
	}
	if p.Title != "" {
		in.Title = p.Title
	}
	if p.Summary != "" {
		in.Summary = p.Summary
	}
	if p.DescriptionHTML != "" {
		in.DescriptionHTML = p.DescriptionHTML
	}
	if len(p.Outcomes) > 0 {
		in.Outcomes = p.Outcomes
	}
	_, err = s.d.CourseAdmin.UpdateCourse(ctx, courseAdminActor(actor), *draft.TargetID, *in)
	return err
}

func (s *Service) applySEO(ctx context.Context, actor Actor, draft *ports.AIDraft) error {
	if draft.TargetID == nil {
		return apperr.ErrAINotApplicable
	}
	var p seoPayload
	if err := json.Unmarshal(draft.Proposed, &p); err != nil {
		return apperr.ErrAINotApplicable.Wrap(err)
	}
	switch draft.TargetType {
	case "post":
		in, err := s.currentPostInput(ctx, *draft.TargetID)
		if err != nil {
			return err
		}
		if p.MetaTitle != "" {
			in.MetaTitle = &p.MetaTitle
		}
		if p.MetaDescription != "" {
			in.MetaDescription = &p.MetaDescription
		}
		_, err = s.d.Content.UpdatePost(ctx, actor, *draft.TargetID, *in)
		return err
	case "course":
		in, err := s.currentCourseInput(ctx, *draft.TargetID)
		if err != nil {
			return err
		}
		if p.MetaTitle != "" {
			in.MetaTitle = &p.MetaTitle
		}
		if p.MetaDescription != "" {
			in.MetaDescription = &p.MetaDescription
		}
		_, err = s.d.CourseAdmin.UpdateCourse(ctx, courseAdminActor(actor), *draft.TargetID, *in)
		return err
	default:
		return apperr.ErrAINotApplicable
	}
}

// currentCourseInput rebuilds the full CourseInput (incl. category links)
// from the stored course, leaving money and level untouched by the AI.
func (s *Service) currentCourseInput(ctx context.Context, id uuid.UUID) (*courseadmin.CourseInput, error) {
	c, err := s.d.Courses.ByID(ctx, id)
	if err != nil {
		if isNotFound(err) {
			return nil, apperr.ErrNotFound
		}
		return nil, err
	}
	cats, err := s.d.Cats.ForCourse(ctx, c.ID)
	if err != nil {
		return nil, err
	}
	catIDs := make([]uuid.UUID, 0, len(cats))
	for _, cat := range cats {
		catIDs = append(catIDs, cat.ID)
	}
	return &courseadmin.CourseInput{
		Title: c.Title, Slug: c.Slug, Summary: c.Summary,
		DescriptionHTML: c.DescriptionHTML, Level: c.Level,
		PriceRial: c.PriceRial, CompareAtPriceRial: c.CompareAtPriceRial,
		PrerequisitesHTML: c.PrerequisitesHTML, Outcomes: c.Outcomes,
		MetaTitle: c.MetaTitle, MetaDescription: c.MetaDescription,
		CoverMediaID: c.CoverMediaID, PromoVideoMediaID: c.PromoVideoMediaID,
		IsFeatured: c.IsFeatured, CategoryIDs: catIDs,
	}, nil
}

// courseAdminActor converts the shared audit actor shape for the course
// service (the two packages define their own Actor structs).
func courseAdminActor(a Actor) courseadmin.Actor {
	return courseadmin.Actor{ID: a.ID, IP: a.IP, UserAgent: a.UserAgent}
}
