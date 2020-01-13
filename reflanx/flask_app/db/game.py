import pandas as pd


def query_database(connection, sql, *args, **kwargs):
    try:
        with connection.cursor() as cursor:
            cursor.execute(sql, *args, **kwargs)
            rows = cursor.fetchall()
            rows = [list(r) for r in rows]
            columns = [c[0] for c in cursor.description]
    except Exception as e:
        raise e
    finally:
        connection.close()
    df = pd.DataFrame(rows, columns=columns)
    return df
