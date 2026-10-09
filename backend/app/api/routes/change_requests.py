from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.change_request import ChangeRequest
from app.models.config_item import ConfigItem
from app.models.user import User
from app.schemas.change_request import ChangeRequestCreate, ChangeRequestUpdate, ChangeRequestResponse, ApprovalAction
from app.core.security import get_current_user
from app.services.deployment import DeploymentService
from app.core.config import settings
import os

router = APIRouter()

@router.get('/', response_model=List[ChangeRequestResponse])
async def list_change_requests(
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ChangeRequest).options(
        selectinload(ChangeRequest.requester),
        selectinload(ChangeRequest.config_item)
    )
    if status:
        query = query.where(ChangeRequest.status == status)
    result = await db.execute(query)
    reqs = result.scalars().all()
    
    # map names for response
    response_list = []
    for r in reqs:
        resp = ChangeRequestResponse.model_validate(r)
        resp.requester_name = r.requester.full_name or r.requester.email
        resp.config_item_name = r.config_item.name
        response_list.append(resp)
    return response_list

@router.get('/{id}', response_model=ChangeRequestResponse)
async def get_change_request(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ChangeRequest)
        .options(selectinload(ChangeRequest.requester), selectinload(ChangeRequest.config_item))
        .where(ChangeRequest.id == id)
    )
    r = result.scalars().first()
    if not r:
        raise HTTPException(status_code=404, detail='ChangeRequest not found')
        
    resp = ChangeRequestResponse.model_validate(r)
    resp.requester_name = r.requester.full_name or r.requester.email
    resp.config_item_name = r.config_item.name
    return resp

@router.post('/', response_model=ChangeRequestResponse)
async def create_change_request(
    cr_in: ChangeRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ci_res = await db.execute(select(ConfigItem).where(ConfigItem.id == cr_in.config_item_id))
    ci = ci_res.scalars().first()
    if not ci:
        raise HTTPException(status_code=404, detail='ConfigItem not found')
        
    new_cr = ChangeRequest(
        **cr_in.model_dump(),
        requester_id=current_user.id
    )
    db.add(new_cr)
    await db.commit()
    await db.refresh(new_cr)
    
    # Reload with relations
    return await get_change_request(new_cr.id, db, current_user)

@router.post('/{id}/approve', response_model=ChangeRequestResponse)
async def approve_change_request(
    id: int,
    action: ApprovalAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ['admin', 'editor']:
        raise HTTPException(status_code=403, detail='Not authorized to approve')
        
    result = await db.execute(select(ChangeRequest).where(ChangeRequest.id == id))
    cr = result.scalars().first()
    if not cr:
        raise HTTPException(status_code=404, detail='ChangeRequest not found')
        
    cr.status = 'approved'
    cr.review_comment = action.comment
    cr.reviewer_id = current_user.id
    
    await db.commit()

    # Automatically archive approved baseline to Amazon S3 & sync hash to DynamoDB
    try:
        from app.services.aws_storage import aws_storage
        ci_res = await db.execute(select(ConfigItem).where(ConfigItem.id == cr.config_item_id))
        ci = ci_res.scalars().first()
        if ci:
            aws_storage.upload_approved_baseline(
                config_name=ci.name,
                content=ci.content,
                version=ci.version,
                environment=ci.environment,
                metadata={
                    'cr_id': f'CR-{cr.id}',
                    'approved_by': current_user.email,
                    'comment': action.comment
                }
            )
    except Exception as e:
        pass

    return await get_change_request(id, db, current_user)

@router.post('/{id}/reject', response_model=ChangeRequestResponse)
async def reject_change_request(
    id: int,
    action: ApprovalAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ChangeRequest).where(ChangeRequest.id == id))
    cr = result.scalars().first()
    if not cr:
        raise HTTPException(status_code=404, detail='ChangeRequest not found')
        
    cr.status = 'rejected'
    cr.review_comment = action.comment
    cr.reviewer_id = current_user.id
    
    await db.commit()
    return await get_change_request(id, db, current_user)

@router.post('/{id}/deploy', response_model=ChangeRequestResponse)
async def deploy_change_request(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ChangeRequest).options(selectinload(ChangeRequest.config_item)).where(ChangeRequest.id == id))
    cr = result.scalars().first()
    if not cr:
        raise HTTPException(status_code=404, detail='ChangeRequest not found')
        
    if cr.status != 'approved':
        raise HTTPException(status_code=400, detail='Only approved requests can be deployed')
        
    # Mock deployment logic using DeploymentService
    deploy_service = DeploymentService('localhost', 'deployer', settings.SSH_KEY_PATH)
    
    ci = cr.config_item
    local_path = os.path.join(settings.MERCURIAL_REPO_PATH, ci.file_path)
    remote_path = f'/tmp/deployments/{ci.file_path}'
    
    # In a real app we'd actually deploy. Here we simulate success.
    # res = await deploy_service.deploy_config(local_path, remote_path)
    
    cr.status = 'deployed'
    cr.deployed_at = datetime.utcnow()
    await db.commit()
    
    return await get_change_request(id, db, current_user)
