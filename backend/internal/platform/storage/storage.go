// Package storage builds the S3-compatible object storage client.
// MinIO locally, provider S3 (e.g. Arvan) in production. Credentials are
// server-side only; browsers never receive them (presigned URLs in phase 5).
package storage

import (
	"context"
	"fmt"
	"io"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"

	appconfig "golearn/backend/internal/platform/config"
	"golearn/backend/internal/ports"
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

// PresignPut returns a short-lived single-object upload URL.
func (c *Client) PresignPut(ctx context.Context, key, contentType string, ttl time.Duration) (string, error) {
	presign := s3.NewPresignClient(c.api)
	out, err := presign.PresignPutObject(ctx, &s3.PutObjectInput{
		Bucket:      aws.String(c.bucket),
		Key:         aws.String(key),
		ContentType: aws.String(contentType),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", fmt.Errorf("presign put: %w", err)
	}
	return out.URL, nil
}

// PresignGet returns a short-lived download URL for a private object.
func (c *Client) PresignGet(ctx context.Context, key string, ttl time.Duration) (string, string, error) {
	presign := s3.NewPresignClient(c.api)
	out, err := presign.PresignGetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	}, s3.WithPresignExpires(ttl))
	if err != nil {
		return "", "", fmt.Errorf("presign get: %w", err)
	}
	return out.URL, "", nil
}

// Get streams the object body for server-side delivery.
func (c *Client) Get(ctx context.Context, key string) (io.ReadCloser, int64, error) {
	out, err := c.api.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, 0, fmt.Errorf("get %q: %w", key, err)
	}
	return out.Body, aws.ToInt64(out.ContentLength), nil
}

// Stat returns object metadata via HeadObject.
func (c *Client) Stat(ctx context.Context, key string) (ports.ObjectInfo, error) {
	out, err := c.api.HeadObject(ctx, &s3.HeadObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return ports.ObjectInfo{}, fmt.Errorf("stat %q: %w", key, err)
	}
	return ports.ObjectInfo{SizeBytes: aws.ToInt64(out.ContentLength), ETag: aws.ToString(out.ETag)}, nil
}

// Delete removes a private object.
func (c *Client) Delete(ctx context.Context, key string) error {
	_, err := c.api.DeleteObject(ctx, &s3.DeleteObjectInput{
		Bucket: aws.String(c.bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return fmt.Errorf("delete %q: %w", key, err)
	}
	return nil
}
