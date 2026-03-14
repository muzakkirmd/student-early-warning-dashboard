from flask import Blueprint, jsonify, request
from app import db
from app.models import Student, ActivityLog, RiskScore, MentorActionLog
from app.risk_engine import calculate_risk_score
from datetime import date

main = Blueprint('main', __name__)

@main.route('/api/health')
def health():
    return jsonify({'status': 'ok', 'message': 'Student Early Warning API running'})

@main.route('/api/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    result = []
    for s in students:
        latest_risk = (RiskScore.query.filter_by(student_id=s.id)
                       .order_by(RiskScore.calculated_at.desc()).first())
        data = s.to_dict()
        data['risk'] = latest_risk.to_dict() if latest_risk else None
        result.append(data)
    result.sort(key=lambda x: (x['risk']['score'] if x['risk'] else 0), reverse=True)
    return jsonify(result)

@main.route('/api/students/<int:student_id>', methods=['GET'])
def get_student(student_id):
    s = Student.query.get_or_404(student_id)
    logs = ActivityLog.query.filter_by(student_id=student_id).order_by(ActivityLog.date.desc()).limit(30).all()
    risk_history = RiskScore.query.filter_by(student_id=student_id).order_by(RiskScore.calculated_at.desc()).limit(14).all()
    actions = MentorActionLog.query.filter_by(student_id=student_id).order_by(MentorActionLog.logged_at.desc()).all()
    current_risk = calculate_risk_score(student_id)
    return jsonify({
        'student': s.to_dict(),
        'current_risk': current_risk,
        'risk_history': [r.to_dict() for r in risk_history],
        'activity_logs': [l.to_dict() for l in logs],
        'mentor_actions': [a.to_dict() for a in actions]
    })

@main.route('/api/risk-scores', methods=['GET'])
def get_all_risk_scores():
    students = Student.query.all()
    results = []
    for s in students:
        risk = calculate_risk_score(s.id)
        rs = RiskScore(student_id=s.id, score=risk['score'], level=risk['level'], signals=risk['signals'])
        db.session.add(rs)
        results.append({'student_id': s.id, 'student_name': s.name, **risk})
    db.session.commit()
    return jsonify(results)

@main.route('/api/risk-scores/high', methods=['GET'])
def get_high_risk():
    students = Student.query.all()
    high_risk = []
    for s in students:
        risk = calculate_risk_score(s.id)
        if risk['level'] == 'high':
            high_risk.append({'student_id': s.id, 'student_name': s.name,
                              'student_email': s.email, 'mentor_email': s.mentor_email,
                              'course': s.course, **risk})
    return jsonify(high_risk)

@main.route('/api/mentor-actions', methods=['POST'])
def log_mentor_action():
    data = request.json
    action = MentorActionLog(student_id=data['student_id'], mentor_email=data['mentor_email'],
                             action=data['action'], notes=data.get('notes', ''))
    db.session.add(action)
    db.session.commit()
    return jsonify(action.to_dict()), 201
