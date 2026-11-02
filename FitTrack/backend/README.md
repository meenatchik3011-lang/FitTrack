# FitTrack Backend

## Setup (Windows PowerShell)
```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```
Edit `.env` and replace `SECRET_KEY` with a long random value. Then run:
```powershell
uvicorn app.main:app --reload
```
API: http://127.0.0.1:8000 | Swagger: http://127.0.0.1:8000/docs

The SQLite database `fittrack.db` is created automatically. Use Python 3.11 or 3.12 for the smoothest package compatibility.
