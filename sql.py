import struct
import pandas as pd
from database import get_connection


def get_column_names(database, table):
    sql = '''
SELECT 
    c.name 'Column Name',
    t.Name 'Data type',
    c.max_length 'Max Length',
    c.precision ,
    c.scale ,
    c.is_nullable,
    ISNULL(i.is_primary_key, 0) 'Primary Key'
FROM    
    sys.columns c
INNER JOIN 
    sys.types t ON c.user_type_id = t.user_type_id
LEFT OUTER JOIN 
    sys.index_columns ic ON ic.object_id = c.object_id AND ic.column_id = c.column_id
LEFT OUTER JOIN 
    sys.indexes i ON ic.object_id = i.object_id AND ic.index_id = i.index_id
WHERE
    c.object_id = OBJECT_ID('{}')
'''.format(table)
    df = query_database(database, sql)
    return df

def handle_datetimeoffset(dto_value):
    # ref: https://github.com/mkleehammer/pyodbc/issues/134#issuecomment-281739794
    tup = struct.unpack("<6hI2h", dto_value)  # e.g., (2017, 3, 16, 10, 35, 18, 0, -6, 0)
    tweaked = [tup[i] // 100 if i == 6 else tup[i] for i in range(len(tup))]
    return "{:04d}-{:02d}-{:02d} {:02d}:{:02d}:{:02d}.{:07d} {:+03d}:{:02d}".format(*tweaked)

def query_database(database, sql, *args, **kwargs):
    connection = get_connection(database)
    connection.add_output_converter(-155, handle_datetimeoffset)
    try:
        with connection.cursor() as cursor:
            print(*args)
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

def get_table_names(connection):
    sql = "select name from sysobjects where xtype = 'u'"
    df = query_database(connection, sql)
    df = df.sort_values('name')
    return df
