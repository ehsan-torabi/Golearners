// Package ratelimit implements ports.Throttler as a Redis fixed-window counter.
package ratelimit

import (
	"context"
	"fmt"
	"time"

	goredis "github.com/redis/go-redis/v9"
)

type Redis struct{ client *goredis.Client }

func New(client *goredis.Client) *Redis { return &Redis{client: client} }

func (r *Redis) Hit(ctx context.Context, key string, limit int, window time.Duration) (bool, time.Duration, error) {
	pipe := r.client.TxPipeline()
	incr := pipe.Incr(ctx, "rl:"+key)
	pipe.ExpireNX(ctx, "rl:"+key, window)
	if _, err := pipe.Exec(ctx); err != nil {
		return false, 0, fmt.Errorf("ratelimit hit: %w", err)
	}
	if incr.Val() > int64(limit) {
		ttl, err := r.client.TTL(ctx, "rl:"+key).Result()
		if err != nil {
			ttl = window
		}
		return false, ttl, nil
	}
	return true, 0, nil
}

func (r *Redis) Blocked(ctx context.Context, key string, limit int) (bool, time.Duration, error) {
	count, err := r.client.Get(ctx, "rl:"+key).Int64()
	if err == goredis.Nil {
		return false, 0, nil
	}
	if err != nil {
		return false, 0, fmt.Errorf("ratelimit blocked: %w", err)
	}
	if count < int64(limit) {
		return false, 0, nil
	}
	ttl, err := r.client.TTL(ctx, "rl:"+key).Result()
	if err != nil {
		return false, 0, fmt.Errorf("ratelimit ttl: %w", err)
	}
	if ttl <= 0 {
		return false, 0, nil
	}
	return true, ttl, nil
}
