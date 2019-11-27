import datetime, os, struct
import bcrypt, pandas as pd, pyodbc, sqlalchemy
import flask_login
from flask import Flask, request
from flask_login import current_user, login_required, LoginManager
from flask_wtf.csrf import CSRFProtect, generate_csrf

import etl, models
from db import get_db
from etl import get_task_status
from models import DauDashboardData, EtlTask, User


app = Flask(__name__)
app.config['SECRET_KEY'] = '6d7566e2-cfed-4709-8d11-080dc1b4d044'
db_uri = 'postgresql+psycopg2://fga_dashboards@localhost/fga_dashboards'
app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['GAME_DATABASE_HOST'] = os.environ['DATABASE_HOST']
app.config['GAME_DATABASE_PASSWORD'] = os.environ['DATABASE_PASSWORD']
app.config['GAME_DATABASE_USER'] = os.environ['DATABASE_USER']
app.config['GAME_LOGS_DATABASE'] = os.environ['LOGS_DATABASE']
app.config['GAME_USER_DATABASE'] = os.environ['USERS_DATABASE']
app.config['GAME_QUIZGAMES_DATABASE'] = os.environ['QUIZGAMES_DATABASE']
app.config['DATA_WAREHOUSE_URI'] = os.environ.get(
    'DATA_WAREHOUSE_URI',
    'postgresql://fga_dashboards@localhost/fga_data_warehouse'
)
app.config['DATABASE'] = os.environ.get(
    'DATABASE',
    'postgresql://fga_dashboards@localhost/fga_dashboards' if app.config['ENV'] != 'test' else \
    'postgresql://test_fga_dashboards@localhost/test_fga_dashboards',
)
app.config['DATABASE_ENGINE'] = sqlalchemy.create_engine(app.config['DATABASE'])
app.config['WTF_CSRF_ENABLED'] = False if app.config['ENV'] == 'test' else True

login_manager = LoginManager()
login_manager.init_app(app)
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

CSRFProtect(app)

models.Base.metadata.create_all(app.config['DATABASE_ENGINE'])


@app.route('/check-login-status')
def check_login_status():
    return {
        'loginStatus': 'logged in' if current_user.is_authenticated else 'logged out',
        'csrftoken': generate_csrf(),
    }


@app.route('/extract-game-data', methods=['GET', 'POST'])
@login_required
def extract_game_data():
    host = app.config['GAME_DATABASE_HOST']
    user = app.config['GAME_DATABASE_USER']
    password = app.config['GAME_DATABASE_PASSWORD']
    logs_db_name = app.config['GAME_LOGS_DATABASE']
    connection = pyodbc.connect(
        database=logs_db_name,
        driver='FreeTDS',
        password=password,
        port=1433,
        server=host,
        tds_version='auto',
        user=user
    )
    def handle_datetimeoffset(dto_value):
        # ref: https://github.com/mkleehammer/pyodbc/issues/134#issuecomment-281739794
        tup = struct.unpack("<6hI2h", dto_value)  # e.g., (2017, 3, 16, 10, 35, 18, 0, -6, 0)
        tweaked = [tup[i] // 100 if i == 6 else tup[i] for i in range(len(tup))]
        return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}.{:07d} {:+03d}:{:02d}".format(*tweaked)
    connection.add_output_converter(-155, handle_datetimeoffset)
    print('games_logs_db_connection: ', connection)

    engine = sqlalchemy.create_engine(app.config["DATA_WAREHOUSE_URI"])
    
    sql = 'select * from LogQuizProd'
    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()
        rows = [list(r) for r in rows]
        columns = [c[0] for c in cursor.description]
    df = pd.DataFrame(rows, columns=columns)
    df.to_sql('events', engine, if_exists='replace', index=False)

    connection = pyodbc.connect(
        database=app.config['GAME_USERS_DATABASE'],
        driver='FreeTDS',
        password=password,
        port=1433,
        server=host,
        tds_version='auto',
        user=user
    )
    def handle_datetimeoffset(dto_value):
        # ref: https://github.com/mkleehammer/pyodbc/issues/134#issuecomment-281739794
        tup = struct.unpack("<6hI2h", dto_value)  # e.g., (2017, 3, 16, 10, 35, 18, 0, -6, 0)
        tweaked = [tup[i] // 100 if i == 6 else tup[i] for i in range(len(tup))]
        return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}.{:07d} {:+03d}:{:02d}".format(*tweaked)
    connection.add_output_converter(-155, handle_datetimeoffset)
    sql = 'select * from FGAUsers'
    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()
        rows = [list(r) for r in rows]
        columns = [c[0] for c in cursor.description]
    df = pd.DataFrame(rows, columns=columns)
    df.to_sql('users', engine, if_exists='replace', index=False)

    sql = 'select * from FGAUserDevices'
    with connection.cursor() as cursor:
        cursor.execute(sql)
        rows = cursor.fetchall()
        rows = [list(r) for r in rows]
        columns = [c[0] for c in cursor.description]
    df = pd.DataFrame(rows, columns=columns)
    df.to_sql('devices', engine, if_exists='replace', index=False)

    
    return {'status': 200}

@app.route('/get-dau-data', methods=['GET'])
@login_required
def get_dau_data():
    values = DauDashboardData.query.all()
    columns = DauDashboardData.__table__.columns.keys()
    return {
        'headers': columns,
        'values': values,
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

@app.route('/api/populate-database', methods=['POST'])
def populate_database():
    task_status = get_task_status()
    if task_status == 'SUCCESS':
        session = get_db()
        existing_task = session.query(EtlTask).get('populate_database')
        session.delete(existing_task)
        task = EtlTask(name='populate_database', status='RUNNING', timestamp=datetime.datetime.now())
        session.add(task)
        task_status = populate_database_task.delay()
        session.commit()
    elif task_status == None:
        session = get_db()
        task = EtlTask(name='populate_database', status='RUNNING', timestamp=datetime.datetime.now())
        session.add(task)
        task_status = populate_database_task.delay()
        session.commit()
    elif task_status == 'RUNNING':
        pass

def populate_database_task():
    pass
    
if __name__ == '__main__':
    app.run(debug=True)
