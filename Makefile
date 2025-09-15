# -------- One-command bootstrap for dev/build --------
SHELL := /bin/bash
.DEFAULT_GOAL := dev

FRONTEND_DIR := frontend
GOPATH := $(shell go env GOPATH 2>/dev/null)
WAILS  := $(GOPATH)/bin/wails
# pick docker compose flavor
DC := $(shell if docker compose version >/dev/null 2>&1; then echo "docker compose"; \
             elif docker-compose version >/dev/null 2>&1; then echo "docker-compose"; \
             else echo ""; fi)

.PHONY: dev build ensure ensure-tools ensure-go ensure-node ensure-wails ensure-frontend \
        ensure-env db-up db-wait migrate db-stop db-reset clean

# ---- meta targets ----
ensure: ensure-tools ensure-frontend ensure-env
	@echo "✓ Environment ready"

ensure-tools: ensure-docker ensure-go ensure-node ensure-wails
	@true

ensure-env:
	@ if [ ! -f .env ] && [ -f .env.example ]; then \
	    echo "→ Creating .env from .env.example"; cp .env.example .env; \
	  fi

# ---- tool checks / bootstrap ----
ensure-docker:
	@ command -v docker >/dev/null || { echo "✗ Docker is required"; exit 1; }
	@ docker info >/dev/null 2>&1 || { echo "✗ Docker daemon not running"; exit 1; }
	@ [ -n "$(DC)" ] || { echo "✗ 'docker compose' or 'docker-compose' is required"; exit 1; }

ensure-go:
	@ command -v go >/dev/null || { echo "✗ Go is required: https://go.dev/dl/"; exit 1; }
	@ echo "→ go mod download"; go mod download

ensure-node:
	@ command -v node >/dev/null || { echo "✗ Node.js is required: https://nodejs.org/"; exit 1; }
	@ command -v npm  >/dev/null || { echo "✗ npm is required (comes with Node.js)"; exit 1; }

ensure-wails: ensure-go
	@ if [ ! -x "$(WAILS)" ]; then \
	    echo "→ Installing Wails CLI to $(WAILS)"; \
	    GOFLAGS= GO111MODULE=on go install github.com/wailsapp/wails/v2/cmd/wails@latest || exit 1; \
	  fi

ensure-frontend: ensure-node
	@ if [ -d "$(FRONTEND_DIR)" ]; then \
	    echo "→ Installing frontend deps"; \
	    cd "$(FRONTEND_DIR)" && ( [ -d node_modules ] || npm ci || npm install ); \
	  fi

# ---- database via docker compose ----
db-up: ensure-docker
	@ $(DC) up -d db

db-wait:
	@ echo "→ Waiting for Postgres (healthcheck)…"; \
	CID="$$( $(DC) ps -q db )"; \
	if [ -z "$$CID" ]; then echo "✗ 'db' service is not running"; exit 1; fi; \
	for i in $$(seq 1 60); do \
	  STATUS="$$(docker inspect -f '{{.State.Health.Status}}' $$CID 2>/dev/null || echo none)"; \
	  if [ "$$STATUS" = "healthy" ]; then echo "✓ Postgres is healthy"; exit 0; fi; \
	  if [ "$$STATUS" = "unhealthy" ]; then echo "✗ Postgres is UNHEALTHY"; docker logs $$CID; exit 1; fi; \
	  sleep 1; \
	done; \
	echo "✗ Postgres not healthy in time"; docker logs $$CID | tail -n 200; exit 1


migrate:
	@ echo "→ Applying migrations"; \
	$(DC) cp migrations db:/migrations >/dev/null 2>&1 || true; \
	$(DC) exec -it db psql -U postgres -d todolist -f /migrations/init.sql

db-stop: ; @ $(DC) stop db
db-reset: db-stop
	@ $(DC) rm -f db || true
	@ if docker volume ls -q | grep -q '^todolist_dbdata$$'; then docker volume rm todolist_dbdata || true; fi
	@ $(MAKE) db-up db-wait migrate

# ---- dev / build ----
dev: ensure db-up db-wait migrate
	@ echo "→ Starting Wails dev"; \
	  "$(WAILS)" dev

build: ensure db-up db-wait migrate
	@ echo "→ Building Wails app"; \
	  "$(WAILS)" build
