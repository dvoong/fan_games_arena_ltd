import datetime
from unittest import TestCase
from models import EtlTask


class TestEtlTask(TestCase):

    def test_attributes(self):

        timestamp = datetime.datetime.now()
        task = EtlTask(name='name', status='RUNNING', timestamp=timestamp)
        self.assertEqual(task.name, 'name')
        self.assertEqual(task.status, 'RUNNING')
        self.assertEqual(task.timestamp, timestamp)
