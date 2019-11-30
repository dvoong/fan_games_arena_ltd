import datetime
import bcrypt
import app
import db
import models
import sql
from unittest.mock import patch
from models import Base, EtlTask
from db import get_db
from tests import TestCase


class TestPopulateDatabase(TestCase):


    @patch('app.populate_database_task')
    @patch('app.datetime')
    def test_force_update(self, mock_datetime, populate_database_task):

        t1 = datetime.datetime(2019, 1, 1, 1)
        t2 = datetime.datetime(2019, 1, 1, 2)
        mock_datetime.datetime.now.return_value = t2
        with app.app.app_context():
            session = db.get_db()
            task = models.EtlTask(name='populate_database', status='RUNNING', timestamp=t1)
            session.add(task)
            session.commit()
            
        with app.app.test_request_context() as request:
            request.request.args = {'force-update': ''}
            response = app.populate_database()

        with app.app.app_context():            
            session = db.get_db()
            task = session.query(EtlTask).get('populate_database')
        self.assertEqual(task.status, 'RUNNING')
        self.assertEqual(task.timestamp, t2)
        populate_database_task.delay.assert_called_once()

    
    @patch('app.datetime')
    @patch('app.etl.tasks.get_task_status')
    @patch('app.populate_database_task')
    def test_if_task_has_not_run_before_run_task(
            self,
            populate_database_task,
            get_task_status,
            mock_datetime
    ):
        get_task_status.return_value = None
        mock_datetime.datetime.now.return_value = datetime.datetime(2019, 1, 1, 1)

        with app.app.test_request_context():
            response = app.populate_database()
        
        with app.app.app_context():
            session = get_db()
            tasks = session.query(EtlTask).all()

        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].status, 'RUNNING')
        self.assertEqual(tasks[0].timestamp, datetime.datetime(2019, 1, 1, 1))
        populate_database_task.delay.assert_called_once()

    @patch('app.datetime')
    @patch('app.etl.tasks.get_task_status')
    @patch('app.populate_database_task')
    def test_if_task_has_already_run_successfully_then_run_a_new_task(
            self,
            populate_database_task,
            get_task_status,
            mock_datetime,
    ):
        with app.app.app_context():
            existing_task = EtlTask(
                name='populate_database',
                status='SUCCESS',
                timestamp=datetime.datetime(2018, 1, 1, 1)
            )
            session = get_db()
            session.add(existing_task)
            session.commit()
        get_task_status.return_value = 'SUCCESS'
        mock_datetime.datetime.now.return_value = datetime.datetime(2019, 1, 1, 1)

        with app.app.test_request_context():
            app.populate_database()
        
        with app.app.app_context():
            session = get_db()
            tasks = session.query(EtlTask).all()

        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].status, 'RUNNING')
        self.assertEqual(tasks[0].timestamp, datetime.datetime(2019, 1, 1, 1))
        populate_database_task.delay.assert_called_once()


    @patch('app.datetime')
    @patch('app.etl.tasks.get_task_status')
    @patch('app.populate_database_task')
    def test_if_task_is_already_running_then_wait(
            self,
            populate_database_task,
            get_task_status,
            mock_datetime,
    ):
        with app.app.app_context():
            existing_task = EtlTask(
                name='populate_database',
                status='RUNNING',
                timestamp=datetime.datetime(2018, 1, 1, 1)
            )
            session = get_db()
            session.add(existing_task)
            session.commit()
        get_task_status.return_value = 'RUNNING'

        with app.app.test_request_context():
            response = app.populate_database()
        
        with app.app.app_context():
            session = get_db()
            tasks = session.query(EtlTask).all()

        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].status, 'RUNNING')
        self.assertEqual(tasks[0].timestamp, datetime.datetime(2018, 1, 1, 1))
        populate_database_task.delay.not_called()

    def test_functional(self):
        client = app.app.test_client()
        response = client.get('/populate-database')
        self.assertEqual(
            response.json,
            {'status': 200, 'message': 'started populate_database task'}
        )

        # task still running
        response = client.post('/populate-database')
        self.assertEqual(
            response.json,
            {
                'status': 200,
                'message': 'populate_database task currently running'
            }
        )

        # task finishes
        with app.app.app_context():
            session = get_db()
            existing_task = session.query(EtlTask).get('populate_database')
            session.delete(existing_task)
            task = EtlTask(
                name='populate_database',
                status='SUCCESS',
                timestamp=datetime.datetime.now()
            )
            session.add(task)
            session.commit()

        # rerun task
        client = app.app.test_client()
        response = client.post('/populate-database')
        self.assertEqual(
            response.json,
            {'status': 200, 'message': 'started populate_database task'}
        )


class TestPopulateDatabaseTask(TestCase):

    # calls the etl.tasks.populate_database task

    @patch('app.etl.tasks.populate_database')
    def test_calls_etl_tasks_populate_database_in_an_app_context(self, populate_database):
        app.populate_database_task()
        populate_database.assert_called_once()


class TestLoginUser(TestCase):

    def test_valid_login(self):
        with app.app.app_context():
            session = db.get_db()
            password = b'test_password'
            username = 'test_user'
            hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())
            hashed_password = hashed_password.decode('utf-8')
            user = models.User(username=username, password=hashed_password)
            session.add(user)
            session.commit()

        response = self.client.post(
            '/login-user',
            json={'username': 'test_user', 'password': 'test_password'}
        )

        self.assertEqual(response.json, {'status': 200})

    def test_wrong_password(self):
        with app.app.app_context():
            session = db.get_db()
            password = b'test_password'
            username = 'test_user'
            hashed_password = bcrypt.hashpw(password, bcrypt.gensalt())
            hashed_password = hashed_password.decode('utf-8')
            user = models.User(username=username, password=hashed_password)
            session.add(user)
            session.commit()

        response = self.client.post(
            '/login-user',
            json={'username': 'test_user', 'password': 'test_wrong_password'}
        )

        self.assertEqual(
            response.json,
            {
                'status': 401,
                'errors': ["Invalid username and password"]
            }
        )

    def test_user_does_not_exist(self):
        response = self.client.post(
            '/login-user',
            json={'username': 'test_user', 'password': 'test_password'}
        )

        self.assertEqual(
            response.json,
            {
                'status': 401,
                'errors': ["Invalid username and password"]
            }
        )

    
