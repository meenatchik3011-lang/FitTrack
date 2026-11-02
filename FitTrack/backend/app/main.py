
from datetime import date, timedelta

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import Base, engine, get_db
from . import models, schemas
from .security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)


# --------------------------------------------------
# DATABASE INITIALIZATION
# --------------------------------------------------

Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="FitTrack API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


@app.get("/")
def root():
    return {
        "message": "FitTrack API is running",
        "docs": "/docs"
    }


# ==================================================
# MODULE 1 - USER AUTHENTICATION
# ==================================================

@app.post(
    "/api/auth/register",
    response_model=schemas.UserOut,
    status_code=201
)
def register(
    data: schemas.RegisterIn,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        (models.User.email == data.email) |
        (models.User.username == data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email or username already registered"
        )

    user = models.User(
        username=data.username,
        email=data.email,
        hashed_password=hash_password(data.password)
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@app.post(
    "/api/auth/login",
    response_model=schemas.TokenOut
)
def login(
    data: schemas.LoginIn,
    db: Session = Depends(get_db)
):

    user = db.query(models.User).filter(
        models.User.email == data.email
    ).first()

    if not user or not verify_password(
        data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password"
        )

    return {
        "access_token": create_access_token(user.id),
        "user": user
    }


@app.get(
    "/api/auth/me",
    response_model=schemas.UserOut
)
def me(
    user=Depends(get_current_user)
):
    return user


# ==================================================
# MODULE 2 - WORKOUT MANAGEMENT
# ==================================================

@app.post(
    "/api/workouts",
    response_model=schemas.WorkoutOut,
    status_code=201
)
def add_workout(
    data: schemas.WorkoutIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    item = models.Workout(
        **data.model_dump(),
        user_id=user.id
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@app.get(
    "/api/workouts",
    response_model=list[schemas.WorkoutOut]
)
def list_workouts(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    return (
        db.query(models.Workout)
        .filter_by(user_id=user.id)
        .order_by(models.Workout.workout_date.desc())
        .all()
    )


@app.put(
    "/api/workouts/{workout_id}",
    response_model=schemas.WorkoutOut
)
def edit_workout(
    workout_id: int,
    data: schemas.WorkoutIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    item = db.query(models.Workout).filter_by(
        id=workout_id,
        user_id=user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Workout not found"
        )

    for key, value in data.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)

    return item


@app.delete("/api/workouts/{workout_id}")
def delete_workout(
    workout_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    item = db.query(models.Workout).filter_by(
        id=workout_id,
        user_id=user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Workout not found"
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Workout deleted"
    }


# ==================================================
# MODULE 3 - DAILY PROGRESS TRACKING
# ==================================================

@app.get("/api/progress/daily")
def daily_progress(
    day: date = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    selected = day or date.today()

    q = db.query(models.Workout).filter_by(
        user_id=user.id,
        workout_date=selected
    )

    return {
        "date": selected,
        "total_workouts": q.count(),
        "total_calories": q.with_entities(
            func.coalesce(
                func.sum(models.Workout.calories_burned), 0
            )
        ).scalar(),
        "total_duration": q.with_entities(
            func.coalesce(
                func.sum(models.Workout.duration), 0
            )
        ).scalar()
    }


# ==================================================
# MODULE 4 - GOAL SETTING SYSTEM
# ==================================================

@app.post(
    "/api/goals",
    response_model=schemas.GoalOut,
    status_code=201
)
def create_goal(
    data: schemas.GoalIn,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    status_text = (
        "COMPLETED"
        if data.current_value >= data.target_value
        else "IN_PROGRESS"
    )

    goal = models.Goal(
        **data.model_dump(),
        user_id=user.id,
        status=status_text
    )

    db.add(goal)
    db.commit()
    db.refresh(goal)

    if status_text == "COMPLETED":
        notification = models.Notification(
            user_id=user.id,
            title="Goal completed",
            message=f"You completed your {goal.goal_type} goal!"
        )

        db.add(notification)
        db.commit()

    return goal


@app.get(
    "/api/goals",
    response_model=list[schemas.GoalOut]
)
def list_goals(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    return (
        db.query(models.Goal)
        .filter_by(user_id=user.id)
        .order_by(models.Goal.deadline)
        .all()
    )


@app.patch(
    "/api/goals/{goal_id}",
    response_model=schemas.GoalOut
)
def update_goal(
    goal_id: int,
    data: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    goal = db.query(models.Goal).filter_by(
        id=goal_id,
        user_id=user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    was_completed = goal.status == "COMPLETED"

    goal.current_value = data.current_value

    goal.status = (
        "COMPLETED"
        if goal.current_value >= goal.target_value
        else "IN_PROGRESS"
    )

    db.commit()
    db.refresh(goal)

    # Create notification only when goal
    # changes from incomplete to completed.

    if goal.status == "COMPLETED" and not was_completed:

        notification = models.Notification(
            user_id=user.id,
            title="Goal completed",
            message=f"You completed your {goal.goal_type} goal!"
        )

        db.add(notification)
        db.commit()

    return goal


@app.delete("/api/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    goal = db.query(models.Goal).filter_by(
        id=goal_id,
        user_id=user.id
    ).first()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Goal not found"
        )

    db.delete(goal)
    db.commit()

    return {
        "message": "Goal deleted"
    }


# ==================================================
# MODULE 5 - REPORTS AND ANALYTICS
# ==================================================

@app.get("/api/reports/weekly")
def weekly_report(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    start = date.today() - timedelta(days=6)

    rows = (
        db.query(
            models.Workout.workout_date,
            func.count(models.Workout.id),
            func.coalesce(
                func.sum(models.Workout.calories_burned), 0
            )
        )
        .filter(
            models.Workout.user_id == user.id,
            models.Workout.workout_date >= start
        )
        .group_by(models.Workout.workout_date)
        .all()
    )

    values = {
        row[0].isoformat(): {
            "workouts": row[1],
            "calories": row[2]
        }
        for row in rows
    }

    return [
        {
            "date": (start + timedelta(days=i)).isoformat(),
            **values.get(
                (start + timedelta(days=i)).isoformat(),
                {
                    "workouts": 0,
                    "calories": 0
                }
            )
        }
        for i in range(7)
    ]


@app.get("/api/reports/monthly")
def monthly_report(
    year: int = None,
    month: int = None,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    today = date.today()

    year = year or today.year
    month = month or today.month

    if month < 1 or month > 12:
        raise HTTPException(
            status_code=422,
            detail="Month must be between 1 and 12"
        )

    rows = (
        db.query(
            func.count(models.Workout.id),
            func.coalesce(
                func.sum(models.Workout.calories_burned), 0
            ),
            func.coalesce(
                func.sum(models.Workout.duration), 0
            )
        )
        .filter(
            models.Workout.user_id == user.id,
            func.strftime(
                "%Y", models.Workout.workout_date
            ) == str(year),
            func.strftime(
                "%m", models.Workout.workout_date
            ) == f"{month:02d}"
        )
        .first()
    )

    return {
        "year": year,
        "month": month,
        "total_workouts": rows[0],
        "total_calories": rows[1],
        "total_duration": rows[2]
    }


# ==================================================
# MODULE 6 - NOTIFICATIONS SYSTEM
# ==================================================

@app.get(
    "/api/notifications",
    response_model=list[schemas.NotificationOut]
)
def notifications(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    today = date.today()

    existing = (
        db.query(models.Notification)
        .filter_by(
            user_id=user.id,
            title="Daily workout reminder"
        )
        .filter(
            func.date(models.Notification.created_at)
            == today.isoformat()
        )
        .first()
    )

    did_workout = db.query(models.Workout).filter_by(
        user_id=user.id,
        workout_date=today
    ).first()

    if not existing and not did_workout:

        reminder = models.Notification(
            user_id=user.id,
            title="Daily workout reminder",
            message=(
                "You have not logged a workout today. "
                "A short session can help you stay consistent."
            )
        )

        db.add(reminder)
        db.commit()

    return (
        db.query(models.Notification)
        .filter_by(user_id=user.id)
        .order_by(models.Notification.created_at.desc())
        .all()
    )


# --------------------------------------------------
# GET UNREAD NOTIFICATION COUNT
# --------------------------------------------------

@app.get("/api/notifications/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    count = (
        db.query(models.Notification)
        .filter_by(
            user_id=user.id,
            is_read=False
        )
        .count()
    )

    return {
        "unread_count": count
    }


# --------------------------------------------------
# MARK SINGLE NOTIFICATION AS READ
# --------------------------------------------------

@app.patch("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    item = db.query(models.Notification).filter_by(
        id=notification_id,
        user_id=user.id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    item.is_read = True

    db.commit()

    return {
        "message": "Notification marked as read"
    }


# --------------------------------------------------
# MARK ALL NOTIFICATIONS AS READ
# --------------------------------------------------

@app.patch("/api/notifications/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):

    (
        db.query(models.Notification)
        .filter_by(
            user_id=user.id,
            is_read=False
        )
        .update(
            {"is_read": True},
            synchronize_session=False
        )
    )

    db.commit()

    return {
        "message": "All notifications marked as read"
    }
