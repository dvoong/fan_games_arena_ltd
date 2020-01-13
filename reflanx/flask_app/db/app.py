import psycopg2
from flask import current_app

import db.pg


def get_connection():
    return psycopg2.connect(current_app.config['APP_DATABASE'])

query_database = db.pg.query_database
