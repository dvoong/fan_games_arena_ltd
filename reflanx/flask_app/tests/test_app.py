import datetime
import sql
import app
from unittest.mock import patch
from models import Base, EtlTask
from db import get_db
from tests import TestCase


class TestPopulateDatabase(TestCase):

    @patch('app.datetime')
    @patch('app.get_task_status')
    @patch('app.populate_database_task')
    def test_if_task_has_not_run_before_run_task(self, populate_database_task, get_task_status, mock_datetime):
        get_task_status.return_value = None
        mock_datetime.datetime.now.return_value = datetime.datetime(2019, 1, 1, 1)
        with app.app.app_context():
            response = app.populate_database()
            session = get_db()
            tasks = session.query(EtlTask).all()

        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].status, 'RUNNING')
        self.assertEqual(tasks[0].timestamp, datetime.datetime(2019, 1, 1, 1))
        populate_database_task.delay.assert_called_once()

    @patch('app.datetime')
    @patch('app.get_task_status')
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
        
        with app.app.app_context():
            app.populate_database()
            session = get_db()
            tasks = session.query(EtlTask).all()

        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].status, 'RUNNING')
        self.assertEqual(tasks[0].timestamp, datetime.datetime(2019, 1, 1, 1))
        populate_database_task.delay.assert_called_once()


    @patch('app.datetime')
    @patch('app.get_task_status')
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
        
        with app.app.app_context():
            app.populate_database()
            session = get_db()
            tasks = session.query(EtlTask).all()

        self.assertEqual(len(tasks), 1)
        self.assertEqual(tasks[0].status, 'RUNNING')
        self.assertEqual(tasks[0].timestamp, datetime.datetime(2018, 1, 1, 1))
        populate_database_task.delay.not_called()

    def test_functional(self):
        client = app.app.test_client()
        response = client.post('/api/populate-database')
        self.assertEqual(
            response.json,
            {'status': 200, 'message': 'started populate_database task'}
        )

        # task still running
        response = client.post('/api/populate-database')
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
        response = client.post('/api/populate-database')
        self.assertEqual(
            response.json,
            {'status': 200, 'message': 'started populate_database task'}
        )
