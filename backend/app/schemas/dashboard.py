from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DashboardStats(BaseModel):
    total_resources: int
    active_drift_alerts: int
    compliance_score: int
    mttr_minutes: int
    total_change_requests: int
    pending_approvals: int

class DriftAlert(BaseModel):
    id: str
    resource_name: str
    resource_type: str
    severity: str
    expected_value: str
    actual_value: str
    detected_at: datetime
    status: str
    risk_score: int
    changed_by: Optional[str]

class DeploymentRecord(BaseModel):
    id: str
    environment: str
    config_file: str
    deployed_by: str
    status: str
    timestamp: datetime
