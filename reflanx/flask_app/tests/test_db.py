import app, db
from unittest import TestCase
from unittest.mock import Mock, patch


class TestDb(TestCase):

    @patch('db.sessionmaker')
    def test_returns_a_sqlalchemy_session_using_the_engine_in_the_app_config(
            self,
            sessionmaker
    ):
        with app.app.app_context():
            Session = Mock()
            sessionmaker.return_value = Session
            session = db.get_db()
            sessionmaker.assert_called_once_with(bind=app.app.config['DATABASE_ENGINE'])
            self.assertEqual(session, Session.return_value)


class TestGetDatawarehouseConnection(TestCase):

    @patch('db.psycopg2')
    def test(self, psycopg2):
        with app.app.app_context():
            connection = db.get_datawarehouse_connection()

        self.assertEqual(connection, psycopg2.connect.return_value)
        psycopg2.connect.assert_called_once_with(app.app.config['DATAWAREHOUSE_URI'])


class TestQueryGameDatabase(TestCase):

    def test(self):
        self.assertTrue(False)
