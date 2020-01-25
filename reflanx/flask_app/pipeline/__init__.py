import db
import db.data_warehouse
import psycopg2.sql

def populate_dataset(dataset_name):
    table_name = dataset_name.replace('-', '_')
    filepath_etl = "{}/{}_query.sql".format(
        'pipeline/datasets/sql',
        table_name
    )
    with open(filepath_etl, 'r') as f:
        sql = str(f.read())

    print('sql:', sql)
        
    with db.data_warehouse.get_connection() as connection:
        df = db.data_warehouse.query_database(connection, sql)
    filepath_schema = '{}/{}_schema.sql'.format(
        'pipeline/datasets/sql',
        table_name
    )

    print('df:', df)

    with db.app.get_connection() as connection:
        with connection.cursor() as cursor:
            sql = '''drop table if exists {}'''.format(table_name)
            cursor.execute(sql)
            
            with open(filepath_schema, 'r') as f:
                sql = psycopg2.sql.SQL(
                    'create table if not exists {} {}'
                ).format(
                    psycopg2.sql.Identifier(table_name),
                    psycopg2.sql.SQL(str(f.read()))
                )
            cursor.execute(sql)
            
            sql = psycopg2.sql.SQL('insert into {} ({}) values ({})').format(
                psycopg2.sql.Identifier(table_name),
                psycopg2.sql.SQL(',').join(map(psycopg2.sql.Identifier, df.columns)),
                psycopg2.sql.SQL(',').join(psycopg2.sql.Placeholder() * len(df.columns)),
            )

            cursor.executemany(sql, df.values.tolist())
    
