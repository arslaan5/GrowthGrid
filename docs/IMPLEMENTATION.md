# 🏗 0. Final Architecture Overview

```text
Frontend (Next.js + shadcn)
        ↓
FastAPI (async, JWT auth)
        ↓
Neon Postgres (asyncpg)
        ↓
Backblaze B2 (attachments)
```

Async all the way down.

---

# 🧭 1. Implementation Phases

We’ll divide into 7 phases:

1. Project Setup
2. Database & Models
3. Authentication System
4. Entry CRUD
5. File Upload System
6. Analytics Engine
7. Frontend Integration

Each phase builds on the previous.

---

# 🧱 PHASE 1 — Project Setup (Day 0)

## Backend Setup

### 1️⃣ Create FastAPI project

- Use `uv` as package manager (Python 3.13)
- Initialize project with `uv init`
- Install dependencies via `uv add`:
  - fastapi
  - uvicorn
  - sqlalchemy[asyncio]
  - asyncpg
  - alembic
  - pydantic
  - pydantic-settings
  - pyjwt
  - bcrypt
  - boto3
  - python-dotenv
  - pytest (dev)
  - httpx (dev)
  - pytest-asyncio (dev)

### 2️⃣ Setup Project Structure

Create folders:

```
app/
  core/
  db/
  models/
  schemas/
  api/
  services/
```

---

### 3️⃣ Setup Async Database

- Configure `DATABASE_URL` built from individual env vars:
  - `DB_HOST`
  - `DB_DATABASE`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_SSLMODE`
  - `DB_CHANNELBINDING`
- Format: `postgresql+asyncpg://{user}:{password}@{host}/{database}?ssl={sslmode}`
- Create async engine
- Create async session maker
- Dependency injection: `get_db()`

---

### 4️⃣ Setup Alembic

- Initialize alembic
- Configure async migration
- Connect to Neon
- Create first migration

Deliverable:

- Working DB connection
- Migration system operational

---

# 🗄 PHASE 2 — Database & Data Modeling

We define relational schema properly.

---

## 2.1 Tables

### users

- id (UUID)
- email (unique)
- hashed_password
- created_at

---

### entries

- id (UUID)
- user_id (FK)
- date (DATE, indexed)
- title
- content (TEXT)
- created_at
- updated_at

---

### tags

- id (UUID)
- name (unique)

---

### entry_tags

- entry_id (FK)
- tag_id (FK)
- Composite PK

---

### attachments

- id (UUID)
- entry_id (FK)
- file_name
- file_url
- uploaded_at

---

### links

- id (UUID)
- entry_id (FK)
- title
- url

---

## 2.2 Index Strategy

Add indexes for:

- entries.date
- entries.user_id
- tags.name
- entry_tags.entry_id

This ensures fast heatmap + analytics queries.

Deliverable:

- All models defined
- Migration generated
- Tables created in Neon

---

# 🔐 PHASE 3 — Authentication System

We build secure but simple JWT auth.

---

## 3.1 Security Utilities

In `core/security.py`:

- hash_password()
- verify_password()
- create_access_token()
- decode_token()

Using:

- bcrypt
- PyJWT

---

## 3.2 Auth Service

`services/auth_service.py`

Functions:

- register_user()
- authenticate_user()
- get_current_user()

---

## 3.3 Auth API Routes

`api/auth.py`

Endpoints:

- POST /auth/register
- POST /auth/login
- POST /auth/logout
- GET /auth/me

---

## 3.4 JWT Strategy

- Token expiry: 7 days
- Store in HTTP-only cookie
- HS256 algorithm

---

Deliverable:

- User can register
- User can login
- Protected routes work
- Unauthorized requests blocked

---

# 📝 PHASE 4 — Entry CRUD

Now the core of the app.

---

## 4.1 Entry Schemas

Create:

- EntryCreate
- EntryUpdate
- EntryResponse

Handle:

- tags (list[str])
- links (list)
- attachments (optional)

---

## 4.2 Entry Service

In `entry_service.py`:

Functions:

- create_entry()
- update_entry()
- delete_entry()
- get_entries_by_date()
- get_entry_by_id()
- list_entries()

Handle:

- Tag creation if not exists
- Many-to-many mapping
- Atomic transactions

---

## 4.3 Entry API Routes

`api/entries.py`

Endpoints:

- POST /entries
- GET /entries?date=YYYY-MM-DD
- GET /entries/{id}
- PUT /entries/{id}
- DELETE /entries/{id}

---

Deliverable:

- Full CRUD operational
- Tags working
- Multiple entries per day supported

---

# 📎 PHASE 5 — File Upload (Backblaze B2)

---

## 5.1 Storage Service

`services/storage_service.py`

- upload_file()
- delete_file()

Use boto3 with:

- Custom endpoint
- Access key
- Secret key
- Bucket name

---

## 5.2 Upload API

`api/uploads.py`

Endpoint:

- POST /uploads

Flow:

- Receive file
- Upload to B2
- Return file URL
- Store metadata in DB

---

Deliverable:

- File upload working
- Attachment metadata saved

---

# 📊 PHASE 6 — Analytics Engine

This makes the app interesting.

---

## 6.1 Heatmap Endpoint

`GET /analytics/heatmap`

Query:

```sql
SELECT date, COUNT(*)
FROM entries
WHERE user_id = ?
GROUP BY date;
```

Return:

```json
[{ "date": "2026-02-20", "count": 2 }]
```

---

## 6.2 Summary Endpoint

`GET /analytics/summary`

Return:

- total_entries
- current_streak
- longest_streak
- most_used_tag
- entries_this_month

---

## 6.3 Streak Algorithm

- Fetch distinct dates sorted DESC
- Compare sequential days
- Count consecutive

Keep logic in service layer.

---

Deliverable:

- Heatmap data functional
- Summary metrics correct

---

# 🖥 PHASE 7 — Frontend Implementation

---

## 7.1 Project Setup

- Create Next.js app
- Install shadcn/ui
- Setup layout
- Setup theme

---

## 7.2 Auth UI

Pages:

- /login
- /register
- Middleware for protected routes

API helper:

- Axios instance with credentials: true

---

## 7.3 Dashboard Layout

Structure:

```
Sidebar
Top header
Main content area
```

Components:

- Summary cards
- Heatmap
- Calendar
- Entry list

---

## 7.4 Entry Form

Features:

- Markdown editor
- Tag input
- Link input
- File upload
- Date picker

---

## 7.5 Calendar View

- Click date
- Fetch entries for that date
- Display list

---

## 7.6 Heatmap

Use:

- react-calendar-heatmap
- Map backend response

---

Deliverable:

- Fully usable UI
- Responsive layout
- Dark mode included from MVP

---

# 🧪 PHASE 8 — Testing & Hardening

## 8.1 Backend Testing

- pytest + httpx for async API tests
- pytest-asyncio for async test support
- Test auth flow (register, login, protected routes)
- Test entry CRUD operations
- Test analytics endpoints
- Test file upload

## 8.2 Frontend Testing

- vitest for unit tests
- Test component rendering
- Test API integration helpers

## 8.3 Hardening

- Validate inputs
- Handle 401 globally
- Error boundaries
- Toast notifications
- Loading states
- Empty states

---

# 🚀 PHASE 9 — Deployment

Backend:

- Deploy to Render or Railway
- Set environment variables

Frontend:

- Deploy to Vercel
- Configure API URL

Test:

- Auth flow
- CRUD
- File upload
- Analytics

---

# ⏳ Realistic Timeline

If focused:

Backend:

- 1.5 days

Frontend:

- 1.5 days

Polish + Deploy:

- 1 day

Total: ~3–4 focused days

---

# 🎯 Success Criteria

App should allow you to:

- Log in securely
- Create daily learning entries
- Attach files & links
- Tag topics
- View calendar history
- See GitHub-style learning graph
- Track streaks
- View analytics

---

# 🧠 Optional Stretch Goals (Later)

- Weekly AI summary
- Export to markdown
- Email reminders
- Tag analytics chart
- Search by keyword
- Full-text search using Postgres
