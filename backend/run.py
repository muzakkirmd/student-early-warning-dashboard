    # OLD VERSION (kept for reference)
# from app import create_app
# app = create_app()
# if __name__ == '__main__':
#     app.run(debug=True, port=5000)


# SECOND VERSION (kept for reference)
# from app import create_app
# from app.models import db
#
# app = create_app()
#
# # Create database tables automatically
# with app.app_context():
#     db.create_all()
#
# if __name__ == '__main__':
#     app.run(debug=True, port=5000)


# CURRENT VERSION (Render + auto database seed)

#from app import create_app
#from app.models import db
#from seed import seed_data

#app = create_app()

# Create database tables and seed data automatically
#with app.app_context():
 #   db.create_all()
  #  seed_data()

#if __name__ == '__main__':
 #   app.run(debug=True, port=5000)


from app import create_app
from app.models import db

app = create_app()

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True, port=5000)