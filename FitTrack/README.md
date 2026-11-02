# FitTrack — Fitness & Workout Management Platform

Full-stack starter project covering Modules 1–6:
1. Authentication (registration, bcrypt password hashing, JWT, protected pages/API)
2. Workout CRUD
3. Daily progress dashboard
4. Goal creation and progress updates
5. Weekly/monthly reports and chart
6. Notifications (daily reminder generated when notifications are opened; goal-completion alert)

## Requirements
- Windows 10/11
- VS Code
- Python 3.11 or 3.12 recommended
- Node.js LTS (includes npm)

## Open in VS Code
1. Extract `FitTrack.zip`.
2. Open VS Code → File → Open Folder → select `FitTrack`.
3. Open two terminals: one for backend and one for frontend.

## Start backend (Terminal 1 — PowerShell)
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```
Open `backend/.env`; replace `SECRET_KEY` with a long random value. Then:
```powershell
uvicorn app.main:app --reload
```
Check `http://127.0.0.1:8000/docs`.

## Start frontend (Terminal 2 — PowerShell)
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```
Open the URL printed by Vite, normally `http://localhost:5173`.

## Test in browser
1. Register a new account.
2. Log in.
3. Add Cardio, Strength, or Yoga workouts.
4. Dashboard shows today's workout count, calories, and minutes.
5. Create a goal, then update its progress.
6. Reports shows a 7-day calorie chart and current-month totals.
7. Open Notifications to create/check the daily reminder; completing a goal creates an alert.

## API routes
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/workouts`, `GET /api/workouts`, `PUT /api/workouts/{id}`, `DELETE /api/workouts/{id}`
- `GET /api/progress/daily?day=YYYY-MM-DD`
- `POST /api/goals`, `GET /api/goals`, `PATCH /api/goals/{id}`, `DELETE /api/goals/{id}`
- `GET /api/reports/weekly`, `GET /api/reports/monthly?year=2026&month=11`
- `GET /api/notifications`, `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`

## Notes
- Each workout, goal, and notification is filtered by the authenticated user's ID; users cannot access another user's records by changing an ID.
- SQLite database is created as `backend/fittrack.db` when the backend starts.
- Daily reminders are generated on demand when the user opens Notifications; this is a simple demo trigger, not a background scheduler/push notification service.
- This is a learning/demo baseline. Before production, add rate limiting, email verification, password reset, migrations (Alembic), HTTPS, stronger secret management, tests, and a real scheduled notification worker.
