package identity

import (
	"strings"
	"testing"
)

func TestCSRFTokenRoundTrip(t *testing.T) {
	tok, err := NewCSRFToken("pepper")
	if err != nil {
		t.Fatalf("new token: %v", err)
	}
	if !VerifyCSRFToken(tok, "pepper") {
		t.Fatal("a token this server minted must verify")
	}
	if VerifyCSRFToken(tok, "other-pepper") {
		t.Fatal("a token signed with another pepper must not verify")
	}
}

func TestCSRFVerifyRejectsMalformedValues(t *testing.T) {
	valid, _ := NewCSRFToken("pepper")
	nonce, mac, _ := strings.Cut(valid, ".")
	for _, bad := range []string{
		"",
		"forged",            // no separator
		".",                 // empty nonce and mac
		nonce + ".",         // empty mac
		"." + mac,           // empty nonce
		nonce + ".deadbeef", // wrong signature
		nonce + "." + strings.Repeat("0", 64),
	} {
		if VerifyCSRFToken(bad, "pepper") {
			t.Fatalf("value %q must not verify", bad)
		}
	}
}

func TestCSRFTokensAreUniquePerCall(t *testing.T) {
	a, _ := NewCSRFToken("pepper")
	b, _ := NewCSRFToken("pepper")
	if a == b {
		t.Fatal("two minted tokens must differ")
	}
}
