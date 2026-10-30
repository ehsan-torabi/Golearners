// Package storage builds the S3-compatible object storage client.
// MinIO locally, provider S3 (e.g. Arvan) in production. Credentials are
// server-side only; browsers never receive them (presigned URLs in phase 5).
package storage

import (
	"context"
	"fmt"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	appconfig "golearn/backend/internal/platform/config"
)

// Client wraps the S3 API for our single private media bucket.
type Client struct {
	api    *s3.Client
	bucket string
}

// New builds the client. It does NOT contact storage — readiness is checked
// via Ping so the API can boot while storage is briefly unavailable.
func New(ctx context.Context, cfg appconfig.Config) (*Client, error) {
	awsCfg, err := config.LoadDefaultConfig(ctx,
		config.WithRegion(cfg.S3Region),
		config.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(cfg.S3AccessKey, cfg.S3SecretKey, ""),
		),
	)
	if err != nil {
		return nil, fmt.Errorf("load aws config: %w", err)
	}
	api := s3.NewFromConfig(awsCfg, func(o *s3.Options) {
		o.BaseEndpoint = aws.String(cfg.S3Endpoint)
		o.UsePathStyle = true // required for MinIO and most S3-compatible providers
	})
	return &Client{api: api, bucket: cfg.S3Bucket}, nil
}

// Ping verifies the bucket exists and is reachable.
func (c *Client) Ping(ctx context.Context) error {
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if _, err := c.api.HeadBucket(pingCtx, &s3.HeadBucketInput{Bucket: aws.String(c.bucket)}); err != nil {
		return fmt.Errorf("head bucket %q: %w", c.bucket, err)
	}
	return nil
}
