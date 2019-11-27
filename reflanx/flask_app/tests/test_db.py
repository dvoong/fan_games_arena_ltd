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
    
