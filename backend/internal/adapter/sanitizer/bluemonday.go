// Package sanitizer implements ports.HTMLSanitizer with bluemonday (UGP? no:
// UGCPolicy) — allowlist-based rich-text cleaning per docs/07 §3.
package sanitizer

import (
	"strings"

	"github.com/microcosm-cc/bluemonday"
)

// Sanitizer is the single implementation used by admin content services.
type Sanitizer struct {
	p *bluemonday.Policy
}

// New builds the allowlist: UGC policy (links, images, formatting) extended
// for rich course/blog bodies — headings, tables, lists, code blocks.
func New() *Sanitizer {
	p := bluemonday.UGCPolicy()
	p.AllowElements("h1", "h2", "h3", "h4", "figure", "figcaption", "table", "thead", "tbody", "tr", "th", "td", "code", "pre", "hr", "span", "div")
	p.AllowAttrs("class").OnElements("code", "pre", "span", "div")
	p.AllowAttrs("start").OnElements("ol")
	p.AllowAttrs("colspan", "rowspan").OnElements("td", "th")
	return &Sanitizer{p: p}
}

// SanitizeHTML strips scripts, event handlers, and unallowed attributes.
func (s *Sanitizer) SanitizeHTML(raw string) string {
	return s.p.Sanitize(raw)
}

// SanitizePlainText trims a single-line string, capped by max runes.
func SanitizePlainText(raw string, max int) string {
	s := strings.TrimSpace(raw)
	if max > 0 {
		if r := []rune(s); len(r) > max {
			s = string(r[:max])
		}
	}
	return s
}
