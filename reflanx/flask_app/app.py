import datetime, os, struct
import bcrypt, pandas as pd, psycopg2.sql, pyodbc, redis, sqlalchemy
import flask_login
from celery import Celery
from flask import Flask, request
from flask_login import current_user, login_required, LoginManager
from flask_wtf.csrf import CSRFProtect, generate_csrf
from sqlalchemy.sql.expression import func as alchemy_func

import db.alchemy
import db.app
import db.data_warehouse
import etl, models
import etl.tasks
import utils
import db.alchemy
from models import DauDashboardData, EtlTask, User


app = Flask(__name__)
app.config['PROJECT_HOME'] = os.environ.get('FLASK_HOME', os.getcwd())
app.config['SECRET_KEY'] = '6d7566e2-cfed-4709-8d11-080dc1b4d044'
app.config['WTF_CSRF_ENABLED'] = False if app.config['ENV'] == 'test' else True

# database config
app.config['GAME_DATABASE_HOST'] = os.environ['GAME_DATABASE_HOST']
app.config['GAME_DATABASE_USER'] = os.environ['GAME_DATABASE_USER']
app.config['GAME_DATABASE_PASSWORD'] = os.environ['GAME_DATABASE_PASSWORD']
app.config['GAME_LOGS_DATABASE_NAME'] = os.environ['GAME_LOGS_DATABASE_NAME']
app.config['GAME_USER_DATABASE_NAME'] = os.environ['GAME_USER_DATABASE_NAME']
app.config['GAME_QUIZGAMES_DATABASE_NAME'] = os.environ['GAME_QUIZGAMES_DATABASE_NAME']

app.config['APP_DATABASE'] = os.environ['APP_DATABASE']
app.config['APP_DATABASE_WAREHOUSE_SCHEMA'] = os.environ['APP_DATABASE_WAREHOUSE_SCHEMA']
app.config['APP_DATABASE_DASHBOARDS_SCHEMA'] = os.environ['APP_DATABASE_DASHBOARDS_SCHEMA']

app.config['DATA_WAREHOUSE_DATABASE'] = os.environ['DATA_WAREHOUSE_DATABASE']

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['SQLALCHEMY_DATABASE_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['DATABASE_ENGINE'] = sqlalchemy.create_engine(app.config['APP_DATABASE'])

app.config['CELERY_BACKEND'] = os.environ.get('CELERY_BACKEND', 'redis://localhost')
app.config['CELERY_BROKER'] = os.environ.get('CELERY_BROKER', 'redis://localhost')
app.config['SQL_DIRECTORY'] = '{}/sql'.format(app.config['PROJECT_HOME'])

main_module = 'app'
celery = Celery(
    main_module,
    backend=app.config['CELERY_BACKEND'],
    broker=app.config['CELERY_BROKER']
)

login_manager = LoginManager()
login_manager.init_app(app)
@login_manager.user_loader
def load_user(user_id):
    session = db.alchemy.get_session()
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
    with db.app.get_connection() as connection:
        df = db.app.query_database(connection, sql)

    print('df:', df)

    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    df['analysis_time'] = pd.to_datetime(
        df['analysis_time']
    ).dt.strftime('%Y-%m-%d %H:%M:%S')
    
    response = utils.to_web_dict(df)
    return response

@app.route('/get-retention-dashboard-data', methods=['GET'])
@login_required
def get_retention_data():
    sql = 'select * from retention_dashboard_data order by date'
    with db.get_pg_connection() as connection:
        df = db.query_database(connection, sql)
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    return utils.to_web_dict(df)

@app.route('/populate-retention-dashboard-data', methods=['GET'])
@login_required
def populate_retention_data():
    filepath = "{}/populate_retention_dashboard_data.sql".format(app.config['SQL_DIRECTORY'])
    with open(filepath, 'r') as f:
        sql = str(f.read())
    with db.data_warehouse.get_connection() as connection:
        df = db.data_warehouse.query_database(connection, sql)
    with db.app.get_connection() as connection:
        sql = '''create table if not exists retention_dashboard_data (
            date timestamp, 
            client varchar(100),
            d1_active_users int,
            d7_active_users int,
            d14_active_users int,
            d28_active_users int,
            cohort_size int
        )'''
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = 'delete from retention_dashboard_data'
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = 'insert into retention_dashboard_data values (%s, %s, %s, %s, %s, %s, %s)'
        with connection.cursor() as cursor:
            cursor.executemany(sql, df.values.tolist())

    return {'status': 200}

@app.route('/get-weekly-retention-dashboard-data', methods=['GET'])
@login_required
def get_weekly_retention_data():
    sql = 'select * from weekly_retention_dashboard_data order by date'
    with db.get_pg_connection() as connection:
        df = db.query_database(connection, sql)
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    return utils.to_web_dict(df)

@app.route('/populate-weekly-retention-dashboard-data', methods=['GET'])
@login_required
def populate_weekly_retention_data():
    filepath = "{}/populate_weekly_retention_dashboard_data.sql".format(app.config['SQL_DIRECTORY'])
    with open(filepath, 'r') as f:
        sql = str(f.read())
    with db.get_datawarehouse_connection() as connection:
        df = db.query_database(connection, sql)
    with db.get_pg_connection() as connection:
        sql = '''create table if not exists weekly_retention_dashboard_data (
            date timestamp, 
            client varchar(100),
            w1_active_users int,
            w2_active_users int,
            w3_active_users int,
            w4_active_users int,
            cohort_size int
        )'''
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = 'delete from weekly_retention_dashboard_data'
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = 'insert into weekly_retention_dashboard_data values (%s, %s, %s, %s, %s, %s, %s)'
        with connection.cursor() as cursor:
            cursor.executemany(sql, df.values.tolist())

    return {'status': 200}

@app.route('/get-activation-funnel-dashboard-data', methods=['GET'])
@login_required
def get_activation_funnel_data():
    sql = 'select * from activation_funnel_dashboard_data order by date'
    with db.get_pg_connection() as connection:
        df = db.query_database(connection, sql)
    df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    return utils.to_web_dict(df)

@app.route('/populate-activation-funnel-dashboard-data', methods=['GET'])
@login_required
def populate_activation_funnel_dashboard_data():
    filepath = "{}/populate_activation_funnel_dashboard_data.sql".format(app.config['SQL_DIRECTORY'])
    with open(filepath, 'r') as f:
        sql = str(f.read())
    with db.get_datawarehouse_connection() as connection:
        df = db.query_database(connection, sql)
    with db.get_pg_connection() as connection:
        sql = '''create table if not exists activation_funnel_dashboard_data (
            date timestamp, 
            client varchar(100),
            n_new_users int,
            n_submitted_quiz int,
            percent float
        )'''
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = 'delete from activation_funnel_dashboard_data'
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = 'insert into activation_funnel_dashboard_data values (%s, %s, %s, %s, %s)'
        with connection.cursor() as cursor:
            cursor.executemany(sql, df.values.tolist())

    return {'status': 200}

@app.route('/login-user', methods=['POST'])
def login_user():
    username = request.json.get('username')
    password = request.json.get('password')
    session = db.alchemy.get_session()
    user = session.query(User).filter(User.username==username).first()
    response =  {'status': 401, 'errors': ["Invalid username and password"]}
    if user:
        hashed_password = user.password
        is_authenticated = bcrypt.checkpw(
            bytes(password, 'utf-8'),
            bytes(hashed_password, 'utf-8')
        )
        if is_authenticated:
            flask_login.login_user(user)
            response = {'status': 200}
    print('response:', response)
    return(response)

@app.route('/logout-user', methods=['POST'])
def logout_user():
    flask_login.logout_user()
    return {'status': 200}

@app.route('/populate-database', methods=['GET', 'POST'])
def populate_database():
    force_update = 'force-update' in request.args
    session = db.alchemy.get_session()
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
            session = db.alchemy.get_session()
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

    with db.data_warehouse.get_connection() as connection:
        df = db.data_warehouse.query_database(connection, sql)
    df['analysis_time'] = datetime.datetime.now()

    sql = '''insert into dau_dashboard_data ('''
    sql += ','.join(df.columns)
    sql += ') values ('
    sql += ','.join(['%s' for i in range(len(df.columns))])
    sql += ')'
    values = df.values.tolist()
    print('sql:', sql)

    with db.app.get_connection() as connection:
        with connection.cursor() as cursor:
            cursor.executemany(sql, values)

    return {'status': 200, 'sql': sql}

@celery.task
def populate_database_task():
    print('populate_database_task_id')
    with app.app_context():
        return etl.tasks.populate_database()

@app.route('/get-dashboard-data/<dashboard_name>')
def get_dashboard_data(dashboard_name):
    table_name = dashboard_name.replace('-', '_')
    sql = psycopg2.sql.SQL('select * from {}').format(psycopg2.sql.Identifier(table_name))
    with db.get_pg_connection() as connection:
        df = db.query_database(connection, sql)
    if 'date' in df.columns:
        df['date'] = pd.to_datetime(df['date']).dt.strftime('%Y-%m-%d')
    return utils.to_web_dict(df)

@app.route('/populate-dashboard-data/<dashboard_name>')
def populate_dashboard_data(dashboard_name):
    table_name = dashboard_name.replace('-', '_')
    filepath_etl = "{}/{}_etl.sql".format(
        app.config['SQL_DIRECTORY'],
        table_name
    )
    with open(filepath_etl, 'r') as f:
        sql = str(f.read())
        
    with db.get_datawarehouse_connection() as connection:
        df = db.query_database(connection, sql)
    filepath_schema = '{}/{}_schema.sql'.format(
        app.config['SQL_DIRECTORY'],
        table_name
    )
    with open(filepath_schema, 'r') as f:
        sql = psycopg2.sql.SQL(
            'create table if not exists {} {}'
        ).format(
            psycopg2.sql.Identifier(table_name),
            psycopg2.sql.SQL(str(f.read()))
        )
    with db.get_pg_connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = psycopg2.sql.SQL('delete from {}').format(psycopg2.sql.Identifier(table_name))
        with connection.cursor() as cursor:
            cursor.execute(sql)

        sql = psycopg2.sql.SQL('insert into {} ({}) values ({})').format(
            psycopg2.sql.Identifier(table_name),
            psycopg2.sql.SQL(',').join(map(psycopg2.sql.Identifier, df.columns)),
            psycopg2.sql.SQL(',').join(psycopg2.sql.Placeholder() * len(df.columns)),
        )

        with connection.cursor() as cursor:
            cursor.executemany(sql, df.values.tolist())

    return {'status': 200}
    
    
    
if __name__ == '__main__':
    app.run(debug=True, threaded=True)
