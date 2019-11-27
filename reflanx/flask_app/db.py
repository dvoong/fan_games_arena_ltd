from sqlalchemy.orm import sessionmaker
from flask import current_app


def get_db():
    Session = sessionmaker(bind=current_app.config['DATABASE_ENGINE'])
    return Session()
