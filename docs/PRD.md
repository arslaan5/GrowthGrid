# 📘 Product Requirements Document (PRD)

## Product Name (Working Title)

**GrowthGrid**

---

# 1️⃣ Overview

## 1.1 Product Summary

GrowthGrid is a personal web-based learning tracker that allows users to:

- Log daily learning entries
- Tag topics
- Attach files and links
- View entries via calendar
- Visualize learning consistency via a GitHub-style heatmap
- Track analytics such as streaks and most-used tags

It is a secure, multi-user, analytics-driven learning journal.

---

## 1.2 Problem Statement

Currently, learning logs are maintained in a Word document:

- No structured search
- No analytics
- No tag filtering
- No visualization
- No streak tracking
- No structured storage

GrowthGrid solves this by transforming daily text-based logging into a structured, queryable, and visual system.

---

## 1.3 Goals

### Primary Goals

- Replace Word-based tracking
- Enable structured daily logging
- Provide analytics and streak tracking
- Maintain secure access
- Keep implementation simple and clean

### Secondary Goals

- Portfolio-worthy architecture
- Async backend
- Clean UI system
- Cloud storage integration

---

# 2️⃣ Target User

## Primary User

- Authenticated user
- Technically proficient
- Logs learning daily

Multi-user support required in MVP.

---

# 3️⃣ Functional Requirements

---

# 3.1 Authentication

### FR-A1: User Registration

- Users can register with email + password
- Password must be hashed (bcrypt)

### FR-A2: Login

- User can login
- System issues JWT
- JWT stored in HTTP-only cookie

### FR-A3: Protected Routes

- All dashboard routes require authentication
- Unauthorized access returns 401

### FR-A4: Logout

- Clear authentication cookie

---

# 3.2 Entry Management

### FR-E1: Create Entry

User can:

- Select date
- Add title (optional)
- Add markdown content
- Add tags
- Add links
- Upload files

### FR-E2: Edit Entry

- Modify any field
- Update tags
- Remove attachments

### FR-E3: Delete Entry

- Permanently delete entry and related metadata

### FR-E4: View Entries

- View entries by specific date
- View entry details by ID
- List entries chronologically

### FR-E5: Multiple Entries Per Day

- System allows more than one entry per date

---

# 3.3 Tag System

### FR-T1: Create Tags Automatically

- New tag created if not existing

### FR-T2: Reuse Tags

- Existing tags reused

### FR-T3: Tag Analytics

- Track frequency of tag usage

---

# 3.4 File Attachments

### FR-F1: Upload File

- Upload to Backblaze B2
- Store file URL in DB

### FR-F2: Display Attachment

- Show file name
- Provide clickable download link

### FR-F3: Delete Attachment

- Remove metadata
- (Optional future: remove from B2)

---

# 3.5 Link Attachments

### FR-L1: Add Link

- Store title + URL

### FR-L2: View Link

- Clickable from entry

---

# 3.6 Calendar View

### FR-C1: Monthly Calendar

- Display standard calendar UI

### FR-C2: Click Date

- Show entries for selected date

---

# 3.7 Heatmap Visualization

### FR-H1: Heatmap Display

- GitHub-style grid
- Each day represented

### FR-H2: Heatmap Metric

- Color intensity based on number of entries

### FR-H3: Clickable Day

- Clicking opens that day's entries

---

# 3.8 Analytics Dashboard

### FR-AN1: Summary Metrics

Display:

- Total entries
- Current streak
- Longest streak
- Most used tag
- Entries this month

### FR-AN2: Heatmap Data Endpoint

Backend must return:

- date
- count

---

# 4️⃣ Non-Functional Requirements

---

## 4.1 Performance

- API response time < 500ms (normal queries)
- Heatmap query optimized with index

---

## 4.2 Security

- Passwords hashed
- JWT expiration enforced
- HTTP-only cookies
- No sensitive data in frontend storage

---

## 4.3 Scalability

- Designed for multi-user from MVP
- Schema supports multi-user with per-user data isolation
- Async DB connection

---

## 4.4 Reliability

- File upload failure handled gracefully
- Transactions atomic for entry creation

---

# 5️⃣ Technical Constraints

---

## Backend

- Python 3.13 with uv (package manager)
- FastAPI (async)
- SQLAlchemy async
- asyncpg
- PyJWT
- bcrypt
- Alembic
- pytest + httpx (testing)

## Database

- Neon (Postgres)

## Storage

- Backblaze B2

## Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- npm (package manager)
- Dark mode (included from MVP)
- vitest (testing)

---

# 6️⃣ Data Model Summary

Core Entities:

- User
- Entry
- Tag
- EntryTag
- Attachment
- Link

Relational mapping required for:

- Many-to-many tags
- One-to-many attachments
- One-to-many links

---

# 7️⃣ API Contract Overview

---

## Auth

POST /auth/register
POST /auth/login
POST /auth/logout
GET /auth/me

---

## Entries

POST /entries
GET /entries?date=YYYY-MM-DD
GET /entries/{id}
PUT /entries/{id}
DELETE /entries/{id}

---

## Analytics

GET /analytics/summary
GET /analytics/heatmap

---

## Uploads

POST /uploads

---

# 8️⃣ UX Requirements

---

## Dashboard Layout

- Sidebar navigation
- Summary cards
- Heatmap section
- Calendar section
- Entry list panel
- Dark mode toggle (header or sidebar)

---

## Entry Form

- Markdown editor
- Tag input
- File upload component
- Link input component
- Save button

---

# 9️⃣ MVP Scope

MVP includes:

- Auth (multi-user registration + login)
- CRUD
- Tags
- Calendar
- Heatmap
- Basic analytics
- File upload
- Links
- Dark mode
- Unit tests (backend + frontend)

Excludes:

- AI summaries
- Search
- Export
- Deployment configs

---

# 🔟 Risks & Mitigation

| Risk                 | Mitigation                |
| -------------------- | ------------------------- |
| Async complexity     | Keep service layer simple |
| File upload failures | Validate + error handling |
| Streak logic errors  | Unit test streak function |
| JWT expiry confusion | Clear cookie on expiry    |

---

# 11️⃣ Success Criteria

The product is successful if:

- You can log daily learning securely
- View entries by date
- See consistency graph
- Track streaks
- Attach resources
- Use it daily instead of Word

---

# 12️⃣ Future Roadmap (Post-MVP)

- Full-text search (Postgres tsvector)
- AI weekly summary
- Export to markdown
- Email reminders
- Tag trends chart
- Public read-only share mode

---

# 🧠 Final Note

This PRD is:

- Clearly scoped
- Technically feasible
- Realistic for solo build
- Extensible
- Production-structured
