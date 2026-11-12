package aiprovider

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
)

// openAI speaks the /chat/completions dialect: OpenAI itself plus every
// compatible gateway the admin may point base_url at (OpenRouter, Ollama,
// vLLM, LM Studio, local llama.cpp).
type openAI struct{ cfg Config }

func newOpenAI(cfg Config) *openAI {
	if strings.TrimSpace(cfg.BaseURL) == "" {
		cfg.BaseURL = DefaultOpenAIBase
	}
	return &openAI{cfg: cfg}
}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIRequest struct {
	Model       string          `json:"model"`
	Messages    []openAIMessage `json:"messages"`
	Temperature float64         `json:"temperature"`
	MaxTokens   int             `json:"max_tokens,omitempty"`
	// explicit false: many OpenAI-compatible gateways stream by default and
	// an SSE body cannot carry the whole (single-object) reply we parse
	Stream bool `json:"stream"`
}

type openAIResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
	Usage struct {
		PromptTokens     int `json:"prompt_tokens"`
		CompletionTokens int `json:"completion_tokens"`
	} `json:"usage"`
}

func (c *openAI) Chat(ctx context.Context, req Request) (Response, error) {
	if c.cfg.APIKey == "" {
		return Response{}, fmt.Errorf("کلید API برای سرویس‌دهنده تنظیم نشده است")
	}
	if req.MaxTokens == 0 {
		req.MaxTokens = c.cfg.MaxTokens
	}
	if req.Temperature == 0 {
		req.Temperature = c.cfg.Temperature
	}
	body := openAIRequest{
		Model:    c.cfg.Model,
		Messages: []openAIMessage{{Role: "system", Content: req.System}, {Role: "user", Content: req.User}},
		Temperature: req.Temperature,
		MaxTokens:   req.MaxTokens,
		Stream:      false,
	}
	endpoint := strings.TrimRight(c.cfg.BaseURL, "/") + "/chat/completions"
	raw, err := postJSON(ctx, endpoint, map[string]string{
		"Authorization": "Bearer " + c.cfg.APIKey,
	}, body)
	if err != nil {
		return Response{}, err
	}
	out, err := parseProviderReply[openAIResponse](raw)
	if err != nil {
		return Response{}, err
	}
	if len(out.Choices) == 0 {
		return Response{}, fmt.Errorf("provider reply holds no choices")
	}
	return Response{
		Text:             out.Choices[0].Message.Content,
		PromptTokens:     out.Usage.PromptTokens,
		CompletionTokens: out.Usage.CompletionTokens,
	}, nil
}

// ListModels queries the provider's /models endpoint for the settings
// autocomplete; best-effort, an error means "type the model yourself".
func (c *openAI) ListModels(ctx context.Context) ([]string, error) {
	if c.cfg.APIKey == "" {
		return nil, fmt.Errorf("کلید API برای سرویس‌دهنده تنظیم نشده است")
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet,
		strings.TrimRight(c.cfg.BaseURL, "/")+"/models", nil)
	if err != nil {
		return nil, fmt.Errorf("build models request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+c.cfg.APIKey)
	resp, err := httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("ارسال درخواست به سرویس‌دهنده ناموفق بود: %w", err)
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return nil, fmt.Errorf("read provider response: %w", err)
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("سرویس‌دهنده خطای %d برگرداند", resp.StatusCode)
	}
	var parsed struct {
		Data []struct {
			ID string `json:"id"`
		} `json:"data"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return nil, fmt.Errorf("parse models reply: %w", err)
	}
	ids := make([]string, 0, len(parsed.Data))
	for _, m := range parsed.Data {
		if m.ID != "" {
			ids = append(ids, m.ID)
		}
	}
	return ids, nil
}
