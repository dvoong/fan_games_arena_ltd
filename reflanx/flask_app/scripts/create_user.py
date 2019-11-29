import bcrypt

import app
import db
import models

# from app import app, User, db

username = 'dvoong'
password = 'asdf'
salt = bcrypt.gensalt()
password_hash = bcrypt.hashpw(bytes(password, 'utf-8'), salt)

with app.app.app_context():
    session = db.get_db()
    user = models.User(username=username, password=password_hash.decode('utf-8'))
    session.add(user)
    session.commit()
