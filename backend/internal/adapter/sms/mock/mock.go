// Package mock is the development/testing SMS provider: it records messages
// instead of sending them, so OTP flows work end-to-end offline.
package mock

import (
	"context"
	"log/slog"
	"os"
	"sync"
)

type SMS struct {
	mu       sync.Mutex
	messages []Message
	log      *slog.Logger
}

type Message struct {
	Mobile string
	Text   string
}

func New() *SMS { return &SMS{} }

// NewWithLogger logs every (mock) send — development only, so OTP E2E flows
// can read codes from the API log. Production uses the kavenegar adapter.
func NewWithLogger(l *slog.Logger) *SMS { return &SMS{log: l} }

func (m *SMS) Send(_ context.Context, mobile, text string) error {
	m.mu.Lock()
	m.messages = append(m.messages, Message{Mobile: mobile, Text: text})
	m.mu.Unlock()
	if m.log != nil && os.Getenv("APP_ENV") == "development" {
		m.log.Info("mock sms sent", "to", mobile, "text", text)
	}
	return nil
}

// Messages returns a copy of everything sent so far (test assertions).
func (m *SMS) Messages() []Message {
	m.mu.Lock()
	defer m.mu.Unlock()
	out := make([]Message, len(m.messages))
	copy(out, m.messages)
	return out
}

// LastCode extracts the 6-digit code from the most recent message to a mobile.
func (m *SMS) LastCode(mobile string) string {
	m.mu.Lock()
	defer m.mu.Unlock()
	for i := len(m.messages) - 1; i >= 0; i-- {
		msg := m.messages[i]
		if msg.Mobile != mobile {
			continue
		}
		var code string
		for _, r := range msg.Text {
			if r >= '0' && r <= '9' {
				code += string(r)
			}
		}
		if len(code) >= 6 {
			return code[len(code)-6:]
		}
	}
	return ""
}
