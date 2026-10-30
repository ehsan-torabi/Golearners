// Command mockgateway is a fake Iranian IPG for development and tests:
// /start/{ref} shows pay/fail buttons, /api/verify re-checks ref+amount.
// NOT for production.
package main

import (
	"encoding/json"
	"html"
	"log"
	"net/http"
	"sync"
)

type session struct {
	Amount   int64  `json:"amount"`
	Callback string `json:"callback"`
	Verified bool   `json:"verified"`
}

type gateway struct {
	mu       sync.Mutex
	sessions map[string]*session
}

func (g *gateway) start(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Ref      string `json:"ref"`
		Amount   int64  `json:"amount"`
		Callback string `json:"callback"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Ref == "" || in.Callback == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	g.mu.Lock()
	g.sessions[in.Ref] = &session{Amount: in.Amount, Callback: in.Callback}
	g.mu.Unlock()
	writeJSON(w, map[string]any{"redirect_url": "/start/" + in.Ref})
}

func (g *gateway) page(w http.ResponseWriter, r *http.Request) {
	ref := r.PathValue("ref")
	g.mu.Lock()
	s, ok := g.sessions[ref]
	g.mu.Unlock()
	if !ok {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(`<html dir="rtl"><body style="font-family:sans-serif;text-align:center;padding-top:3rem">
<h1>درگاه پرداخت آزمایشی</h1><p>مبلغ: ` + format(s.Amount) + ` ریال</p>
<a href="/api/pay?ref=` + html.EscapeString(ref) + `&result=ok" style="font-size:1.2rem;padding:.6rem 1.4rem;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none">پرداخت موفق</a>
&nbsp; <a href="/api/pay?ref=` + html.EscapeString(ref) + `&result=nok" style="font-size:1.2rem;padding:.6rem 1.4rem;background:#dc2626;color:#fff;border-radius:8px;text-decoration:none">انصراف / شکست</a>
</body></html>`))
}

func (g *gateway) pay(w http.ResponseWriter, r *http.Request) {
	ref := r.URL.Query().Get("ref")
	g.mu.Lock()
	s, ok := g.sessions[ref]
	g.mu.Unlock()
	if !ok {
		http.NotFound(w, r)
		return
	}
	status := "NOK"
	if r.URL.Query().Get("result") == "ok" {
		status = "OK"
	}
	sep := "?"
	if contains(s.Callback, "?") {
		sep = "&"
	}
	http.Redirect(w, r, s.Callback+sep+"ref="+ref+"&Status="+status, http.StatusFound)
}

func (g *gateway) verify(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Ref    string `json:"ref"`
		Amount int64  `json:"amount"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Ref == "" {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	g.mu.Lock()
	s, ok := g.sessions[in.Ref]
	already := ok && s.Verified
	if ok && !s.Verified {
		s.Verified = true
	}
	g.mu.Unlock()
	if !ok || s.Amount != in.Amount {
		writeJSON(w, map[string]any{"ok": false})
		return
	}
	writeJSON(w, map[string]any{"ok": true, "already": already, "card": "6037-****-****-1234"})
}

func (g *gateway) refund(w http.ResponseWriter, r *http.Request) {
	var in struct {
		Ref string `json:"ref"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		http.Error(w, "bad request", http.StatusBadRequest)
		return
	}
	g.mu.Lock()
	_, ok := g.sessions[in.Ref]
	g.mu.Unlock()
	writeJSON(w, map[string]any{"ok": ok})
}

func main() {
	g := &gateway{sessions: map[string]*session{}}
	mux := http.NewServeMux()
	mux.HandleFunc("POST /api/start", g.start)
	mux.HandleFunc("POST /api/verify", g.verify)
	mux.HandleFunc("POST /api/refund", g.refund)
	mux.HandleFunc("GET /start/{ref}", g.page)
	mux.HandleFunc("GET /api/pay", g.pay)
	log.Println("mock gateway on :8082")
	log.Fatal(http.ListenAndServe(":8082", mux))
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}

func format(n int64) string {
	return jsonNumber(n)
}

func jsonNumber(n int64) string {
	b, _ := json.Marshal(n)
	return string(b)
}

func contains(s, sub string) bool {
	for i := 0; i+len(sub) <= len(s); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}
