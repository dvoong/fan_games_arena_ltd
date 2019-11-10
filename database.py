import os
import pandas as pd, pyodbc


databases = {
    'logs': os.environ['LOGS_DATABASE'],
    'users': os.environ['USERS_DATABASE'],
    'quiz_games': os.environ['QUIZGAMES_DATABASE'],
}
host = os.environ['DATABASE_HOST']
password = os.environ['DATABASE_PASSWORD']
user = os.environ['DATABASE_USER']

def get_connection(database_name, host=host, password=password, user=user):
    database_name = databases[database_name] if database_name in databases else database_name
    return pyodbc.connect(
        server=host,
        database=database_name,
        user=user,
        tds_version='auto',
        password=password,
        port=1433,
        driver='FreeTDS'
    )

