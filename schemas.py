from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import date

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "user"

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Transaction Schemas ---
class TransactionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=50)
    amount: float
    date: date
    status: Optional[str] = "Completed"
    is_positive: bool = False

class TransactionCreate(TransactionBase):
    pass

class TransactionUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    amount: Optional[float] = None
    date: Optional[date] = None
    status: Optional[str] = None
    is_positive: Optional[bool] = None

class Transaction(TransactionBase):
    id: int

    class Config:
        from_attributes = True
