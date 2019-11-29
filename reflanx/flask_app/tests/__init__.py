import psycopg2
import unittest

import app
import db
from db import get_db
from models import Base


def clear_data(session):
    meta = Base.metadata
    for table in reversed(meta.sorted_tables):
        session.execute(table.delete())
    session.commit()

def flush_database(database_uri):
    with psycopg2.connect(database_uri) as connection:
        connection.autocommit = True
        with connection.cursor() as cursor:
            sql = 'select current_user'
            cursor.execute(sql)
            current_user = cursor.fetchone()[0]
            sql = 'DROP SCHEMA public CASCADE;'
            cursor.execute(sql)
            sql = 'CREATE SCHEMA public;'
            cursor.execute(sql)
            sql = 'GRANT ALL ON SCHEMA public TO {};'.format(current_user)
            cursor.execute(sql)

class TestCase(unittest.TestCase):

    def setUp(self):
        super().setUp()
        with app.app.app_context():
            assert app.app.config['ENV'] == 'test', 'tests must be run in the test environment'
            session = get_db()
        clear_data(session)

        with app.app.app_context():
            flush_database(app.app.config['DATAWAREHOUSE_URI'])

        self.client = app.app.test_client()
        
    def tearDown(self):
        super().tearDown()
        with app.app.app_context():
            session = get_db()
        clear_data(session)

        with app.app.app_context():
            flush_database(app.app.config['DATAWAREHOUSE_URI'])
