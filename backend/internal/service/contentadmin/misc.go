// Admin CRUD for pages, FAQs, testimonials, contact inbox, and blog taxonomy.
package contentadmin

import (
	"context"

	"github.com/google/uuid"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/domain/content"
)

// UpsertPage creates-or-updates a static page by slug.
func (s *Service) UpsertPage(ctx context.Context, actor Actor, p *content.Page) error {
	p.BodyHTML = s.d.Sanitize(p.BodyHTML)
	if len(p.Title) < 1 || p.Slug == "" {
		return apperr.ErrValidation
	}
	if err := s.d.Pages.Upsert(ctx, p); err != nil {
		return err
	}
	return s.audit(ctx, actor, "page.upsert", "page", p.Slug, p)
}

func (s *Service) DeletePage(ctx context.Context, actor Actor, id uuid.UUID) error {
	if err := s.d.Pages.Delete(ctx, id); err != nil {
		return err
	}
	return s.audit(ctx, actor, "page.delete", "page", id.String(), nil)
}

// UpsertFAQ creates-or-updates a Q&A entry.
func (s *Service) UpsertFAQ(ctx context.Context, actor Actor, f *content.FAQ) error {
	if len(f.Question) < 3 || len(f.Answer) < 1 {
		return apperr.ErrValidation
	}
	if err := s.d.FAQs.Upsert(ctx, f); err != nil {
		return err
	}
	return s.audit(ctx, actor, "faq.upsert", "faq", f.ID.String(), f)
}

func (s *Service) DeleteFAQ(ctx context.Context, actor Actor, id uuid.UUID) error {
	if err := s.d.FAQs.Delete(ctx, id); err != nil {
		return err
	}
	return s.audit(ctx, actor, "faq.delete", "faq", id.String(), nil)
}

// UpsertTestimonial creates-or-updates a social proof entry.
func (s *Service) UpsertTestimonial(ctx context.Context, actor Actor, t *content.Testimonial) error {
	t.Body = s.d.Sanitize(t.Body)
	if len(t.AuthorName) < 2 || len(t.Body) < 3 {
		return apperr.ErrValidation
	}
	if err := s.d.Testimonials.Upsert(ctx, t); err != nil {
		return err
	}
	return s.audit(ctx, actor, "testimonial.upsert", "testimonial", t.ID.String(), t)
}

func (s *Service) DeleteTestimonial(ctx context.Context, actor Actor, id uuid.UUID) error {
	if err := s.d.Testimonials.Delete(ctx, id); err != nil {
		return err
	}
	return s.audit(ctx, actor, "testimonial.delete", "testimonial", id.String(), nil)
}

// CreateBlogCategory / Update / Delete.
func (s *Service) CreateBlogCategory(ctx context.Context, actor Actor, c *content.BlogCategory) error {
	if len(c.Title) < 1 {
		return apperr.ErrValidation
	}
	if err := s.d.Taxonomy.CreateCategory(ctx, c); err != nil {
		return err
	}
	return s.audit(ctx, actor, "blog.category.create", "blog_category", c.ID.String(), c)
}

func (s *Service) UpdateBlogCategory(ctx context.Context, actor Actor, c *content.BlogCategory) error {
	if err := s.d.Taxonomy.UpdateCategory(ctx, c); err != nil {
		return err
	}
	return s.audit(ctx, actor, "blog.category.update", "blog_category", c.ID.String(), c)
}

func (s *Service) DeleteBlogCategory(ctx context.Context, actor Actor, id uuid.UUID) error {
	if err := s.d.Taxonomy.DeleteCategory(ctx, id); err != nil {
		return err
	}
	return s.audit(ctx, actor, "blog.category.delete", "blog_category", id.String(), nil)
}

// Inbox marks a contact message read/replied.
func (s *Service) SetContactStatus(ctx context.Context, actor Actor, id uuid.UUID, status content.ContactStatus) error {
	if err := s.d.Contact.SetStatus(ctx, id, status); err != nil {
		return err
	}
	return s.audit(ctx, actor, "contact.status", "contact_message", id.String(), status)
}
