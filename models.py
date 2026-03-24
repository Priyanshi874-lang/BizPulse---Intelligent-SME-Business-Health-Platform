from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    full_name = Column(String(100))
    role = Column(String(20), default="user") # 'admin' or 'user'
    is_active = Column(Boolean, default=True)

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), index=True)
    category = Column(String(50), index=True)
    amount = Column(Float)
    date = Column(Date)
    status = Column(String(20), default="Completed")
    is_positive = Column(Boolean, default=False)
