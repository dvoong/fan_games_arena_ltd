import os, struct, datetime
import pandas as pd, psycopg2, pyodbc, sqlalchemy

def handle_datetimeoffset(dto_value):
    # ref: https://github.com/mkleehammer/pyodbc/issues/134#issuecomment-281739794
    tup = struct.unpack("<6hI2h", dto_value)  # e.g., (2017, 3, 16, 10, 35, 18, 0, -6, 0)
    tweaked = [tup[i] // 100 if i == 6 else tup[i] for i in range(len(tup))]
    return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}.{:07d} {:+03d}:{:02d}".format(*tweaked)

game_database_host = os.environ['DATABASE_HOST']
game_database_password = os.environ['DATABASE_PASSWORD']
game_database_user = os.environ['DATABASE_USER']
game_logs_database = os.environ['LOGS_DATABASE']
game_users_database = os.environ['USERS_DATABASE']
data_warehouse_uri = os.environ.get(
    'DATA_WAREHOUSE_URI',
    'postgresql://fga_dashboards@localhost/fga_data_warehouse'
)

start = datetime.datetime.now()

# events
connection = pyodbc.connect(
    database=game_logs_database,
    driver='FreeTDS',
    password=game_database_password,
    port=1433,
    server=game_database_host,
    tds_version='auto',
    user=game_database_user
)
connection.add_output_converter(-155, handle_datetimeoffset)
print('connection: ', connection)
sql = '''
select 
  id, 
  createdAt, 
  action, 
  currentUser, 
  userDevice, 
  userCountry 

from LogQuizProd

'''
with connection.cursor() as cursor:
    cursor.execute(sql)
    rows = cursor.fetchall()
    rows = [list(r) for r in rows]
    columns = [c for c in cursor.description]

sql = '''drop table if exists events'''
with psycopg2.connect(
        'postgresql://fga_dashboards@localhost/fga_data_warehouse'
) as connection:
    with connection.cursor() as cursor:
        cursor.execute(sql)

sql = '''
create table events (
  id uuid primary key,
  created_at timestamp,
  action varchar(50),
  user_id varchar(100),
  device_id varchar(100),
  country varchar(50)
)
'''
with psycopg2.connect('postgresql://fga_dashboards@localhost/fga_data_warehouse') as connection:
    with connection.cursor() as cursor:
        cursor.execute(sql)

sql = '''insert into events values (%s, %s, %s, %s, %s, %s)'''
with psycopg2.connect('postgresql://fga_dashboards@localhost/fga_data_warehouse') as connection:
    with connection.cursor() as cursor:
        cursor.executemany(sql, rows)


# users
connection = pyodbc.connect(
    database=game_users_database,
    driver='FreeTDS',
    password=game_database_password,
    port=1433,
    server=game_database_host,
    tds_version='auto',
    user=game_database_user
)
connection.add_output_converter(-155, handle_datetimeoffset)
print('connection: ', connection)
sql = '''
select 
  Id,
  CreatedAt as created_at,
  IsBot
  
 from FGAUsers

'''
with connection.cursor() as cursor:
    cursor.execute(sql)
    rows = cursor.fetchall()
    rows = [list(r) for r in rows]
    columns = [c for c in cursor.description]

table_name = 'users'
sql = '''drop table if exists {}'''.format(table_name)
with psycopg2.connect(
        'postgresql://fga_dashboards@localhost/fga_data_warehouse'
) as connection:
    with connection.cursor() as cursor:
        cursor.execute(sql)

sql = '''
create table {} (
  id varchar(100) primary key,
  created_at timestamp,
  is_bot boolean
)
'''.format(table_name)
with psycopg2.connect('postgresql://fga_dashboards@localhost/fga_data_warehouse') as connection:
    with connection.cursor() as cursor:
        cursor.execute(sql)


sql = '''insert into {} values (%s, %s, %s)'''.format(table_name)
with psycopg2.connect('postgresql://fga_dashboards@localhost/fga_data_warehouse') as connection:
    with connection.cursor() as cursor:
        cursor.executemany(sql, rows)

# devices
connection = pyodbc.connect(
    database=game_users_database,
    driver='FreeTDS',
    password=game_database_password,
    port=1433,
    server=game_database_host,
    tds_version='auto',
    user=game_database_user
)
connection.add_output_converter(-155, handle_datetimeoffset)
print('connection: ', connection)
sql = '''
select 
  Id as id,
  DeviceOS as client,
  AppVersion as app_version,
  UserID as user_id,
  CreatedAt as created_at
  
from FGAUserDevices

'''
with connection.cursor() as cursor:
    cursor.execute(sql)
    rows = cursor.fetchall()
    rows = [list(r) for r in rows]
    columns = [c for c in cursor.description]

table_name = 'devices'
sql = '''drop table if exists {}'''.format(table_name)
with psycopg2.connect(
        'postgresql://fga_dashboards@localhost/fga_data_warehouse'
) as connection:
    with connection.cursor() as cursor:
        cursor.execute(sql)

sql = '''
create table {} (
  id varchar(100) primary key,
  client varchar(50),
  app_version varchar(100),
  user_id varchar(100),
  created_at timestamp
)
'''.format(table_name)
with psycopg2.connect('postgresql://fga_dashboards@localhost/fga_data_warehouse') as connection:
    with connection.cursor() as cursor:
        cursor.execute(sql)

sql = '''insert into {} values (%s, %s, %s, %s, %s)'''.format(table_name)
with psycopg2.connect('postgresql://fga_dashboards@localhost/fga_data_warehouse') as connection:
    with connection.cursor() as cursor:
        cursor.executemany(sql, rows)

duration = datetime.datetime.now() - start
print('duration:', duration)
