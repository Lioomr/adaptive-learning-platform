# Adaptive Learning Platform API

Backend starter for the Adaptive Learning Platform graduation project.

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
