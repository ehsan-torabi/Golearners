# GoLearn — developer commands. See README.md for the full quickstart.

-include .env   # provides DATABASE_URL etc.; missing file is fine (targets will fail with a clear error)

COMPOSE = docker compose -f deploy/docker-compose.yml --env-file .env

.PHONY: infra dev migrate-up migrate-down migrate-status seed sqlc build test fmt tidy

## infra: start postgres, redis, minio (+bucket), caddy
infra:
	$(COMPOSE) up -d postgres redis minio minio-init caddy

## dev: run the Go API natively with hot env from .env
dev:
	set -a; . ./.env; set +a; cd backend && go run ./cmd/api

## migrations (bundled golang-migrate; no external CLI needed)
migrate-up:
	cd backend && DATABASE_URL="$(DATABASE_URL)" MIGRATIONS_DIR=migrations go run ./cmd/migrate up

migrate-down:
	cd backend && DATABASE_URL="$(DATABASE_URL)" MIGRATIONS_DIR=migrations go run ./cmd/migrate down 1

migrate-status:
	cd backend && DATABASE_URL="$(DATABASE_URL)" MIGRATIONS_DIR=migrations go run ./cmd/migrate version

## seed: dev-only fixture data (via the postgres container; no host psql needed)
seed:
	docker compose -f deploy/docker-compose.yml exec -T postgres psql -U $${POSTGRES_USER:-golearn} -d $${POSTGRES_DB:-golearn} < backend/migrations/seeds/dev.sql

## sqlc: generate typed repositories from queries/*.sql
sqlc:
	cd backend && sqlc generate

build:
	cd backend && go build ./...

test:
	cd backend && go test -race ./...

fmt:
	cd backend && gofmt -l -w .

tidy:
	cd backend && go mod tidy
