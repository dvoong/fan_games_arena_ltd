import psycopg2
from flask import current_app

import db.pg


def get_connection():
    database_uri = current_app.config['DATA_WAREHOUSE_DATABASE']
    return psycopg2.connect(database_uri)

query_database = db.pg.query_database
