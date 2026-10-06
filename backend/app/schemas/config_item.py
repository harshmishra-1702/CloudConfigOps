from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ConfigItemCreate(BaseModel):
    name: str
    file_path: str
    file_type: str
    content: str
    environment: str

class ConfigItemUpdate(BaseModel):
    name: Optional[str] = None
    content: Optional[str] = None
    environment: Optional[str] = None
    is_locked: Optional[bool] = None

class ConfigItemResponse(BaseModel):
    id: int
    name: str
    file_path: str
    file_type: str
    content: str
    environment: str
    version: int
    is_locked: bool
    created_by: Optional[int]
    baseline_id: Optional[int]
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class ConfigHistory(BaseModel):
    version: str
    content: str
    committed_at: str
    commit_message: str
    commit_hash: str
