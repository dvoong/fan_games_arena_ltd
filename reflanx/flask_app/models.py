from sqlalchemy import Column, Date, DateTime, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from flask_login import UserMixin


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
    name = Column(String, primary_key=True)
    status = Column(String)
    timestamp = Column(DateTime)
