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

@main.route('/api/seed', methods=['GET','POST'])
def seed_database():
    from app.models import Student, ActivityLog, RiskScore
    # Only seed if empty
    if Student.query.count() > 0:
        return jsonify({'message': 'Already seeded', 'count': Student.query.count()})
    
    import random
    from datetime import date, timedelta

    COURSES = ['Full Stack Web Development','Data Science with Python','UI/UX Design','Digital Marketing','Machine Learning Basics']
    MENTORS = ['mentor.priya@academy.com','mentor.rahul@academy.com','mentor.anjali@academy.com','muzakkirmujju50@gmail.com']
    NAMES = ['Aarav','Aditi','Aisha','Akash','Anil','Anjali','Arjun','Bhavna','Chirag','Deepak','Divya','Farhan','Gaurav','Harini','Ishaan','Jaya','Karan','Kavita','Layla','Mehul','Meera','Neeraj','Nikita','Om','Pooja','Pranav','Priya','Rahul','Ravi','Rohit','Rupali','Sahil','Sakshi','Sana','Sanjay','Sara','Shiv','Sneha','Sonal','Suhana','Tanvi','Tarun','Uday','Uma','Varun','Vidya','Vikram','Vishal','Yash','Zara']

    profiles = (['healthy']*20 + ['at_risk']*18 + ['dropped']*12)
    random.shuffle(profiles)

    for i, name in enumerate(NAMES):
        s = Student(name=name, email=f'{name.lower()}@student.com', course=random.choice(COURSES), mentor_email=random.choice(MENTORS))
        db.session.add(s)
        db.session.flush()
        today = date.today()
        for j in range(30, 0, -1):
            day = today - timedelta(days=j)
            profile = profiles[i]
            if profile == 'healthy':
                logged_in = random.random() < 0.80
                session_min = random.randint(45,120) if logged_in else 0
                submitted = logged_in and random.random() < 0.85
                quiz = round(random.uniform(65,95),1) if logged_in and random.random() < 0.5 else None
            elif profile == 'at_risk':
                logged_in = random.random() < (0.75 if j > 15 else 0.25)
                session_min = random.randint(5,30) if logged_in else 0
                submitted = logged_in and random.random() < (0.70 if j > 15 else 0.20)
                quiz = round(random.uniform(30,80),1) if logged_in and random.random() < 0.3 else None
            else:
                logged_in = random.random() < 0.10
                session_min = random.randint(0,15) if logged_in else 0
                submitted = logged_in and random.random() < 0.10
                quiz = round(random.uniform(20,45),1) if logged_in and random.random() < 0.1 else None
            db.session.add(ActivityLog(student_id=s.id, date=day, logged_in=logged_in, session_minutes=session_min, assignment_submitted=submitted, quiz_score=quiz))

    db.session.commit()

    high = 0
    for s in Student.query.all():
        risk = calculate_risk_score(s.id)
        db.session.add(RiskScore(student_id=s.id, score=risk['score'], level=risk['level'], signals=risk['signals']))
        if risk['level'] == 'high': high += 1
    db.session.commit()

    return jsonify({'message': 'Seeded successfully', 'students': len(NAMES), 'high_risk': high})

# ADD THESE ROUTES TO YOUR EXISTING backend/app/routes.py
# Paste this at the bottom of routes.py (before the last line)

@main.route('/api/ingest/student', methods=['POST'])
def ingest_student():
    """Add or update a student via API or CSV import."""
    data = request.json
    if not data or not data.get('email'):
        return jsonify({'error': 'email is required'}), 400

    existing = Student.query.filter_by(email=data['email']).first()
    if existing:
        # Update existing student
        if data.get('name'): existing.name = data['name']
        if data.get('course'): existing.course = data['course']
        if data.get('mentor_email'): existing.mentor_email = data['mentor_email']
        db.session.commit()
        return jsonify({'status': 'updated', 'student': existing.to_dict()})

    # Create new student
    student = Student(
        name=data.get('name', 'Unknown'),
        email=data['email'],
        course=data.get('course', 'General'),
        mentor_email=data.get('mentor_email', 'mentor@academy.com')
    )
    db.session.add(student)
    db.session.commit()
    return jsonify({'status': 'created', 'student': student.to_dict()}), 201


@main.route('/api/ingest/event', methods=['POST'])
def ingest_event():
    """Receive a student activity event from external platform."""
    data = request.json
    if not data or not data.get('student_email'):
        return jsonify({'error': 'student_email is required'}), 400

    student = Student.query.filter_by(email=data['student_email']).first()
    if not student:
        return jsonify({'error': 'Student not found. Create student first via /api/ingest/student'}), 404

    from datetime import date as dt
    today = dt.today()

    # Check if log exists for today
    existing_log = ActivityLog.query.filter_by(
        student_id=student.id, date=today
    ).first()

    event_type = data.get('event_type', 'login')

    if existing_log:
        # Update today's log
        if event_type == 'login':
            existing_log.logged_in = True
            if data.get('session_minutes'):
                existing_log.session_minutes = max(
                    existing_log.session_minutes,
                    int(data['session_minutes'])
                )
        if event_type == 'assignment':
            existing_log.assignment_submitted = True
        if event_type == 'quiz' and data.get('quiz_score') is not None:
            existing_log.quiz_score = float(data['quiz_score'])
        db.session.commit()
    else:
        # Create new log for today
        log = ActivityLog(
            student_id=student.id,
            date=today,
            logged_in=(event_type == 'login'),
            session_minutes=int(data.get('session_minutes', 0)),
            assignment_submitted=(event_type == 'assignment'),
            quiz_score=float(data['quiz_score']) if event_type == 'quiz' and data.get('quiz_score') else None
        )
        db.session.add(log)
        db.session.commit()

    # Recalculate risk score
    risk = calculate_risk_score(student.id)
    rs = RiskScore(
        student_id=student.id,
        score=risk['score'],
        level=risk['level'],
        signals=risk['signals']
    )
    db.session.add(rs)
    db.session.commit()

    return jsonify({
        'status': 'event_recorded',
        'student': student.name,
        'risk_score': risk['score'],
        'risk_level': risk['level']
    })
