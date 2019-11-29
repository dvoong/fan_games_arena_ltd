import datetime
import app
from tests import TestCase
from db import get_db
from etl import get_task_status
from models import EtlTask


class TestGetTaskStatus(TestCase):

    def test_returns_the_task_status_of_a_task_with_specified_name(self):
        name = 'name'
        current_status = 'RUNNING'
        timestamp = datetime.datetime(2019, 1, 1, 1)
        with app.app.app_context():
            session = get_db()
            etl_task = EtlTask(name=name, status=current_status, timestamp=timestamp)
            session.add(etl_task)
            session.commit()
        
            status = get_task_status(name)

        self.assertEqual(status, current_status)

    def test_returns_None_if_no_existing_task(self):
        name = 'name'
        with app.app.app_context():
            status = get_task_status(name)

        self.assertEqual(status, None)
        
