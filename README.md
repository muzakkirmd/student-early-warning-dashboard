# Student Early Warning Dashboard

Detects students at risk of dropping out before they disappear.

## Quick Start

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed.py
flask run
```

Then open: http://localhost:5000/api/students

## API Endpoints
- GET  /api/health
- GET  /api/students
- GET  /api/students/:id
- GET  /api/risk-scores
- GET  /api/risk-scores/high
- POST /api/mentor-actions
