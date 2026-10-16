# Optimark CMS Frontend

Next.js management dashboard for the Optimark Headless CMS. Features bilingual article editing (Indonesian & English), live preview sync, Cloudflare R2 media asset manager with real-time alt text synchronization, and blog comment moderation.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI & Styling**: Tailwind CSS, Lucide Icons
- **Markdown / Rich Editor**: Custom Markdown editor with live preview, word counter, and bilingual tab switching
- **State & HTTP**: Native Fetch with JWT bearer token stored in localStorage
- **Package Manager**: pnpm

---

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:3001/api` | Base URL of the NestJS CMS Backend API |
| `NEXT_PUBLIC_LANDING_URL` | No | `http://localhost:3000` | URL of the public landing page (used for article preview links) |
| `PORT` | No | `3002` | Local development port |

> **Note on Next.js `NEXT_PUBLIC_*` Variables:**
> Since Next.js bakes `NEXT_PUBLIC_*` variables into client-side JavaScript bundles at compile time, make sure these are passed as `ARG` or environment variables during the Docker build stage.

---

## Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp .env.example .env.local
# Verify NEXT_PUBLIC_API_URL points to your running backend (default: http://localhost:3001/api)

# 3. Start development server
pnpm dev
```

Open [http://localhost:3002](http://localhost:3002) in your browser.

---

## Production Deployment (Docker)

The provided `Dockerfile` uses a multi-stage standalone build for small image size and fast startup.

```bash
# Build image (pass production backend URL as build-arg)
docker build \
  --build-arg NEXT_PUBLIC_API_URL="https://api-cms.optimark.ai/api" \
  --build-arg NEXT_PUBLIC_LANDING_URL="https://optimark.ai" \
  -t optimark-cms-frontend:latest .

# Run container
docker run -d \
  --name optimark-cms-frontend \
  -p 3002:3000 \
  optimark-cms-frontend:latest
```

---

## Key Features & Routes

- `/login` - Authentication screen with persistent session check.
- `/articles` - Article directory with search, category filtering, and status badges (Draft / Scheduled / Published).
- `/articles/new` & `/articles/[id]` - Bilingual markdown editor with:
  - Synchronized ID & EN content tabs.
  - Slug conflict and format validation.
  - Cover image selector with live alt-text sync across locales.
  - Table of Contents generator preview.
- `/media` - Cloudflare R2 media library (WebP uploads, dimension inspections, and alt-text updates).
- `/comments` - Moderation queue (Approve, Spam, Reject, Delete) for user-submitted blog comments.
- `/people` - Authors and Reviewers management for E-E-A-T search engine credibility.
