import db.alchemy
from models import EtlTask

def get_task_status(name):
    session = db.alchemy.get_session()
    task = session.query(EtlTask).get(name)
    return None if task is None else task.status

def populate_database():
    pass
