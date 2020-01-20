import pandas as pd
import etl.tasks

class Extractor:

    def __init__(self, batch_size=20000):
        self.batch_size = batch_size

    def extract(self, connection, sql, *args, **kwargs):
        with connection.cursor() as cursor:
            cursor.execute(sql, *args, **kwargs)
            i = 0
            rows = cursor.fetchmany(self.batch_size)
            total = len(rows)
            while rows != None and len(rows) != 0:
                print(f'batch: {i}')
                print(f'n_rows: {len(rows)}')
                print(f'total: {total}')
                rows = [list(r) for r in rows]
                columns = [c[0] for c in cursor.description]
                df = pd.DataFrame(rows, columns=columns)
                yield df
                i = i + 1
                rows = cursor.fetchmany(self.batch_size)
                total += len(rows)
