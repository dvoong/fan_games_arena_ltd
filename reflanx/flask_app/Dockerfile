FROM python:3

WORKDIR app
RUN pip install flask
RUN pip install gunicorn
RUN pip install flask_sqlalchemy
RUN pip install flask_user
RUN pip install python-decouple
RUN pip install psycopg2
RUN pip install pandas

RUN apt-get update
RUN apt-get install unixodbc -y
RUN apt-get install unixodbc-dev -y

RUN pip install pyodbc
RUN pip install redis
RUN pip install celery

ENV PYTHONPATH "${PYTHONPATH}:/app"
COPY . .

CMD ["./entrypoint.sh"]

