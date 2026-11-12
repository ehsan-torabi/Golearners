package aiprovider

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// gemini speaks the generativelanguage generateContent dialect.
type gemini struct{ cfg Config }

func newGemini(cfg Config) *gemini {
	if strings.TrimSpace(cfg.BaseURL) == "" {
		cfg.BaseURL = DefaultGeminiBase
	}
	return &gemini{cfg: cfg}
}

type geminiRequest struct {
	SystemInstruction *geminiPart      `json:"systemInstruction,omitempty"`
	Contents          []geminiContent  `json:"contents"`
	GenerationConfig  geminiGeneration `json:"generationConfig"`
}

type geminiPart struct {
	Parts []geminiText `json:"parts"`
}

type geminiText struct {
	Text string `json:"text"`
}

type geminiContent struct {
	Role  string       `json:"role"`
	Parts []geminiText `json:"parts"`
}

type geminiGeneration struct {
	Temperature     float64 `json:"temperature"`
	MaxOutputTokens int     `json:"maxOutputTokens"`
}

type geminiResponse struct {
	Candidates []struct {
		Content struct {
			Parts []struct {
				Text string `json:"text"`
			} `json:"parts"`
		} `json:"content"`
	} `json:"candidates"`
	UsageMetadata struct {
		PromptTokenCount     int `json:"promptTokenCount"`
		CandidatesTokenCount int `json:"candidatesTokenCount"`
	} `json:"usageMetadata"`
}

func (c *gemini) Chat(ctx context.Context, req Request) (Response, error) {
	if c.cfg.APIKey == "" {
		return Response{}, fmt.Errorf("کلید API برای سرویس‌دهنده تنظیم نشده است")
	}
	if req.MaxTokens == 0 {
		req.MaxTokens = c.cfg.MaxTokens
	}
	if req.Temperature == 0 {
		req.Temperature = c.cfg.Temperature
	}
	body := geminiRequest{
		SystemInstruction: &geminiPart{Parts: []geminiText{{Text: req.System}}},
		Contents:          []geminiContent{{Role: "user", Parts: []geminiText{{Text: req.User}}}},
		GenerationConfig:  geminiGeneration{Temperature: req.Temperature, MaxOutputTokens: req.MaxTokens},
	}
	endpoint := strings.TrimRight(c.cfg.BaseURL, "/") +
		"/v1beta/models/" + c.cfg.Model + ":generateContent"
	raw, err := postJSON(ctx, endpoint, map[string]string{
		"x-goog-api-key": c.cfg.APIKey,
	}, body)
	if err != nil {
		return Response{}, err
	}
	var out geminiResponse
	if err := json.Unmarshal(raw, &out); err != nil {
		return Response{}, fmt.Errorf("parse provider reply: %w", err)
	}
	if len(out.Candidates) == 0 {
		return Response{}, fmt.Errorf("provider reply holds no candidates")
	}
	text := ""
	for _, part := range out.Candidates[0].Content.Parts {
		text += part.Text
	}
	if text == "" {
		return Response{}, fmt.Errorf("provider reply holds no text")
	}
	return Response{
		Text:             text,
		PromptTokens:     out.UsageMetadata.PromptTokenCount,
		CompletionTokens: out.UsageMetadata.CandidatesTokenCount,
	}, nil
}
