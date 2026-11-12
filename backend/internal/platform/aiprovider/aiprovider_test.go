package aiprovider

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestOpenAIStreamForcedOffAndSalvage(t *testing.T) {
	var gotBody map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		json.NewDecoder(r.Body).Decode(&gotBody)
		// a gateway that streamed anyway: valid object + SSE remnant
		w.Write([]byte(`{"choices":[{"message":{"content":"سلام"}}],"usage":{"prompt_tokens":3,"completion_tokens":2}}data: [DONE]`))
	}))
	defer srv.Close()

	c := newOpenAI(Config{BaseURL: srv.URL, APIKey: "k", Model: "m"})
	resp, err := c.Chat(context.Background(), Request{})
	if err != nil {
		t.Fatalf("salvage Chat: %v", err)
	}
	if gotBody["stream"] != false {
		t.Fatalf("stream flag not forced false: %v", gotBody["stream"])
	}
	if resp.Text != "سلام" {
		t.Fatalf("salvaged text = %q", resp.Text)
	}
}

func TestOpenAINonJSONReplySurfacesSnippet(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte(`<html><body>502 Bad Gateway</body></html>`))
	}))
	defer srv.Close()

	c := newOpenAI(Config{BaseURL: srv.URL, APIKey: "k", Model: "m"})
	_, err := c.Chat(context.Background(), Request{})
	if err == nil || !strings.Contains(err.Error(), "502 Bad Gateway") {
		t.Fatalf("want body snippet in error, got %v", err)
	}
}

func TestOpenAIChatRoundTrip(t *testing.T) {
	var gotBody openAIRequest
	var gotAuth string
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		if err := json.NewDecoder(r.Body).Decode(&gotBody); err != nil {
			t.Fatalf("decode request: %v", err)
		}
		reply := "{\"choices\":[{\"message\":{\"content\":\"```json\\n{\\\"ok\\\":true}\\n```\"}}],\"usage\":{\"prompt_tokens\":10,\"completion_tokens\":5}}"
		w.Write([]byte(reply))
	}))
	defer srv.Close()

	c := newOpenAI(Config{Provider: ProviderOpenAI, BaseURL: srv.URL + "/v1",
		APIKey: "sk-test", Model: "gpt-4o-mini", Temperature: 0.4, MaxTokens: 500})
	resp, err := c.Chat(context.Background(), Request{System: "s", User: "u"})
	if err != nil {
		t.Fatalf("Chat: %v", err)
	}
	if gotAuth != "Bearer sk-test" {
		t.Fatalf("auth header = %q", gotAuth)
	}
	if gotBody.Model != "gpt-4o-mini" || gotBody.MaxTokens != 500 || gotBody.Temperature != 0.4 {
		t.Fatalf("request not built from config: %+v", gotBody)
	}
	if len(gotBody.Messages) != 2 || gotBody.Messages[0].Role != "system" {
		t.Fatalf("messages wrong: %+v", gotBody.Messages)
	}
	if resp.PromptTokens != 10 || resp.CompletionTokens != 5 {
		t.Fatalf("usage wrong: %+v", resp)
	}
	obj, err := ExtractJSONObject(resp.Text)
	if err != nil || string(obj) != `{"ok":true}` {
		t.Fatalf("extract from fenced reply: %q, %v", obj, err)
	}
}

func TestOpenAIProviderErrorSurfaces(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusUnauthorized)
		w.Write([]byte(`{"error":{"message":"bad key"}}`))
	}))
	defer srv.Close()

	c := newOpenAI(Config{BaseURL: srv.URL, APIKey: "k", Model: "m"})
	_, err := c.Chat(context.Background(), Request{})
	if err == nil || !strings.Contains(err.Error(), "401") || !strings.Contains(err.Error(), "bad key") {
		t.Fatalf("want surfaced provider error, got %v", err)
	}
}

func TestAnthropicChatShape(t *testing.T) {
	var raw map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("x-api-key") == "" || r.Header.Get("anthropic-version") == "" {
			t.Fatal("anthropic headers missing")
		}
		json.NewDecoder(r.Body).Decode(&raw)
		w.Write([]byte(`{"content":[{"type":"text","text":"{\"a\":1}"}],"usage":{"input_tokens":7,"output_tokens":3}}`))
	}))
	defer srv.Close()

	c := newAnthropic(Config{BaseURL: srv.URL, APIKey: "ak", Model: "claude-sonnet-4-5"})
	resp, err := c.Chat(context.Background(), Request{System: "sys", User: "hi"})
	if err != nil {
		t.Fatalf("Chat: %v", err)
	}
	if raw["system"] != "sys" || raw["max_tokens"] == float64(0) {
		t.Fatalf("anthropic body wrong: %v", raw)
	}
	if resp.PromptTokens != 7 || resp.CompletionTokens != 3 || resp.Text != `{"a":1}` {
		t.Fatalf("response wrong: %+v", resp)
	}
}

func TestGeminiChatShape(t *testing.T) {
	var raw map[string]any
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/v1beta/models/gemini-2.5-flash:generateContent" {
			t.Fatalf("path = %s", r.URL.Path)
		}
		if r.Header.Get("x-goog-api-key") == "" {
			t.Fatal("api key header missing")
		}
		json.NewDecoder(r.Body).Decode(&raw)
		w.Write([]byte(`{"candidates":[{"content":{"parts":[{"text":"hello"}]}}],"usageMetadata":{"promptTokenCount":3,"candidatesTokenCount":2}}`))
	}))
	defer srv.Close()

	c := newGemini(Config{BaseURL: srv.URL, APIKey: "gk", Model: "gemini-2.5-flash"})
	resp, err := c.Chat(context.Background(), Request{System: "s", User: "u"})
	if err != nil {
		t.Fatalf("Chat: %v", err)
	}
	if resp.Text != "hello" || resp.PromptTokens != 3 {
		t.Fatalf("response wrong: %+v", resp)
	}
	sys, _ := raw["systemInstruction"].(map[string]any)
	if sys == nil {
		t.Fatal("system instruction missing")
	}
}

func TestMockDeterministicPerKind(t *testing.T) {
	m := &mock{}
	for _, kind := range []string{"blog_post", "course_copy", "seo", "stats_report"} {
		resp, err := m.Chat(context.Background(), Request{User: "…\nDRAFT_KIND: " + kind + "\n…"})
		if err != nil {
			t.Fatalf("mock %s: %v", kind, err)
		}
		if _, err := ExtractJSONObject(resp.Text); err != nil {
			t.Fatalf("mock %s reply not JSON: %v", kind, err)
		}
	}
}

func TestExtractJSONObjectEdgeCases(t *testing.T) {
	cases := map[string]string{
		`plain {"a":"b"} tail`:               `{"a":"b"}`,
		"```json\n{\"a\":\"{braced}\"}\n```": `{"a":"{braced}"}`,
		`{"nested":{"deep":[1,2,{"x":3}]}}`:  `{"nested":{"deep":[1,2,{"x":3}]}}`,
	}
	for in, want := range cases {
		got, err := ExtractJSONObject(in)
		if err != nil || string(got) != want {
			t.Fatalf("extract(%q) = %q, %v; want %q", in, got, err, want)
		}
	}
	if _, err := ExtractJSONObject("no braces here"); err == nil {
		t.Fatal("want error for brace-less reply")
	}
	if _, err := ExtractJSONObject(`{"unterminated`); err == nil {
		t.Fatal("want error for unterminated object")
	}
}

func TestAPIKeySealRoundTrip(t *testing.T) {
	sealed, err := EncryptAPIKey("server-secret-32-chars-minimum!!", "sk-live-abcdef1234")
	if err != nil {
		t.Fatalf("encrypt: %v", err)
	}
	if strings.Contains(sealed, "sk-live") {
		t.Fatalf("plaintext leaked into sealed value: %s", sealed)
	}
	key, err := DecryptAPIKey("server-secret-32-chars-minimum!!", sealed)
	if err != nil || key != "sk-live-abcdef1234" {
		t.Fatalf("decrypt: %q, %v", key, err)
	}
	// wrong server secret must not open
	if _, err := DecryptAPIKey("other-secret", sealed); err == nil {
		t.Fatal("wrong secret opened the key")
	}
	// plaintext passthrough (hand-written rows) and empty values
	pt, err := DecryptAPIKey("s", "hand-written-key")
	if err != nil || pt != "hand-written-key" {
		t.Fatalf("plaintext passthrough: %q, %v", pt, err)
	}
	if empty, _ := DecryptAPIKey("s", ""); empty != "" {
		t.Fatal("empty sealed value must stay empty")
	}
	if sealed, err := EncryptAPIKey("s", "  "); err != nil || sealed != "" {
		t.Fatalf("blank plaintext: %q, %v", sealed, err)
	}
}

func TestMaskAPIKey(t *testing.T) {
	if got := MaskAPIKey("sk-1234567890"); got != "7890" {
		t.Fatalf("mask = %q", got)
	}
	if got := MaskAPIKey("abc"); got != "abc" {
		t.Fatalf("short mask = %q", got)
	}
	if got := MaskAPIKey(""); got != "" {
		t.Fatalf("empty mask = %q", got)
	}
}

func TestFactoryUnknownProvider(t *testing.T) {
	if _, err := New(Config{Provider: "nope"}); err == nil {
		t.Fatal("want unknown provider error")
	}
}
