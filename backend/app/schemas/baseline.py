from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Dict

class BaselineCreate(BaseModel):
    name: str
    description: Optional[str] = None
    config_snapshot: Dict[str, str]
    environment: str

class BaselineResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    config_snapshot: Dict[str, str]
    environment: str
    is_active: bool
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime]

    model_config = ConfigDict(from_attributes=True)

class DriftItem(BaseModel):
    config_name: str
    expected_hash: str
    actual_hash: str
    drift_detected: bool
    risk_score: int
    severity: str
    details: str

class DriftReport(BaseModel):
    baseline_name: str
    environment: str
    drifts: list[DriftItem]
    overall_risk_score: int
    scan_timestamp: str
