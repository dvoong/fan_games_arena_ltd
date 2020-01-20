import sys

import bcrypt

import app
import db.alchemy
import models
from models import User

assert len(sys.argv) == 3, 'invalid arguments, provide username and password'

script, username, password = sys.argv

with app.app.app_context():
    session = db.alchemy.get_session()
    users = session.query(User).filter(User.username==username)
    users.delete()
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(bytes(password, 'utf-8'), salt)
    user = models.User(username=username, password=password_hash.decode('utf-8'))
    session.add(user)
    session.commit()

print('user created:', username)
