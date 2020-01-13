from flask import current_app
from sqlalchemy.orm import sessionmaker


def get_session():
    Session = sessionmaker(bind=current_app.config['DATABASE_ENGINE'])
    return Session()
