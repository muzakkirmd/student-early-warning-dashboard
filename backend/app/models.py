from app import db
from datetime import datetime

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    course = db.Column(db.String(100), nullable=False)
    mentor_email = db.Column(db.String(120), nullable=False)
    enrolled_at = db.Column(db.DateTime, default=datetime.utcnow)
    logs = db.relationship('ActivityLog', backref='student', lazy=True)
    risk_scores = db.relationship('RiskScore', backref='student', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'course': self.course,
            'mentor_email': self.mentor_email,
            'enrolled_at': self.enrolled_at.isoformat()
        }

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    logged_in = db.Column(db.Boolean, default=False)
    session_minutes = db.Column(db.Integer, default=0)
    assignment_submitted = db.Column(db.Boolean, default=False)
    quiz_score = db.Column(db.Float, nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'date': self.date.isoformat(),
            'logged_in': self.logged_in,
            'session_minutes': self.session_minutes,
            'assignment_submitted': self.assignment_submitted,
            'quiz_score': self.quiz_score
        }

class RiskScore(db.Model):
    __tablename__ = 'risk_scores'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    score = db.Column(db.Float, nullable=False)
    level = db.Column(db.String(10), nullable=False)
    signals = db.Column(db.JSON, nullable=True)
    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'score': round(self.score, 1),
            'level': self.level,
            'signals': self.signals,
            'calculated_at': self.calculated_at.isoformat()
        }

class MentorActionLog(db.Model):
    __tablename__ = 'mentor_action_logs'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('students.id'), nullable=False)
    mentor_email = db.Column(db.String(120), nullable=False)
    action = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    logged_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'student_id': self.student_id,
            'mentor_email': self.mentor_email,
            'action': self.action,
            'notes': self.notes,
            'logged_at': self.logged_at.isoformat()
        }
