import os
import struct

import pandas as pd
import pyodbc


databases = {
    'logs': os.environ['GAME_LOGS_DATABASE_NAME'],
    'users': os.environ['GAME_USER_DATABASE_NAME'],
    'quiz_games': os.environ['GAME_QUIZGAMES_DATABASE_NAME'],
}

driver = '/usr/local/lib/libtdsodbc.so' # FreeTDS
host = os.environ['GAME_DATABASE_HOST']
password = os.environ['GAME_DATABASE_PASSWORD']
user = os.environ['GAME_DATABASE_USER']

def get_connection(database_name, host=host, password=password, user=user):
    assert database_name in databases, \
        'invalid game database: {}' \
        '\nvalid databases: {}'.format(database_name, list(databases.keys()))

    database_name = databases[database_name]
    connection = pyodbc.connect(
        server=host,
        database=database_name,
        user=user,
        tds_version='auto',
        password=password,
        port=1433,
        driver=driver
    )
    connection.add_output_converter(-155, handle_datetimeoffset)
    return connection

def handle_datetimeoffset(dto_value):
    # ref: https://github.com/mkleehammer/pyodbc/issues/134#issuecomment-281739794
    tup = struct.unpack("<6hI2h", dto_value)  # e.g., (2017, 3, 16, 10, 35, 18, 0, -6, 0)
    tweaked = [tup[i] // 100 if i == 6 else tup[i] for i in range(len(tup))]
    return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}.{:07d} {:+03d}:{:02d}".format(*tweaked)

def query_database(connection, sql, *args, **kwargs):
    with connection.cursor() as cursor:
        cursor.execute(sql, *args, **kwargs)
        rows = cursor.fetchall()
        rows = [list(r) for r in rows]
        columns = [c[0] for c in cursor.description]
    df = pd.DataFrame(rows, columns=columns)
    return df


# def query_database(database, sql, *args, **kwargs):
#     connection = get_connection(database)
#     connection.add_output_converter(-155, handle_datetimeoffset)
#     try:
#         with connection.cursor() as cursor:
#             print(*args)
#             cursor.execute(sql, *args, **kwargs)
#             rows = cursor.fetchall()
#             rows = [list(r) for r in rows]
#             columns = [c[0] for c in cursor.description]
#     except Exception as e:
#         raise e
#     finally:
#         connection.close()
#     df = pd.DataFrame(rows, columns=columns)
#     return df


# def query_database(connection, sql, *args, **kwargs):
#     try:
#         with connection.cursor() as cursor:
#             cursor.execute(sql, *args, **kwargs)
#             rows = cursor.fetchall()
#             rows = [list(r) for r in rows]
#             columns = [c[0] for c in cursor.description]
#     except Exception as e:
#         raise e
#     finally:
#         connection.close()
#     df = pd.DataFrame(rows, columns=columns)
#     return df

