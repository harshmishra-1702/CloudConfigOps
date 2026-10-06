from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.baseline import Baseline
from app.models.config_item import ConfigItem
from app.models.user import User
from app.schemas.baseline import BaselineCreate, BaselineResponse, DriftReport
from app.core.security import get_current_user
from app.services.drift_detection import DriftDetectionEngine

router = APIRouter()
drift_engine = DriftDetectionEngine()

@router.get('/', response_model=List[BaselineResponse])
async def list_baselines(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Baseline))
    return result.scalars().all()

@router.get('/{id}', response_model=BaselineResponse)
async def get_baseline(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Baseline).where(Baseline.id == id))
    baseline = result.scalars().first()
    if not baseline:
        raise HTTPException(status_code=404, detail='Baseline not found')
    return baseline

@router.post('/', response_model=BaselineResponse)
async def create_baseline(
    baseline_in: BaselineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Optionally, we could populate config_snapshot from current DB configs 
    # if it's empty, but the schema requires it so we assume it's provided.
    
    new_b = Baseline(
        **baseline_in.model_dump(),
        created_by=current_user.id
    )
    db.add(new_b)
    await db.commit()
    await db.refresh(new_b)
    return new_b

@router.post('/{id}/scan', response_model=DriftReport)
async def scan_baseline(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Baseline).where(Baseline.id == id))
    baseline = result.scalars().first()
    if not baseline:
        raise HTTPException(status_code=404, detail='Baseline not found')
        
    # Get current configs for the environment
    config_res = await db.execute(select(ConfigItem).where(ConfigItem.environment == baseline.environment))
    current_configs = {c.name: c.content for c in config_res.scalars().all()}
    
    drifts = drift_engine.compare_configs(baseline.config_snapshot, current_configs)
    report = drift_engine.generate_drift_report(baseline.name, baseline.environment, drifts)
    
    return report
