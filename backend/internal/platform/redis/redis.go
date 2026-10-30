// Package redis builds the Redis client (cache, rate limiting, asynq broker later).
package redis

import (
	"context"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

// New connects and pings; the caller owns Close.
func New(ctx context.Context, addr string) (*goredis.Client, error) {
	client := goredis.NewClient(&goredis.Options{Addr: addr})
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := client.Ping(pingCtx).Err(); err != nil {
		_ = client.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}
	return client, nil
}
