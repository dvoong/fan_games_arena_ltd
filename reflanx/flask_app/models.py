import redis
from flask import current_app
from flask_login import UserMixin
from sqlalchemy import Column, Date, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base


Base = declarative_base()

class User(UserMixin, Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)


class EtlTask(Base):
    __tablename__ = 'etl_task'
    id = Column(UUID(as_uuid=True))
    name = Column(String, primary_key=True)
    created_at = Column(DateTime)
    finished_at = Column(DateTime, nullable=True)

    @property
    def status(self):
        result = current_app.celery.AsyncResult(str(self.id))
        return result.status
        
    @property
    def result(self):
        result = current_app.celery.AsyncResult(str(self.id))
        return result.result
