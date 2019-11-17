FROM python:3

WORKDIR app
RUN pip install flask
RUN pip install gunicorn
RUN pip install flask_sqlalchemy
RUN pip install flask_user
RUN pip install python-decouple
RUN pip install psycopg2
ARG ENV_FILE
COPY app.py .
COPY $ENV_FILE .env
CMD ["gunicorn", "-b", "0.0.0.0:5000", "app:app"]
