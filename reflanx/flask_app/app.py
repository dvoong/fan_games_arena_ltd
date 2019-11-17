import bcrypt
import flask_login
from flask import Flask, request
from flask_login import current_user, LoginManager, UserMixin
from flask_sqlalchemy import SQLAlchemy
from flask_wtf.csrf import CSRFProtect, generate_csrf


app = Flask(__name__)
app.config['SECRET_KEY'] = '6d7566e2-cfed-4709-8d11-080dc1b4d044'
db_uri = 'postgresql+psycopg2://fga_dashboards@localhost/fga_dashboards'
app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    password = db.Column(db.String, nullable=False)
db.create_all()

login_manager = LoginManager()
login_manager.init_app(app)
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

csrf = CSRFProtect(app)


@app.route('/check-login-status')
def check_login_status():
    return {
        'loginStatus': 'logged in' if current_user.is_authenticated else 'logged out',
        'csrftoken': generate_csrf(),
    }

@app.route('/login-user', methods=['POST'])
def login_user():
    username = request.json.get('username')
    password = request.json.get('password')
    user = User.query.filter_by(username=username).first()
    if user:
        hashed_password = user.password
        is_authenticated = bcrypt.checkpw(
            bytes(password, 'utf-8'),
            bytes(hashed_password, 'utf-8')
        )
        if is_authenticated:
            flask_login.login_user(user)
            return {'status': 200}
    return {'status': 401, 'errors': ["Invalid username and password"]}

@app.route('/logout-user', methods=['POST'])
def logout_user():
    flask_login.logout_user()
    return {'status': 200}

if __name__ == '__main__':
    app.run(debug=True)
