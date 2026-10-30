// Slug normalization for Persian-friendly public URLs (docs/04).
package course

import (
	"errors"
	"regexp"
	"strings"
)

var (
	slugUnsafe = regexp.MustCompile(`[^\p{L}\p{N}]+`)
	slugDashes = regexp.MustCompile(`-{2,}`)
)

// NormalizeSlug lowercases, keeps letters (including Persian) and digits,
// converts runs of other characters to single dashes, and caps length.
// Returns an error for empty results.
func NormalizeSlug(in string) (string, error) {
	s := strings.ToLower(strings.TrimSpace(in))
	s = slugUnsafe.ReplaceAllString(s, "-")
	s = slugDashes.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		return "", errors.New("slug is empty")
	}
	return s, nil
}
