// Package logger builds the process-wide structured logger (JSON to stdout).
package logger

import (
	"fmt"
	"log/slog"
	"os"
	"strings"
)

// New returns a slog.Logger at the given level (debug|info|warn|error).
func New(level string) (*slog.Logger, error) {
	var lvl slog.Level
	switch strings.ToLower(level) {
	case "debug":
		lvl = slog.LevelDebug
	case "info":
		lvl = slog.LevelInfo
	case "warn":
		lvl = slog.LevelWarn
	case "error":
		lvl = slog.LevelError
	default:
		return nil, fmt.Errorf("unknown log level %q (want debug|info|warn|error)", level)
	}
	return slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: lvl})), nil
}
