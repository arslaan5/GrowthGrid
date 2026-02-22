# GrowthGrid

A personal learning tracker built with a modern full-stack architecture.
GrowthGrid helps you log daily learning, track consistency, visualize progress, and analyze your learning patterns.

---

## ✨ Features

### 🔐 Authentication

- Secure login & registration
- JWT-based authentication (HTTP-only cookies)
- Password hashing with bcrypt

### 📝 Learning Entries

- Create, edit, delete entries
- Multiple entries per day
- Markdown support
- Tagging system
- Attach links and files

### 📅 Calendar View

- Monthly calendar
- Click a date to view entries
- Structured daily browsing

### 📊 Analytics

- GitHub-style heatmap
- Current streak
- Longest streak
- Total entries
- Most-used tag
- Monthly activity summary

### 🌙 Dark Mode

- System-aware dark/light theme
- Manual toggle support

### 📎 File Attachments

- Upload files to Backblaze B2
- Store metadata in Postgres
- Secure backend upload handling

---

# 🏗 Tech Stack

## Frontend

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- react-markdown
- react-calendar
- react-calendar-heatmap
- npm (package manager)
- vitest (testing)

## Backend

- Python 3.13
- uv (package manager)
- FastAPI (async)
- SQLAlchemy 2.0 (async)
- asyncpg
- Alembic
- PyJWT
- bcrypt
- boto3
- pytest + httpx (testing)

## Database

- Neon (PostgreSQL)

## Storage

- Backblaze B2 (S3-compatible)

## Deployment

- Frontend: Vercel
- Backend: Render / Railway
- Database: Neon
- Storage: Backblaze B2

---

# 🏛 Architecture

```
Next.js (Frontend)
        ↓
FastAPI (Backend)
        ↓
Neon (Postgres)
        ↓
Backblaze B2 (File Storage)
```

Async end-to-end backend architecture.

---

# 📦 Project Structure

## Backend

```
app/
 ├── main.py
 ├── core/
 │     ├── config.py
 │     ├── security.py
 ├── db/
 │     ├── session.py
 │     ├── base.py
 ├── models/
 ├── schemas/
 ├── api/
 │     ├── auth.py
 │     ├── entries.py
 │     ├── analytics.py
 │     ├── uploads.py
 ├── services/
 │     ├── auth_service.py
 │     ├── entry_service.py
 │     ├── analytics_service.py
 │     ├── storage_service.py
```

## Frontend

```
app/
 ├── login/
 ├── register/
 ├── dashboard/
 │     ├── page.tsx
 │     ├── heatmap.tsx
 │     ├── calendar.tsx
 │     ├── entry-form.tsx
 ├── entry/[id]/
 ├── components/
 ├── lib/
 │     ├── api.ts
 │     ├── auth.ts
```

---

# 🔐 Authentication Flow

1. User registers
2. Password hashed with bcrypt
3. Login generates JWT
4. JWT stored in HTTP-only cookie
5. Protected routes require valid token

---

# 📊 Analytics Logic

- Heatmap groups entries by date
- Streak calculated from distinct sorted entry dates
- Most-used tag computed via aggregation query
- Monthly entries computed via date filtering

---

# 🧪 Future Improvements

- Full-text search (Postgres tsvector)
- AI weekly summary
- Export to markdown
- Email reminders
- Tag trends chart
- Public read-only share mode

---

# 🎯 Project Goals

- Replace manual doc-based tracking
- Track learning consistency
- Provide structured analytics
- Maintain clean and modern architecture
- Serve as a portfolio-level full-stack project

---

# 👤 Author

[Arslaan Siddiqui](https://github.com/arslaan5)
