import datetime
import db
import models
from flask import current_app
from db import query_game_database


def extract_table(table):
    database = map_destination_table_to_game_database(table)
    source_table = map_destination_table_to_source_table(table)
    sql = map_destination_table_to_sql(table)
    data = query_game_database(database, sql)
    return data

def insert_table(data, table):
    engine = db.get_datawarehouse_alchemy_engine()
    return data.to_sql(table, engine, index=False)

def map_destination_table_to_game_database(table):
    return {
        'devices': current_app.config['GAME_USER_DATABASE'],
    }

def map_destination_table_to_source_table(table):
    return {
        'devices': current_app.config['GAME_DEVICES_TABLE']
    }

def map_destination_table_to_sql(table):
    project_home = current_app.config['PROJECT_HOME']
    file_path = '{}/etl/sql/{}.sql'.format(
        project_home,
        table,
    )
    with open(file_path, 'rb') as f:
        return f.read()

def populate_database():
    output = []
    for table in ['devices', 'events', 'users']:
        output.append(populate_table(table))
    set_task_status('populate_database', 'SUCCESS')
    return output

def populate_table(table):
    start = datetime.datetime.now()
    data = extract_table(table)
    insert_table(data, table)
    end = datetime.datetime.now()
    return {
        'status': 'SUCCESS',
        'n_rows': len(data),
        'time_taken': end - start,
    }

def set_task_status(task_name, status):
    timestamp = datetime.datetime.now()
    session = db.get_db()
    task = session.query(models.EtlTask).get(task_name)
    if task is None:
        task = models.EtlTask(name=task_name, status=status, timestamp=timestamp)
    else:
        task.status = status
        task.timestamp = timestamp
    session.add(task)
    session.commit()
    return True
