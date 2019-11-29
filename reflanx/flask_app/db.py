import pandas as pd
import psycopg2
import sqlalchemy
from sqlalchemy.orm import sessionmaker
from flask import current_app


def get_datawarehouse_connection():
    database_uri = current_app.config['DATAWAREHOUSE_URI']
    return psycopg2.connect(database_uri)

def get_datawarehouse_alchemy_engine():
    database_uri = current_app.config['DATAWAREHOUSE_URI']
    return sqlalchemy.create_engine(database_uri)

def get_db():
    Session = sessionmaker(bind=current_app.config['DATABASE_ENGINE'])
    return Session()

def query_database(connection, sql, *args, **kwargs):
    with connection.cursor() as cursor:
        cursor.execute(sql, *args, **kwargs)
        rows = cursor.fetchall()
        columns = [c[0] for c in cursor.description]
    return pd.DataFrame(rows, columns=columns)

def query_game_database():
    pass
