# Adaptive Learning Platform API

Backend starter for the Adaptive Learning Platform graduation project.

## Start Here — Notch Demo

AdaptLearn's Phase 1 Notch Demo is a frontend-only, interactive simulation of two courses: **Introduction to Python** and **Mathematics**. It connects the Student portal (Menna), Instructor portal (Omar), and Academic Advisor portal (Mahmoud) using fictional shared data and simulated behavior. It does not require a real AI engine or backend.

The proposed frontend stack is Next.js App Router, React, TypeScript, Tailwind CSS, shared components, Zustand or React Context, local mock fixtures and Vercel; these are proposals for team agreement. Start with the [demo agreement](Notch%20Demo/DEMO-AGREEMENTS.md), [screen map](Notch%20Demo/SCREEN-MAP.md), [mock-data contract](Notch%20Demo/MOCK-DATA-CONTRACT.md), and [collaboration rules](Notch%20Demo/RULES.md). Portal tasks: [Menna](Notch%20Demo/Student-Menna/TASKS.md), [Omar](Notch%20Demo/Instructor-Omar/TASKS.md), [Mahmoud](Notch%20Demo/Advisor-Mahmoud/TASKS.md).

Use the [Linear project](https://linear.app/adaptive-learning/project/notch-demo-phase-1-ui-prototype-0e80fac4810c) for assigned work, progress, submission evidence and review; GitHub is the source of code and documentation. Submit a PR or commit link, screenshots or video, completed screens, testing notes and known gaps on the assigned issue. Done requires acceptance and review. See the [Notch Demo guide](Notch%20Demo/README.md).

## Existing Django backend

## Team-approved stack

- Python 3.14
- Django 5.2 LTS
- Django REST Framework
- PostgreSQL 16
- Docker Compose for local development

React is the client. The backend exposes a versioned JSON API under `/api/v1/`.

## Start locally

1. Copy `.env.example` to `.env` and adjust values if needed.
2. Start the database: `docker compose up -d db`
3. Create and activate a virtual environment, then install dependencies:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
   pip install -r requirements.txt
   ```

4. Run migrations and start Django:

   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

The health endpoint is `GET /api/v1/health/`. Django admin is at `/admin/`.

## Project layout

- `config/`: project settings and root URL configuration
- `apps/core/`: shared API endpoints and app infrastructure
- `docs/`: architecture, database schema, and API decisions

## Team decisions to confirm

- Decide authentication approach and roles (student, instructor, administrator).
- Approve the database schema and interaction-event contract before pilot data collection.
- Do not add real student data or secrets to Git.

The initial schema and interaction-event proposal is in [`docs/database-schema.md`](docs/database-schema.md).

## Configuration

Settings are read from environment variables. `.env` is local-only and ignored by Git; commit changes to `.env.example` when configuration requirements change.
