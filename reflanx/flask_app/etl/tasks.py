import datetime
from flask import current_app

import db
import db.game
import db.data_warehouse
import models
import pipeline.game


def drop_table(table):
    with db.data_warehouse.get_connection() as connection:
        with connection.cursor() as cursor:
            sql = f'''drop table {table}'''
            cursor.execute(sql)

def extract_table(table):
    connection = map_destination_table_to_game_database(table)
    sql = map_destination_table_to_sql(table)
    extractor = pipeline.game.Extractor()
    data = extractor.extract(connection, sql)
    return data

def get_task_status(name):
    session = db.get_db()
    task = session.query(models.EtlTask).get(name)
    return None if task is None else task.status

def insert_table(data, table):
    engine = db.data_warehouse.get_alchemy_engine()
    return data.to_sql(table, engine, if_exists='append', index=False)

def map_destination_table_to_game_database(table):
    if table in ['devices', 'users']:
        database_name = 'users'
    elif table == 'events':
        database_name = 'logs'
    else:
        raise Exception('unrecognised table: {}'.format(table))
    connection = db.game.get_connection(database_name)
    return connection

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
    n_rows = 0
    drop_table(table)
    for i, batch in enumerate(data):
        print(f'populate_table({table}).batch:', i)
        insert_table(batch, table)
        n_rows = n_rows + len(batch)
    end = datetime.datetime.now()
    return {
        'table': table,
        'status': 'SUCCESS',
        'n_rows': n_rows,
        'time_taken': (end - start).total_seconds(),
    }
