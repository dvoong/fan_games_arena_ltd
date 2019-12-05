import datetime, os, struct
import bcrypt, pandas as pd, pyodbc, redis, sqlalchemy
import flask_login
from celery import Celery
from flask import Flask, request
from flask_login import current_user, login_required, LoginManager
from flask_wtf.csrf import CSRFProtect, generate_csrf
from sqlalchemy.sql.expression import func as alchemy_func


import db
import etl, models
import etl.tasks
import utils
from db import get_db
from models import DauDashboardData, EtlTask, User


app = Flask(__name__)
app.config['PROJECT_HOME'] = os.environ['FLASK_HOME']
app.config['SECRET_KEY'] = '6d7566e2-cfed-4709-8d11-080dc1b4d044'
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    'SQLALCHEMY_DATABASE_URI',
    'postgresql+psycopg2://fga_dashboards@localhost/fga_dashboards' \
    if app.config['ENV'] != 'test' \
    else 'postgresql+psycopg2://test_fga_dashboards@localhost/test_fga_dashboards'
)
app.config["PG_DATABASE_URI"] = os.environ.get(
    'PG_DATABASE_URI',
    'postgresql://fga_dashboards@localhost/fga_dashboards' \
    if app.config['ENV'] != 'test' \
    else 'postgresql://test_fga_dashboards@localhost/test_fga_dashboards'
)
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['GAME_DATABASE_HOST'] = os.environ['DATABASE_HOST']
app.config['GAME_DATABASE_PASSWORD'] = os.environ['DATABASE_PASSWORD']
app.config['GAME_DATABASE_USER'] = os.environ['DATABASE_USER']
app.config['GAME_LOGS_DATABASE'] = os.environ['LOGS_DATABASE']
app.config['GAME_USER_DATABASE'] = os.environ['USERS_DATABASE']
app.config['GAME_QUIZGAMES_DATABASE'] = os.environ['QUIZGAMES_DATABASE']
app.config['DATAWAREHOUSE_URI'] = os.environ.get(
    'DATAWAREHOUSE_URI',
    'postgresql://fga_datawarehouse@localhost/fga_datawarehouse' if app.config['ENV'] != 'test' \
    else 'postgresql://test_fga_datawarehouse@localhost/test_fga_datawarehouse'
)
app.config['DATABASE'] = os.environ.get(
    'DATABASE',
    'postgresql://fga_dashboards@localhost/fga_dashboards' if app.config['ENV'] != 'test' else \
    'postgresql://test_fga_dashboards@localhost/test_fga_dashboards',
)
app.config['DATABASE_ENGINE'] = sqlalchemy.create_engine(app.config['DATABASE'])
app.config['WTF_CSRF_ENABLED'] = False if app.config['ENV'] == 'test' else True
app.config['CELERY_BACKEND'] = os.environ.get('CELERY_BACKEND', 'redis://localhost')
app.config['CELERY_BROKER'] = os.environ.get('CELERY_BROKER', 'redis://localhost')

# celery app
# celery = Celery('app', backend=app.config['CELERY_BACKEND'], broker=app.config['CELERY_BROKER'])
# celery = Celery('app', backend='redis://', broker=app.config['CELERY_BROKER'])
celery = Celery('app', broker=app.config['CELERY_BROKER'])
celery.conf.result_backend = 'redis://localhost:6379/0'
app.celery = celery

login_manager = LoginManager()
login_manager.init_app(app)
@login_manager.user_loader
def load_user(user_id):
    session = db.get_db()
    return session.query(User).get(user_id)

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
    sql = '''
    with latest_analysis_time as (
        select 
            max(analysis_time) as analysis_time

        from dau_dashboard_data

    )
    
    select 
        * 

    from dau_dashboard_data 
        join latest_analysis_time using (analysis_time)

    order by date, client, tenure_type

    '''
    with db.get_pg_connection() as connection:
        df = db.query_database(connection, sql)

    print('df:', df)

    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    df['analysis_time'] = pd.to_datetime(
        df['analysis_time']
    ).dt.strftime('%Y-%m-%d %H:%M:%S')
    
    response = utils.to_web_dict(df)
    return response

@app.route('/login-user', methods=['POST'])
def login_user():
    username = request.json.get('username')
    password = request.json.get('password')
    session = db.get_db()
    user = session.query(User).filter(User.username==username).first()
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

@app.route('/populate-database', methods=['GET', 'POST'])
def populate_database():
    force_update = 'force-update' in request.args
    session = db.get_db()
    task = session.query(models.EtlTask).get('populate_database')
    if task == None:
        async_result = populate_database_task.delay()
        task = EtlTask(
            id=async_result.id,
            name='populate_database',
            created_at=datetime.datetime.now(),
        )
        session.add(task)
        session.commit()
    else:
        if task.status == 'SUCCESS' or force_update is True:
            session = get_db()
            existing_task = session.query(EtlTask).get('populate_database')
            session.delete(existing_task)
            async_result = populate_database_task.delay()
            task = EtlTask(
                id=async_result.id,
                name='populate_database',
                created_at=datetime.datetime.now()
            )
            session.add(task)
            session.commit()
    return {
        'status': task.status,
        'taskId': task.id,
        'createdAt': task.created_at.strftime('%Y-%M-%d %H:%m:%s')
    }

@app.route('/populate-dau')
def populate_dau():
    with open('etl/sql/dau.sql') as f:
        sql = str(f.read())

    with db.get_datawarehouse_connection() as connection:
        df = db.query_database(connection, sql)
    df['analysis_time'] = datetime.datetime.now()

    sql = '''insert into dau_dashboard_data ('''
    sql += ','.join(df.columns)
    sql += ') values ('
    sql += ','.join(['%s' for i in range(len(df.columns))])
    sql += ')'
    values = df.values.tolist()
    print('sql:', sql)

    with db.get_pg_connection() as connection:
        with connection.cursor() as cursor:
            cursor.executemany(sql, values)

    return {'status': 200, 'sql': sql}

@celery.task
def populate_database_task():
    print('populate_database_task_id')
    with app.app_context():
        return etl.tasks.populate_database()

    
if __name__ == '__main__':
    app.run(debug=True, threaded=True)
