// Package identity holds the identity domain: users, roles, OTP policy, and
// refresh-token semantics. Pure domain — imports stdlib + uuid only.
package identity

import (
	"fmt"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleOwner      Role = "owner"
	RoleAdmin      Role = "admin"
	RoleInstructor Role = "instructor"
	RoleLearner    Role = "learner"
)

type Status string

const (
	StatusActive  Status = "active"
	StatusBlocked Status = "blocked"
	StatusDeleted Status = "deleted"
)

type User struct {
	ID               uuid.UUID
	Mobile           string
	Email            *string
	FullName         string
	PasswordHash     string // empty ⇒ no password set yet
	Status           Status
	MobileVerifiedAt *time.Time
	LastLoginAt      *time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// Actor is the authenticated principal carried in request context. Roles are
// loaded fresh from the database per request so blocks/role changes apply
// immediately (docs/02 ADR-1 note).
type Actor struct {
	ID     uuid.UUID
	Status Status
	Roles  []Role
}

func (a *Actor) HasRole(r Role) bool {
	for _, have := range a.Roles {
		if have == r {
			return true
		}
	}
	return false
}

var mobileRe = regexp.MustCompile(`^09\d{9}$`)

// weakPasswords is a small denylist; real breach checks come later if needed.
var weakPasswords = map[string]struct{}{
	"12345678": {}, "123456789": {}, "password": {}, "password1": {},
	"qwertyui": {}, "11111111": {}, "00000000": {}, "aaaaaaaa": {},
	"iranhacker": {}, "golearn1": {},
}

func NormalizeMobile(m string) string { return strings.TrimSpace(m) }

func ValidateMobile(m string) error {
	if !mobileRe.MatchString(m) {
		return fmt.Errorf("mobile %q is not a valid Iranian mobile number", m)
	}
	return nil
}

func ValidateFullName(name string) error {
	n := strings.TrimSpace(name)
	if len(n) < 3 || len(n) > 120 {
		return fmt.Errorf("full name must be 3..120 characters")
	}
	return nil
}

// ValidatePassword: 8..72 chars (72 = Argon2 practical cap), letter+digit, not in denylist.
func ValidatePassword(p string) error {
	if len(p) < 8 || len(p) > 72 {
		return fmt.Errorf("password must be 8..72 characters")
	}
	var hasLetter, hasDigit bool
	for _, r := range p {
		switch {
		case r >= '0' && r <= '9':
			hasDigit = true
		case (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || r > unicodeMaxASCII:
			hasLetter = true
		}
	}
	if !hasLetter || !hasDigit {
		return fmt.Errorf("password must contain letters and digits")
	}
	if _, bad := weakPasswords[strings.ToLower(p)]; bad {
		return fmt.Errorf("password is too common")
	}
	return nil
}

const unicodeMaxASCII = 'z' // keeps Persian letters counting as "letters" without unicode tables
