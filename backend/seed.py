import random
from datetime import date, timedelta
from app import create_app, db
from app.models import Student, ActivityLog, RiskScore
from app.risk_engine import calculate_risk_score

app = create_app()

COURSES = ['Full Stack Web Development','Data Science with Python','UI/UX Design','Digital Marketing','Machine Learning Basics']
MENTORS = ['mentor.priya@academy.com','mentor.rahul@academy.com','mentor.anjali@academy.com','mentor.vikram@academy.com']
NAMES = ['Aarav','Aditi','Aisha','Akash','Anil','Anjali','Arjun','Bhavna','Chirag','Deepak',
         'Divya','Farhan','Gaurav','Harini','Ishaan','Jaya','Karan','Kavita','Layla','Mehul',
         'Meera','Neeraj','Nikita','Om','Pooja','Pranav','Priya','Rahul','Ravi','Rohit',
         'Rupali','Sahil','Sakshi','Sana','Sanjay','Sara','Shiv','Sneha','Sonal','Suhana',
         'Tanvi','Tarun','Uday','Uma','Varun','Vidya','Vikram','Vishal','Yash','Zara']

def generate_activity(student_id, profile):
    today = date.today()
    logs = []
    for i in range(30, 0, -1):
        day = today - timedelta(days=i)
        if profile == 'healthy':
            logged_in = random.random() < 0.80
            session_min = random.randint(45, 120) if logged_in else 0
            submitted = logged_in and random.random() < 0.85
            quiz = round(random.uniform(65, 95), 1) if logged_in and random.random() < 0.5 else None
        elif profile == 'at_risk':
            if i > 15:
                logged_in = random.random() < 0.75
                session_min = random.randint(30, 90) if logged_in else 0
                submitted = logged_in and random.random() < 0.70
                quiz = round(random.uniform(55, 80), 1) if logged_in and random.random() < 0.4 else None
            else:
                logged_in = random.random() < 0.25
                session_min = random.randint(5, 25) if logged_in else 0
                submitted = logged_in and random.random() < 0.20
                quiz = round(random.uniform(30, 55), 1) if logged_in and random.random() < 0.2 else None
        else:
            logged_in = random.random() < 0.10
            session_min = random.randint(0, 15) if logged_in else 0
            submitted = logged_in and random.random() < 0.10
            quiz = round(random.uniform(20, 45), 1) if logged_in and random.random() < 0.1 else None
        logs.append(ActivityLog(student_id=student_id, date=day, logged_in=logged_in,
                                session_minutes=session_min, assignment_submitted=submitted, quiz_score=quiz))
    return logs

with app.app_context():
    db.drop_all()
    db.create_all()
    print("Tables created")

    profiles = (['healthy']*20 + ['at_risk']*18 + ['dropped']*12)
    random.shuffle(profiles)

    for i, name in enumerate(NAMES):
        s = Student(name=name, email=f'{name.lower()}@student.com',
                    course=random.choice(COURSES), mentor_email=random.choice(MENTORS))
        db.session.add(s)
        db.session.flush()
        db.session.add_all(generate_activity(s.id, profiles[i]))

    db.session.commit()
    print(f"50 students seeded")

    high = 0
    for s in Student.query.all():
        risk = calculate_risk_score(s.id)
        db.session.add(RiskScore(student_id=s.id, score=risk['score'], level=risk['level'], signals=risk['signals']))
        if risk['level'] == 'high': high += 1
    db.session.commit()
    print(f"Risk scores calculated — {high} high-risk students")
    print("Done! Now run: flask run")
