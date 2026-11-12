package aiprovider

import (
	"context"
	"fmt"
	"regexp"
	"time"
)

// mock is a deterministic in-process provider so the whole draft pipeline —
// settings → generate → diff → approve → apply — can be exercised in tests
// and E2E without any external service or key. It answers with a valid
// payload for the DRAFT_KIND line embedded in the user prompt.
type mock struct{}

var mockKindRe = regexp.MustCompile(`(?m)^DRAFT_KIND:\s*(\S+)`)

func (m *mock) Chat(ctx context.Context, req Request) (Response, error) {
	// behave like a network call, and let callers time the context out
	select {
	case <-ctx.Done():
		return Response{}, ctx.Err()
	case <-time.After(120 * time.Millisecond):
	}
	mk := mockKindRe.FindStringSubmatch(req.User)
	kind := "freeform"
	if mk != nil {
		kind = mk[1]
	}
	text := ""
	switch kind {
	case "blog_post":
		text = `{"summary":"پیشنهاد نوشتهٔ مجله ساخته شد.","notes":"پیش‌نویس بر پایهٔ دستور شما آماده است.","title":"آموزش گام‌به‌گام گو برای برنامه‌نویسان","slug":"go-step-by-step","excerpt":"یک مسیر کوتاه و عملی برای شروع زبان Go.","body_html":"<p>متن پیشنهادی دستیار هوشمند برای این نوشته است.</p>","meta_title":"آموزش زبان Go از صفر","meta_description":"با این راهنمای کوتاه، زبان Go را مرحله‌به‌مرحله شروع کنید.","tag_titles":["گو","آموزش"]}`
	case "course_copy":
		text = `{"summary":"پیشنهاد محتوای صفحهٔ دوره آماده شد.","notes":"عنوان، خلاصه و توضیحات بازنویسی شده‌اند.","title":"دوره بازنویسی‌شده با دستیار","summary":"خلاصهٔ پیشنهادی برای صفحهٔ دوره است.","description_html":"<p>توضیح پیشنهادی دستیار هوشمند برای این دوره است.</p>","outcomes":["نتیجهٔ یادگیری اول","نتیجهٔ یادگیری دوم"]}`
	case "seo":
		text = `{"summary":"پیشنهاد سئو آماده شد.","notes":"عنوان و توضیحات متا بازنویسی شده‌اند.","meta_title":"عنوان متای پیشنهادی","meta_description":"توضیح متای پیشنهادی برای موتورهای جست‌وجو نوشته شده است."}`
	case "stats_report":
		text = `{"summary":"تحلیل آمار آماده شد.","notes":"روند دوره بررسی شد.","markdown":"## جمع‌بندی\nاین یک گزارش آزمایشی است."}`
	default:
		text = `{"summary":"پاسخ آزمایشی آماده شد.","notes":"این پاسخ از سرویس‌دهندهٔ آزمایشی آمده است.","markdown":"## پاسخ\nاین یک پاسخ آزمایشی است."}`
	}
	return Response{Text: text, PromptTokens: 42, CompletionTokens: 128}, nil
}

// mockModelList is only here so the settings panel can render a dropdown.
func (m *mock) ListModels(ctx context.Context) ([]string, error) {
	return []string{"mock"}, nil
}

// ModelsLister is implemented by providers that can name their models; the
// settings endpoint degrades gracefully when they cannot.
type ModelsLister interface {
	ListModels(ctx context.Context) ([]string, error)
}

// ListModels returns the provider's model ids when it can.
func ListModels(ctx context.Context, c Client) ([]string, error) {
	l, ok := c.(ModelsLister)
	if !ok {
		return nil, fmt.Errorf("provider does not list models")
	}
	return l.ListModels(ctx)
}
