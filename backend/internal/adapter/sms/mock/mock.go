// Package mock is the development/testing SMS provider: it records messages
// instead of sending them, so OTP flows work end-to-end offline.
package mock

import (
	"context"
	"sync"
)

type SMS struct {
	mu       sync.Mutex
	messages []Message
}

type Message struct {
	Mobile string
	Text   string
}

func New() *SMS { return &SMS{} }

func (m *SMS) Send(_ context.Context, mobile, text string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.messages = append(m.messages, Message{Mobile: mobile, Text: text})
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
