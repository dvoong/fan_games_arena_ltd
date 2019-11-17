import bcrypt
from app import app, User, db

username = 'dvoong'
password = 'asdf'
# salt = bcrypt.gensalt()
# print('salt:', salt)
# password_hash = bcrypt.hashpw(bytes(password, 'utf-8'), salt)
# print('password_hash:', password_hash)

# users = User.query.all()
# print('Users before:', users)
# print('deleting users')
# if len(users):
#     for user in users:
#         db.session.delete(user)
#     db.session.commit()
    
# user = User(username=username, password=password_hash.decode('utf-8'))
# print('user:', user)
# db.session.add(user)
# db.session.commit()
# print('Users after:', User.query.all())

user = User.query.filter_by(username=username).first()
print('user.password:', user.password)
print('bytes(user.password):', bytes(user.password, 'utf-8'))
print(bcrypt.checkpw(bytes(password, 'utf-8'), bytes(user.password, 'utf-8')))
