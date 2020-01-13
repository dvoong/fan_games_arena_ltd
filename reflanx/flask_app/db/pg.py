import pandas as pd


def query_database(connection, sql, *args, **kwargs):
    print('connection:', connection)
    print('sql:', sql)
    with connection.cursor() as cursor:
        cursor.execute(sql, *args, **kwargs)
        rows = cursor.fetchall()
        columns = [c[0] for c in cursor.description]
    return pd.DataFrame(rows, columns=columns)
