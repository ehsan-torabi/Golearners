package aiassist

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"golearn/backend/internal/apperr"
	"golearn/backend/internal/ports"
)

// genPlan carries everything buildDraft needs: the prompt sent to the
// provider, the before-snapshot for the diff, and the target identity.
type genPlan struct {
	userPrompt  string
	original    json.RawMessage
	targetType  string
	targetLabel string
}

// Typed payload shapes. All fields omitempty: an untouched field is absent,
// which is exactly what the apply overlay and the no-change guard rely on.
type blogPayload struct {
	Title           string   `json:"title,omitempty"`
	Slug            string   `json:"slug,omitempty"`
	Excerpt         string   `json:"excerpt,omitempty"`
	BodyHTML        string   `json:"body_html,omitempty"`
	MetaTitle       string   `json:"meta_title,omitempty"`
	MetaDescription string   `json:"meta_description,omitempty"`
	TagTitles       []string `json:"tag_titles,omitempty"`
}

type coursePayload struct {
	Title           string   `json:"title,omitempty"`
	Summary         string   `json:"summary,omitempty"`
	DescriptionHTML string   `json:"description_html,omitempty"`
	Outcomes        []string `json:"outcomes,omitempty"`
}

type seoPayload struct {
	MetaTitle       string `json:"meta_title,omitempty"`
	MetaDescription string `json:"meta_description,omitempty"`
}

type reportPayload struct {
	HTML string `json:"html"`
}

func (s *Service) builderFor(req GenerateRequest) func(context.Context, GenerateRequest) (genPlan, error) {
	switch req.Kind {
	case ports.AIKindBlogPost:
		return s.buildBlog
	case ports.AIKindCourseCopy:
		return s.buildCourseCopy
	case ports.AIKindSEO:
		return s.buildSEO
	case ports.AIKindStatsReport:
		return s.buildStatsReport
	case ports.AIKindFreeform:
		return s.buildFreeform
	default:
		return nil
	}
}

// systemPrompt is the assistant's writing contract. The voice rules mirror
// DESIGN.md («specific and honest») and the platform's no-invented-numbers
// rule; the slop ban keeps Persian AI-prose clichés out of the copy.
func (s *Service) systemPrompt(persona string) string {
	b := strings.Builder{}
	b.WriteString(`تو دستیار محتوای پنل مدیریت پلتفرم آموزشی «گوLearn» هستی.

قواعد نوشتن:
- فارسی روان و طبیعی بنویس، مثل یک ویراستار انسانی؛ جمله‌ها کوتاه و مشخص.
- از کلیشه‌های متداولِ متن‌های ماشینی استفاده نکن: «در دنیای امروز»، «با ما همراه باشید»، «در این مقاله قصد داریم»، «شگفت‌انگیز»، «نقطه عطف» و جملات اداری بی‌محتوا.
- هیچ عدد، آمار، درصد، نقل‌قول یا تجربهٔ کاربری از خودت نساز. هر عدد فقط از دادهٔ واقعیِ ارائه‌شده می‌آید.
- قیمت، تخفیف، وعدهٔ نتیجه و شهادت‌نامه پیشنهاد نده.
- لحن صمیمی اما صادقانه؛ برای مخاطب فارسی‌زبانِ دوره‌های برنامه‌نویسی.

قواعد خروجی:
- خروجی فقط و فقط «یک» شیء JSON معتبر باشد؛ بدون توضیح اضافه، بدون fence کد، بدون متن پیرامون.
- هیچ فیلدی را خالی و بی‌معنا پر نکن؛ اگر فیلدی را تغییر نمی‌دهی، همان را از پاسخ حذف کن.
- برای متن‌های HTML فقط این تگ‌ها مجاز است: p, h2, h3, ul, ol, li, strong, em, a, blockquote. برای گزارش‌ها و تحلیل‌ها می‌توانی از table, thead, tbody, tr, th, td هم استفاده کنی. بدون style و class و script.`)
	if strings.TrimSpace(persona) != "" {
		b.WriteString("\n\nدستورهای شخصی‌سازی مدیر (اولویت بالاتر از لحن پیش‌فرض، نه از قواعد خروجی):\n")
		b.WriteString(persona)
	}
	return b.String()
}

const changeKeysDoc = `کلیدهای ثابت خروجی: "change_summary" (یک جملهٔ فارسی دربارهٔ تغییر)، "change_notes" (اختیاری، توضیح کوتاه).`

func (s *Service) buildBlog(ctx context.Context, req GenerateRequest) (genPlan, error) {
	schema := `طرح JSON: {"change_summary":"...","change_notes":"...","title":"عنوان","slug":"اسلاگ لاتین با خط تیره","excerpt":"خلاصهٔ یک‌دو جمله‌ای","body_html":"بدنهٔ کامل با تگ‌های مجاز","meta_title":"تا ۶۰ نویسه","meta_description":"۱۲۰ تا ۱۵۵ نویسه","tag_titles":["برچسب"]}`
	plan := genPlan{targetType: "post"}
	if req.TargetID == nil {
		if strings.TrimSpace(req.Instructions) == "" {
			return genPlan{}, apperr.ErrValidation.Wrap(fmt.Errorf("برای نوشتهٔ جدید موضوع یا دستور لازم است"))
		}
		plan.userPrompt = strings.Join([]string{
			"DRAFT_KIND: blog_post",
			"ACTION: create",
			changeKeysDoc,
			schema,
			"یک نوشتهٔ مجلهٔ کامل برای گوLearn بساز.",
			"دستور مدیر:\n" + req.Instructions,
		}, "\n\n")
		return plan, nil
	}
	post, err := s.d.Posts.ByID(ctx, *req.TargetID)
	if err != nil {
		if isNotFound(err) {
			return genPlan{}, apperr.ErrNotFound
		}
		return genPlan{}, err
	}
	tags, _ := s.d.Posts.TagsOf(ctx, post.ID)
	titles := make([]string, 0, len(tags))
	for _, t := range tags {
		titles = append(titles, t.Title)
	}
	orig := blogPayload{
		Title: post.Title, Slug: post.Slug, Excerpt: post.Excerpt,
		BodyHTML: post.BodyHTML, TagTitles: titles,
	}
	if post.MetaTitle != nil {
		orig.MetaTitle = *post.MetaTitle
	}
	if post.MetaDescription != nil {
		orig.MetaDescription = *post.MetaDescription
	}
	plan.original = mustJSONRaw(orig)
	plan.targetLabel = post.Title
	current, _ := json.Marshal(map[string]any{
		"title": post.Title, "slug": post.Slug, "excerpt": post.Excerpt,
		"body_html": capBody(post.BodyHTML), "tag_titles": titles,
	})
	plan.userPrompt = strings.Join([]string{
		"DRAFT_KIND: blog_post",
		"ACTION: update",
		changeKeysDoc,
		schema,
		"نوشتهٔ فعلی (JSON):\n" + string(current),
		"این نوشته را طبق دستور مدیر بازنویسی کن؛ فقط فیلدهایی را در پاسخ بیاور که تغییر می‌دهند.",
		"دستور مدیر:\n" + instructionsOr(req.Instructions, "متن را روان‌تر و مشخص‌تر بازنویسی کن؛ ساختار و حقایق را حفظ کن."),
	}, "\n\n")
	return plan, nil
}

func (s *Service) buildCourseCopy(ctx context.Context, req GenerateRequest) (genPlan, error) {
	if req.TargetID == nil {
		return genPlan{}, apperr.ErrValidation.Wrap(fmt.Errorf("دورهٔ هدف لازم است"))
	}
	c, err := s.d.Courses.ByID(ctx, *req.TargetID)
	if err != nil {
		if isNotFound(err) {
			return genPlan{}, apperr.ErrNotFound
		}
		return genPlan{}, err
	}
	schema := `طرح JSON: {"change_summary":"...","change_notes":"...","title":"عنوان دوره","summary":"خلاصهٔ کوتاه صفحهٔ دوره","description_html":"توضیحات کامل با تگ‌های مجاز","outcomes":["نتیجهٔ یادگیری"]}`
	orig := coursePayload{
		Title: c.Title, Summary: c.Summary,
		DescriptionHTML: c.DescriptionHTML, Outcomes: c.Outcomes,
	}
	current, _ := json.Marshal(map[string]any{
		"title": c.Title, "summary": c.Summary,
		"description_html": capBody(c.DescriptionHTML), "outcomes": c.Outcomes,
	})
	return genPlan{
		targetType: "course", targetLabel: c.Title,
		original: mustJSONRaw(orig),
		userPrompt: strings.Join([]string{
			"DRAFT_KIND: course_copy",
			"ACTION: update",
			changeKeysDoc,
			schema,
			"صفحهٔ فعلی دوره (JSON):\n" + string(current),
			"محتوای صفحهٔ دوره را طبق دستور مدیر بهبود بده؛ فقط فیلدهای تغییر‌یافته را در پاسخ بیاور.",
			"دستور مدیر:\n" + instructionsOr(req.Instructions, "عنوان، خلاصه و توضیحات را روان‌تر و جذاب‌تر بنویس؛ ساختار دوره را تغییر نده."),
		}, "\n\n"),
	}, nil
}

func (s *Service) buildSEO(ctx context.Context, req GenerateRequest) (genPlan, error) {
	if req.TargetID == nil {
		return genPlan{}, apperr.ErrValidation.Wrap(fmt.Errorf("هدف سئو لازم است"))
	}
	schema := `طرح JSON: {"change_summary":"...","change_notes":"...","meta_title":"تا ۶۰ نویسه","meta_description":"۱۲۰ تا ۱۵۵ نویسه"}`
	switch req.TargetType {
	case "post":
		post, err := s.d.Posts.ByID(ctx, *req.TargetID)
		if err != nil {
			if isNotFound(err) {
				return genPlan{}, apperr.ErrNotFound
			}
			return genPlan{}, err
		}
		orig := seoPayload{}
		if post.MetaTitle != nil {
			orig.MetaTitle = *post.MetaTitle
		}
		if post.MetaDescription != nil {
			orig.MetaDescription = *post.MetaDescription
		}
		current, _ := json.Marshal(map[string]any{
			"title": post.Title, "excerpt": post.Excerpt,
			"meta_title": orig.MetaTitle, "meta_description": orig.MetaDescription,
			"body_head": capBody(post.BodyHTML),
		})
		return genPlan{
			targetType: "post", targetLabel: post.Title,
			original: mustJSONRaw(orig),
			userPrompt: strings.Join([]string{
				"DRAFT_KIND: seo", "ACTION: update", changeKeysDoc, schema,
				"محتوای فعلی نوشته (JSON):\n" + string(current),
				"عنوان و توضیحات متا را برای موتورهای جست‌وجو بهبود بده؛ طبیعی و بدون پرکردن با کلیدواژه.",
				"دستور مدیر:\n" + instructionsOr(req.Instructions, "برای جست‌وجوی کاربران فارسی بهینه کن."),
			}, "\n\n"),
		}, nil
	case "course":
		c, err := s.d.Courses.ByID(ctx, *req.TargetID)
		if err != nil {
			if isNotFound(err) {
				return genPlan{}, apperr.ErrNotFound
			}
			return genPlan{}, err
		}
		orig := seoPayload{}
		if c.MetaTitle != nil {
			orig.MetaTitle = *c.MetaTitle
		}
		if c.MetaDescription != nil {
			orig.MetaDescription = *c.MetaDescription
		}
		current, _ := json.Marshal(map[string]any{
			"title": c.Title, "summary": c.Summary,
			"meta_title": orig.MetaTitle, "meta_description": orig.MetaDescription,
		})
		return genPlan{
			targetType: "course", targetLabel: c.Title,
			original: mustJSONRaw(orig),
			userPrompt: strings.Join([]string{
				"DRAFT_KIND: seo", "ACTION: update", changeKeysDoc, schema,
				"محتوای فعلی دوره (JSON):\n" + string(current),
				"عنوان و توضیحات متا را برای موتورهای جست‌وجو بهبود بده؛ طبیعی و بدون پرکردن با کلیدواژه.",
				"دستور مدیر:\n" + instructionsOr(req.Instructions, "برای جست‌وجوی کاربران فارسی بهینه کن."),
			}, "\n\n"),
		}, nil
	default:
		return genPlan{}, apperr.ErrValidation.Wrap(fmt.Errorf("target_type %q", req.TargetType))
	}
}

func (s *Service) buildStatsReport(ctx context.Context, req GenerateRequest) (genPlan, error) {
	var contextJSON string
	var scope string
	if req.TargetID == nil {
		scope = "کل سایت (۳۰ روز گذشته)"
		summary, err := s.d.Analytics.Summary(ctx, 30)
		if err != nil {
			return genPlan{}, err
		}
		rows, _, err := s.d.Stats.List(ctx, ports.CourseStatsFilter{}, 1, 20)
		if err != nil {
			return genPlan{}, err
		}
		compact := make([]map[string]any, 0, len(rows))
		for _, r := range rows {
			compact = append(compact, map[string]any{
				"title": r.Title, "enrollments": r.Enrollments,
				"revenue_rial": r.RevenueRial, "watch_seconds": r.WatchSeconds,
				"avg_rating": r.AvgRating, "completion_pct": r.CompletionPct,
			})
		}
		payload, _ := json.Marshal(map[string]any{"site_summary": summary, "top_courses": compact})
		contextJSON = string(payload)
	} else {
		c, err := s.d.Courses.ByID(ctx, *req.TargetID)
		if err != nil {
			if isNotFound(err) {
				return genPlan{}, apperr.ErrNotFound
			}
			return genPlan{}, err
		}
		scope = "دوره: " + c.Title
		detail, err := s.d.Stats.Detail(ctx, *req.TargetID, 60)
		if err != nil {
			return genPlan{}, err
		}
		payload, _ := json.Marshal(detail)
		contextJSON = string(payload)
	}
	schema := `طرح JSON: {"change_summary":"...","change_notes":"...","html":"گزارش به فارسی با تگ‌های مجاز (p, h2, h3, ul, ol, li, strong, em, table)"}`
	return genPlan{
		targetType: "", targetLabel: scope,
		// the raw stats payload doubles as the "original" so the panel can
		// show the numbers the analysis was built on
		original: json.RawMessage(contextJSON),
		userPrompt: strings.Join([]string{
			"DRAFT_KIND: stats_report", "ACTION: none", changeKeysDoc, schema,
			"دادهٔ واقعی آمار (JSON) — تنها منبع مجاز اعداد:\n" + contextJSON,
			"یک تحلیل کوتاه، مشخص و عمل‌گرا بنویس: چه چیزی خوب پیش می‌رود، چه چیزی نگران‌کننده است و دو سه اقدام پیشنهادی. از عددِ خارج از داده استفاده نکن.",
			"تأکید مدیر:\n" + instructionsOr(req.Instructions, "—"),
		}, "\n\n"),
	}, nil
}

func (s *Service) buildFreeform(_ context.Context, req GenerateRequest) (genPlan, error) {
	if strings.TrimSpace(req.Instructions) == "" {
		return genPlan{}, apperr.ErrValidation.Wrap(fmt.Errorf("درخواست خالی است"))
	}
	schema := `طرح JSON: {"change_summary":"...","change_notes":"...","html":"پاسخ به فارسی با تگ‌های مجاز (p, h2, h3, ul, ol, li, strong, em)"}`
	return genPlan{
		targetLabel: "درخواست آزاد",
		userPrompt: strings.Join([]string{
			"DRAFT_KIND: freeform", "ACTION: none", changeKeysDoc, schema,
			"مدیر پنل یک درخواست عمومی دارد؛ پاسخ مشخص و کاربردی بده.",
			"درخواست مدیر:\n" + req.Instructions,
		}, "\n\n"),
	}, nil
}

func instructionsOr(instructions, fallback string) string {
	if strings.TrimSpace(instructions) == "" {
		return fallback
	}
	return instructions
}
