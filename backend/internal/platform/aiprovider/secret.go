package aiprovider

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"strings"
)

// The provider API key is stored inside the settings JSONB, so it must not
// sit in plaintext on disk: AES-256-GCM with a key derived from the server
// secret. Ciphertext shape is "v1:<nonce b64>:<ciphertext b64>" so a future
// scheme can rotate by prefix.

// EncryptAPIKey seals plaintext with a key derived from serverSecret.
func EncryptAPIKey(serverSecret, plaintext string) (string, error) {
	if strings.TrimSpace(plaintext) == "" {
		return "", nil
	}
	gcm, err := apiCipher(serverSecret)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("nonce: %w", err)
	}
	sealed := gcm.Seal(nil, nonce, []byte(plaintext), nil)
	return "v1:" + base64.RawStdEncoding.EncodeToString(nonce) + ":" +
		base64.RawStdEncoding.EncodeToString(sealed), nil
}

// DecryptAPIKey opens a sealed key. Missing or legacy-plaintext values pass
// through: an empty stored key simply means "not configured yet".
func DecryptAPIKey(serverSecret, sealed string) (string, error) {
	sealed = strings.TrimSpace(sealed)
	if sealed == "" {
		return "", nil
	}
	if !strings.HasPrefix(sealed, "v1:") {
		// written by hand (e.g. via SQL) — treat as already-plaintext
		return sealed, nil
	}
	parts := strings.SplitN(strings.TrimPrefix(sealed, "v1:"), ":", 2)
	if len(parts) != 2 {
		return "", errors.New("sealed api key shape is invalid")
	}
	nonce, err := base64.RawStdEncoding.DecodeString(parts[0])
	if err != nil {
		return "", fmt.Errorf("api key nonce: %w", err)
	}
	ct, err := base64.RawStdEncoding.DecodeString(parts[1])
	if err != nil {
		return "", fmt.Errorf("api key ciphertext: %w", err)
	}
	gcm, err := apiCipher(serverSecret)
	if err != nil {
		return "", err
	}
	pt, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", fmt.Errorf("open api key: %w", err)
	}
	return string(pt), nil
}

func apiCipher(serverSecret string) (cipher.AEAD, error) {
	if serverSecret == "" {
		return nil, errors.New("server secret is empty")
	}
	key := sha256.Sum256([]byte("golearn/ai-api-key/v1:" + serverSecret))
	block, err := aes.NewCipher(key[:])
	if err != nil {
		return nil, fmt.Errorf("aes: %w", err)
	}
	return cipher.NewGCM(block)
}

// MaskAPIKey returns the last4 hint shown in the panel.
func MaskAPIKey(key string) string {
	if key == "" {
		return ""
	}
	runes := []rune(strings.TrimSpace(key))
	if len(runes) <= 4 {
		return string(runes)
	}
	return string(runes[len(runes)-4:])
}
