from datetime import date, timedelta
from app.models import ActivityLog

def calculate_risk_score(student_id: int) -> dict:
    today = date.today()
    window_start = today - timedelta(days=14)
    logs = (
        ActivityLog.query
        .filter(ActivityLog.student_id == student_id, ActivityLog.date >= window_start)
        .order_by(ActivityLog.date.asc())
        .all()
    )
    if not logs:
        return _build_result(100.0, {'note': 'No activity in last 14 days'})

    total_days = 14

    login_days = sum(1 for l in logs if l.logged_in)
    login_score = round((login_days / total_days) * 30, 1)
    login_penalty = 30 - login_score

    days_with_login = [l for l in logs if l.logged_in]
    if days_with_login:
        submitted = sum(1 for l in days_with_login if l.assignment_submitted)
        assignment_score = round((submitted / len(days_with_login)) * 30, 1)
    else:
        assignment_score = 0
    assignment_penalty = 30 - assignment_score

    quiz_logs = [l for l in logs if l.quiz_score is not None]
    if len(quiz_logs) >= 2:
        recent = [l.quiz_score for l in quiz_logs[-3:]]
        older  = [l.quiz_score for l in quiz_logs[:3]]
        trend  = (sum(recent)/len(recent)) - (sum(older)/len(older))
        quiz_penalty = max(0, min(25, ((-trend) / 100) * 25))
        quiz_score_signal = round(25 - quiz_penalty, 1)
    elif len(quiz_logs) == 1:
        quiz_score_signal = round((quiz_logs[0].quiz_score / 100) * 25, 1)
        quiz_penalty = 25 - quiz_score_signal
    else:
        quiz_score_signal = 12.5
        quiz_penalty = 12.5

    session_logs = [l for l in logs if l.session_minutes]
    if session_logs:
        avg_session = sum(l.session_minutes for l in session_logs) / len(session_logs)
        session_score = round(min(avg_session / 60, 1.0) * 15, 1)
    else:
        avg_session = 0
        session_score = 0
    session_penalty = 15 - session_score

    risk = round(login_penalty + assignment_penalty + quiz_penalty + session_penalty, 1)
    risk = max(0.0, min(100.0, risk))

    signals = {
        'login_frequency': {'value': f'{login_days}/{total_days} days', 'penalty': login_penalty},
        'assignment_rate': {'value': f'{assignment_score:.0f}/30', 'penalty': assignment_penalty},
        'quiz_trend': {'value': 'declining' if quiz_penalty > 12 else 'stable' if quiz_penalty > 6 else 'improving', 'penalty': round(quiz_penalty, 1)},
        'session_duration': {'value': f'{avg_session:.0f} min avg', 'penalty': session_penalty}
    }
    return _build_result(risk, signals)

def _build_result(risk, signals):
    level = 'high' if risk >= 70 else 'medium' if risk >= 40 else 'low'
    return {'score': risk, 'level': level, 'signals': signals}
