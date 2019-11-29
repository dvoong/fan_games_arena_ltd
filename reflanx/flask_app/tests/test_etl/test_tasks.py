import app
import datetime
import db
import etl.tasks
import pandas as pd
from pandas.testing import assert_frame_equal
from unittest.mock import Mock, patch
from tests import TestCase
from db import get_db, get_datawarehouse_connection
from etl.tasks import (
    extract_table,
    insert_table,
    populate_database,
    populate_table,
)


class TestExtractData(TestCase):

    @patch('etl.tasks.query_game_database')
    @patch('etl.tasks.map_destination_table_to_sql')
    @patch('etl.tasks.map_destination_table_to_source_table')
    @patch('etl.tasks.map_destination_table_to_game_database')
    def test(
            self,
            map_destination_table_to_game_database,
            map_destination_table_to_source_table,
            map_destination_table_to_sql,
            query_game_database
    ):
        table = 'devices'
        game_database = Mock()
        map_destination_table_to_game_database.return_value = game_database
        input_data = pd.DataFrame([(0, 1), (2, 3)])
        query_game_database.return_value = input_data
        sql = Mock()
        map_destination_table_to_sql.return_value = sql
        
        data = extract_table(table)

        query_game_database.assert_called_once()
        call = query_game_database[0]
        query_game_database.assert_called_once_with(game_database, sql)
        map_destination_table_to_game_database.assert_called_once_with('devices')
        map_destination_table_to_source_table.assert_called_once_with('devices')
        map_destination_table_to_sql.assert_called_once_with('devices')
        self.assertTrue(data.equals(input_data))

        
class TestInsertTable(TestCase):

    def test(self):

        data = pd.DataFrame([[0, 1], [2, 3]], columns=['a', 'b'])
        table = 'test_table'

        with app.app.app_context():
            output = etl.tasks.insert_table(data, table)
        
            with get_datawarehouse_connection() as connection:
                sql = 'select * from test_table'
                df = db.query_database(connection, sql)

        assert_frame_equal(df, data)


class TestPopulateDatabase(TestCase):

    @patch('etl.tasks.set_task_status')
    @patch('etl.tasks.populate_table')
    def test(self, populate_table, set_task_status):
        output = populate_database()
        populate_table.has_n_calls(3)
        set_task_status.assert_called_once_with('populate_database', 'SUCCESS')
        expected = [
            populate_table.return_value,
            populate_table.return_value,
            populate_table.return_value,
        ]
        self.assertEqual(output, expected)

        
class TestPopulateTable(TestCase):

    @patch('etl.tasks.datetime')
    @patch('etl.tasks.extract_table')
    @patch('etl.tasks.insert_table')
    def test(self, insert_table, extract_table, mock_datetime):

        t1 = datetime.datetime(2019, 1, 1, 1)
        t2 = datetime.datetime(2019, 1, 1, 2)
        mock_datetime.datetime.now.side_effect = [t1, t2]
        extract_table.return_value = [(0, 1), (2, 3)]
        table = 'devices'
        
        output = populate_table(table)
        
        extract_table.assert_called_once_with('devices')
        insert_table.assert_called_once_with(extract_table.return_value, 'devices')
        self.assertEqual(
            output,
            {
                'status': 'SUCCESS',
                'n_rows': 2,
                'time_taken': datetime.timedelta(hours=1),
            }
        )
