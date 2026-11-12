package aiprovider

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// anthropic speaks the native /v1/messages dialect.
type anthropic struct{ cfg Config }

func newAnthropic(cfg Config) *anthropic {
	if strings.TrimSpace(cfg.BaseURL) == "" {
		cfg.BaseURL = DefaultAnthropicBase
	}
	return &anthropic{cfg: cfg}
}

type anthropicRequest struct {
	Model       string            `json:"model"`
	MaxTokens   int               `json:"max_tokens"`
	Temperature float64           `json:"temperature"`
	System      string            `json:"system,omitempty"`
	Messages    []anthropicBudget `json:"messages"`
}

type anthropicBudget struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type anthropicResponse struct {
	Content []struct {
		Type string `json:"type"`
		Text string `json:"text"`
	} `json:"content"`
	Usage struct {
		InputTokens  int `json:"input_tokens"`
		OutputTokens int `json:"output_tokens"`
	} `json:"usage"`
}

func (c *anthropic) Chat(ctx context.Context, req Request) (Response, error) {
	if c.cfg.APIKey == "" {
		return Response{}, fmt.Errorf("کلید API برای سرویس‌دهنده تنظیم نشده است")
	}
	if req.MaxTokens == 0 {
		req.MaxTokens = c.cfg.MaxTokens
	}
	if req.MaxTokens <= 0 {
		// anthropic rejects the call without an explicit cap
		req.MaxTokens = 1024
	}
	if req.Temperature == 0 {
		req.Temperature = c.cfg.Temperature
	}
	body := anthropicRequest{
		Model: c.cfg.Model, MaxTokens: req.MaxTokens, Temperature: req.Temperature,
		System: req.System,
		Messages: []anthropicBudget{{Role: "user", Content: req.User}},
	}
	raw, err := postJSON(ctx, strings.TrimRight(c.cfg.BaseURL, "/")+"/v1/messages", map[string]string{
		"x-api-key":         c.cfg.APIKey,
		"anthropic-version": "2023-06-01",
	}, body)
	if err != nil {
		return Response{}, err
	}
	var out anthropicResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return Response{}, fmt.Errorf("parse provider reply: %w", err)
	}
	text := ""
	for _, block := range out.Content {
		if block.Type == "text" {
			text += block.Text
		}
	}
	if text == "" {
		return Response{}, fmt.Errorf("provider reply holds no text block")
	}
	return Response{
		Text:             text,
		PromptTokens:     out.Usage.InputTokens,
		CompletionTokens: out.Usage.OutputTokens,
	}, nil
}
