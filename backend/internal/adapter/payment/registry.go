// Gateway registry: resolves configured adapters by name.
package payment

import (
	"fmt"
	"sync"

	"golearn/backend/internal/domain/commerce"
	"golearn/backend/internal/ports"
)

// Registry implements ports.GatewayRegistry.
type Registry struct {
	mu   sync.RWMutex
	byID map[commerce.Gateway]ports.PaymentGateway
}

func NewRegistry() *Registry { return &Registry{byID: map[commerce.Gateway]ports.PaymentGateway{}} }

// Register adds (or replaces) a gateway adapter.
func (r *Registry) Register(g ports.PaymentGateway) {
	r.mu.Lock()
	r.byID[g.Name()] = g
	r.mu.Unlock()
}

// Gateway returns the adapter or ErrNotConfigured.
func (r *Registry) Gateway(name commerce.Gateway) (ports.PaymentGateway, error) {
	r.mu.RLock()
	g, ok := r.byID[name]
	r.mu.RUnlock()
	if !ok {
		return nil, fmt.Errorf("%w: %s", ports.ErrNotConfigured, name)
	}
	return g, nil
}
