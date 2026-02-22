# ────────────────────────────────────────────────────────────────
#  GrowthGrid – developer convenience targets
# ────────────────────────────────────────────────────────────────

.PHONY: lint format lint-fix test hooks-install hooks-run

# ── Backend ──────────────────────────────────────────────────────
backend-lint:
	uv run --directory backend ruff check backend/

backend-format:
	uv run --directory backend ruff format backend/

backend-lint-fix:
	uv run --directory backend ruff check --fix backend/

backend-test:
	uv run --directory backend pytest backend/tests -x -q

# ── Frontend ─────────────────────────────────────────────────────
frontend-lint:
	cd frontend && npm run lint

frontend-lint-fix:
	cd frontend && npm run lint:fix

frontend-format:
	cd frontend && npm run format

frontend-format-check:
	cd frontend && npm run format:check

# ── Combined ─────────────────────────────────────────────────────
lint: backend-lint frontend-lint

format: backend-format frontend-format

lint-fix: backend-lint-fix frontend-lint-fix

test: backend-test

# ── Hooks ────────────────────────────────────────────────────────
hooks-install:
	uv run --directory backend pre-commit install --hook-type pre-commit --hook-type pre-push

hooks-run:
	uv run --directory backend pre-commit run --all-files

hooks-update:
	uv run --directory backend pre-commit autoupdate
