import unittest

import app
from db import get_db
from models import Base


def clear_data(session):
    meta = Base.metadata
    for table in reversed(meta.sorted_tables):
        session.execute(table.delete())
    session.commit()


class TestCase(unittest.TestCase):

    def setUp(self):
        super().setUp()
        with app.app.app_context():
            assert app.app.config['ENV'] == 'test', 'tests must be run in the test environment'
            session = get_db()
        clear_data(session)
        
    def tearDown(self):
        super().tearDown()
        with app.app.app_context():
            session = get_db()
        clear_data(session)
