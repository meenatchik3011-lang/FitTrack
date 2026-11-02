 
# FitTrack – Fitness & Workout Management Platform

A full-stack fitness and workout management application built using **FastAPI, React, SQLite, and Python**.

FitTrack helps users manage workouts, track daily fitness progress, set personal fitness goals, view reports, and receive notifications.

---

## 1. Project Overview

**Project Name:** FitTrack

**Project Type:** Fitness & Workout Management Platform

**Architecture:** Full Stack Application

### Technologies Used

| Technology | Purpose |
|---|---|
| Python | Backend programming |
| FastAPI | REST API development |
| SQLAlchemy | Database ORM |
| SQLite | Database |
| Pydantic | Data validation |
| JWT | User authentication |
| bcrypt | Password hashing |
| React.js | Frontend development |
| Vite | Frontend development server |
| Axios | API communication |
| React Router | Frontend navigation |
| Recharts | Data visualization |
| CSS | UI styling |

---

## 2. Project Folder Structure

```text
FitTrack/
│
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── security.py
│   │
│   ├── .env
│   ├── requirements.txt
│   └── fittrack.db
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── style.css
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

---

## 3. Modules Implemented

### MODULE 1 – User Authentication

**Objective:** Provide secure user registration and login.

Features:
- User registration
- User login
- Password hashing using bcrypt
- JWT-based authentication
- Protected API endpoints
- Current user profile

API Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### MODULE 2 – Workout Management

**Objective:** Allow users to manage their workout activities.

Features:
- Add workout
- View all workouts
- Edit workout
- Delete workout
- Workout categories
- Workout duration
- Calories burned
- Workout date

API Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/workouts` | Add workout |
| GET | `/api/workouts` | View workouts |
| PUT | `/api/workouts/{workout_id}` | Update workout |
| DELETE | `/api/workouts/{workout_id}` | Delete workout |

Workout categories:
- Cardio
- Strength
- Yoga

### MODULE 3 – Daily Progress Tracking

**Objective:** Track daily fitness activities.

Features:
- Total workouts per day
- Total calories burned
- Total workout duration
- Date-based progress tracking
- Dashboard statistics

API Endpoint:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/progress/daily` | Get daily progress |

Example:

```text
GET /api/progress/daily?day=2026-11-02
```

Example response:

```json
{
  "date": "2026-11-02",
  "total_workouts": 3,
  "total_calories": 750,
  "total_duration": 150
}
```

### MODULE 4 – Goal Setting System

**Objective:** Help users create and track fitness goals.

Features:
- Create fitness goals
- View goals
- Update goal progress
- Delete goals
- Track target and current values
- Automatic goal completion status
- Goal completion notifications

Goal statuses:
- IN_PROGRESS
- COMPLETED

API Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/goals` | Create goal |
| GET | `/api/goals` | View goals |
| PATCH | `/api/goals/{goal_id}` | Update goal progress |
| DELETE | `/api/goals/{goal_id}` | Delete goal |

Available goal types:
- Weight Loss
- Muscle Gain
- Steps

### MODULE 5 – Reports and Analytics

**Objective:** Provide workout reports and fitness analytics.

Features:
- Weekly workout report
- Monthly workout summary
- Total calories burned
- Total workout duration
- Weekly calories chart
- Weekly workout details

API Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports/weekly` | Weekly report |
| GET | `/api/reports/monthly` | Monthly report |

Example:

```text
GET /api/reports/monthly?year=2026&month=11
```

### MODULE 6 – Notifications System

**Objective:** Notify users about important fitness activities.

Features:
- Goal completion notifications
- Daily workout reminders
- View all notifications
- Mark individual notification as read
- Mark all notifications as read
- Display unread notification count
- Notification badge in navigation

API Endpoints:

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/unread-count` | Get unread count |
| PATCH | `/api/notifications/{notification_id}/read` | Mark one as read |
| PATCH | `/api/notifications/read-all` | Mark all as read |

---

## 4. Database Structure

FitTrack uses SQLite with SQLAlchemy ORM.

Main database tables:

| Table | Purpose |
|---|---|
| users | Stores user information |
| workouts | Stores workout activities |
| goals | Stores fitness goals |
| notifications | Stores user notifications |

The database file is:

```text
backend/fittrack.db
```

The database tables are initialized automatically through SQLAlchemy when the FastAPI application starts.

---

## 5. Backend Installation and Setup

### Step 1 – Open the project

Open the FitTrack project folder in VS Code.

### Step 2 – Open the backend terminal

```powershell
cd backend
```

### Step 3 – Create virtual environment

```powershell
python -m venv .venv
```

### Step 4 – Activate virtual environment

```powershell
.\.venv\Scripts\Activate.ps1
```

### Step 5 – Install dependencies

```powershell
pip install -r requirements.txt
```

### Step 6 – Start FastAPI server

```powershell
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger API documentation:

```text
http://127.0.0.1:8000/docs
```

---

## 6. Frontend Installation and Setup

### Step 1 – Open another terminal

```powershell
cd frontend
```

### Step 2 – Install dependencies

```powershell
npm install
```

### Step 3 – Start React application

```powershell
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## 7. API Configuration

The frontend communicates with the backend using Axios.

File:

```text
frontend/src/api.js
```

API base URL:

```javascript
http://127.0.0.1:8000/api
```

JWT authentication token is stored in browser localStorage using:

```text
fittrack_token
```

Axios automatically attaches the token to API requests.

---

## 8. Application Features

### Dashboard
- Today's workouts
- Calories burned
- Workout duration
- Recent workouts

### Workout Management
- Add workouts
- Edit workouts
- Delete workouts
- View workout history

### Goals
- Create fitness goals
- Track progress
- Monitor completion status

### Reports
- Weekly workout statistics
- Monthly fitness statistics
- Calories burned chart

### Notifications
- Daily workout reminders
- Goal completion alerts
- Unread notification count
- Mark as read functionality

---

## 9. Testing

Testing can be performed using FastAPI Swagger documentation and the React frontend.

### Module 1 Testing
- Register a new account.
- Login using registered credentials.
- Verify JWT token generation.
- Access protected endpoints.

### Module 2 Testing
- Add a workout.
- View workout records.
- Edit a workout.
- Delete a workout.

### Module 3 Testing
- Add workouts for the current date.
- Open Dashboard.
- Verify workout count.
- Verify calories and duration.

### Module 4 Testing
- Create a fitness goal.
- Update goal progress.
- Verify goal completion status.
- Check goal completion notification.

### Module 5 Testing
- Open Reports.
- Verify weekly report.
- Verify monthly statistics.
- Check calories chart.

### Module 6 Testing
- Create a completed fitness goal.
- Open Notifications.
- Verify goal completion alert.
- Check unread notification count.
- Mark one notification as read.
- Mark all notifications as read.
- Verify unread count becomes zero.

---

## 10. Running the Application

Two terminals are required.

**Terminal 1 – Backend**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload
```

**Terminal 2 – Frontend**

```powershell
cd frontend
npm run dev
```

Open the application:

```text
http://localhost:5173
```

---

## 11. Security Features

- Password hashing using bcrypt
- JWT authentication
- Protected API endpoints
- User-specific workout records
- User-specific goals
- User-specific notifications
- Token-based API authorization

---

## 12. Future Enhancements

Possible future modules:

- Fitness Challenges System
- Exercise Library
- Workout Scheduling
- Diet and Nutrition Tracking
- Water Intake Tracking
- Fitness Progress Photos
- AI-Based Workout Recommendations
- Trainer Management
- Fitness Leaderboard
- Mobile Application Integration

---

## 13. Project Status

| Module | Description | Status |
|---|---|---|
| 1 | User Authentication | Implemented |
| 2 | Workout Management | Implemented |
| 3 | Daily Progress Tracking | Implemented |
| 4 | Goal Setting System | Implemented; further testing |
| 5 | Reports and Analytics | Implemented |
| 6 | Notifications System | Implemented and tested |

---

## 14. Conclusion

FitTrack is a full-stack fitness management application developed using FastAPI and React.

It provides users with a platform to manage workouts, monitor daily fitness progress, set personal goals, view fitness analytics, and receive notifications.

The project demonstrates REST API development, JWT authentication, database management, frontend integration, and full-stack application development.

**Project Name:** FitTrack – Fitness & Workout Management Platform
