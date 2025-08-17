# Medora Monorepo - Setup & Run Guide

This guide will help you set up and run the full-stack Medora application (Next.js frontend + FastAPI backend) locally and in production.

---

## Prerequisites
- [Docker](https://www.docker.com/products/docker-desktop/) installed
- [Node.js](https://nodejs.org/) (if running frontend locally without Docker)
- [Python 3.13+](https://www.python.org/) (if running backend locally without Docker)

---

## 1. Clone the Repository
```sh
git clone <repo-url>
cd medora
```

---

## 2. Environment Variables

### Frontend (`apps/web`)
- Copy `.env.local.example` to `.env.local` (if example exists) or create `.env.local`:
  ```env
  NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
  ```
  - For production, set `NEXT_PUBLIC_BACKEND_URL` to your deployed backend URL (e.g., `https://api-xxxx.onrender.com`).

### Backend (`apps/api`)
- If needed, create a `.env` file for backend config (see `pyproject.toml` or `requirements.txt` for dependencies).

---

## 3. Run with Docker (Recommended)
Install the dependencies once after `git clone`
```sh
cd apps/web
npm install
```
```sh
cd apps/api
pip install -r requirements.txt
```
From the project root:
```sh
docker-compose up --build
```
- This will build and start both the frontend (Next.js) and backend (FastAPI) services.
- Frontend: http://localhost:3000
- Backend: http://localhost:8000

To stop:
```sh
docker-compose down
```

---

## 4. Run Frontend & Backend Locally (Without Docker, not recomended)

### Backend (FastAPI)
```sh
cd apps/api
python -m venv .venv
.\.venv\Scripts\activate # for Windows
source .venv/Scripts/activate # for macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (Next.js)
```sh
cd apps/web
npm install
npm run dev
```
- Visit http://localhost:3000

---

## 5. Deployment

- Set environment variables in your hosting provider (Render, Vercel, etc.)
- Make sure `NEXT_PUBLIC_BACKEND_URL` is set to your backend's public URL in the frontend environment.
- Deploy backend and frontend as separate services if needed.