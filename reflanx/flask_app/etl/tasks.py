import datetime
import db
import models
from flask import current_app
from db import query_game_database


def extract_table(table):
    connection = map_destination_table_to_game_database(table)
    sql = map_destination_table_to_sql(table)
    data = query_game_database(connection, sql)
    return data

def get_task_status(name):
    session = db.get_db()
    task = session.query(models.EtlTask).get(name)
    return None if task is None else task.status

def insert_table(data, table):
    engine = db.get_datawarehouse_alchemy_engine()
    return data.to_sql(table, engine, if_exists='replace', index=False)

def map_destination_table_to_game_database(table):
    if table in ['devices', 'users']:
        return db.get_game_database_connection(
            current_app.config['GAME_USER_DATABASE']
        )
    elif table == 'events':
        return db.get_game_database_connection(
            current_app.config['GAME_LOGS_DATABASE']
        )
    else:
        raise Exception('unrecognised table: {}'.format(table))

def map_destination_table_to_sql(table):
    project_home = current_app.config['PROJECT_HOME']
    file_path = '{}/etl/sql/{}.sql'.format(
        project_home,
        table,
    )
    with open(file_path, 'r') as f:
        return str(f.read())

def populate_database():
    print('populate_database')
    output = []
    for table in ['devices', 'events', 'users']:
        print('table:', table)
        output.append(populate_table(table))
    return output

def populate_table(table):
    start = datetime.datetime.now()
    data = extract_table(table)
    insert_table(data, table)
    end = datetime.datetime.now()
    return {
        'table': table,
        'status': 'SUCCESS',
        'n_rows': len(data),
        'time_taken': (end - start).total_seconds(),
    }
