from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ChangeRequestCreate(BaseModel):
    title: str
    description: Optional[str] = None
    config_item_id: int
    priority: str = 'medium'
    diff_content: str

class ChangeRequestUpdate(BaseModel):
    status: Optional[str] = None
    review_comment: Optional[str] = None
    reviewer_id: Optional[int] = None

class ChangeRequestResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    config_item_id: int
    requester_id: int
    reviewer_id: Optional[int]
    status: str
    priority: str
    diff_content: Optional[str]
    review_comment: Optional[str]
    deployed_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    
    requester_name: str
    config_item_name: str

    model_config = ConfigDict(from_attributes=True)

class ApprovalAction(BaseModel):
    comment: str
