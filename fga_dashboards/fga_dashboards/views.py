from django.contrib.auth.decorators import login_required
from django.http import HttpResponse, JsonResponse
from django.shortcuts import redirect, render

import datetime
import pandas as pd

from sql import query_database


@login_required
def home(request):
    context = {}
    template = 'home.html'
    return render(request, template, context)

def index(request):
    if request.user.is_authenticated:
        return redirect('/home')
    else:
        return redirect('/accounts/login')

@login_required
def get_data(request):
    data = {}
    
    start = request.GET.get('start')
    end = request.GET.get('end')

    where = ''
    if start != None:
        where = 'where createdAt >= ?'
    if end != None:
        if where == '':
            where = 'where createdAt < ?'
        else:
            where = ' and createdAt < ?'
    values = [value for value in [start, end] if value != None]

    sql = '''
select 
    createdAt, 
    currentUser,
    userDevice
    
from LogPlusPROD

{where}
'''.format(where=where)
    df_logs = query_database('logs', sql, *values)

    sql = '''
select id, DeviceOS from FGAUserDevices
'''
    df_devices = query_database('users', sql)

    df = pd.merge(df_logs, df_devices, left_on='userDevice', right_on='id')
    df['createdAt'] = pd.to_datetime(df['createdAt'])
    df = df.drop(['id', 'userDevice'], axis=1)
    df['createdAt'] = pd.to_datetime(df['createdAt']).dt.date
    df = df.rename(
        columns={'createdAt': 'date', 'DeviceOS': 'client', 'currentUser': 'dau'}
    )

    df_all = df.groupby(['date'])[['dau']].nunique()
    df_all = df_all.reset_index()
    df_all['date'] = df_all['date'].map(lambda t: t.isoformat())
    df_all['client'] = 'All'
    df_all = df_all[['date', 'client', 'dau']]

    df_by_client = df.groupby(['date', 'client'])[['dau']].nunique()
    df_by_client = df_by_client.reset_index()
    df_by_client['date'] = df_by_client['date'].map(lambda t: t.isoformat())

    df = pd.concat([df_all, df_by_client], axis=0)
    data['dau'] = {
        'headers': [c for c in df.columns],
        'values': df.values.tolist(),
    }

    return JsonResponse(data)
