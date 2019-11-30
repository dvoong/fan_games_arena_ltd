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

    
class DauDashboardData(Base):
    __tablename__ = 'dau_dashboard_data'
    date = Column(Date, primary_key=True)
    client = Column(String, primary_key=True)
    tenure = Column(String, primary_key=True)
    analysis_time = Column(DateTime, primary_key=True)
    dau = Column(Integer)


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
