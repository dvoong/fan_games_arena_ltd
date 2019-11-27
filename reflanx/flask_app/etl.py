from db import get_db
from models import EtlTask

def get_task_status(name):
    session = get_db()
    task = session.query(EtlTask).get(name)
    return None if task is None else task.status

def populate_database():
    pass
