from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
import os

from app.core.database import get_db
from app.core.config import settings
from app.models.config_item import ConfigItem
from app.models.user import User
from app.schemas.config_item import ConfigItemCreate, ConfigItemUpdate, ConfigItemResponse, ConfigHistory
from app.core.security import get_current_user
from app.services.mercurial_scm import MercurialSCM

router = APIRouter()
scm = MercurialSCM(settings.MERCURIAL_REPO_PATH)
scm.init_repo()

@router.get('/', response_model=List[ConfigItemResponse])
async def list_configs(
    environment: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(ConfigItem)
    if environment:
        query = query.where(ConfigItem.environment == environment)
    result = await db.execute(query)
    return result.scalars().all()

@router.get('/{id}', response_model=ConfigItemResponse)
async def get_config(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ConfigItem).where(ConfigItem.id == id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail='ConfigItem not found')
    return item

@router.post('/', response_model=ConfigItemResponse)
async def create_config(
    config_in: ConfigItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Save to db
    new_item = ConfigItem(
        **config_in.model_dump(),
        created_by=current_user.id
    )
    db.add(new_item)
    await db.commit()
    await db.refresh(new_item)
    
    # Save to repo file
    repo_file_path = os.path.join(scm.repo_path, config_in.file_path)
    os.makedirs(os.path.dirname(repo_file_path), exist_ok=True)
    with open(repo_file_path, 'w') as f:
        f.write(config_in.content)
        
    scm.add_file(config_in.file_path)
    scm.commit(message=f'Initial commit for {config_in.name}', user=current_user.email)
    
    return new_item

@router.put('/{id}', response_model=ConfigItemResponse)
async def update_config(
    id: int,
    config_in: ConfigItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ConfigItem).where(ConfigItem.id == id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail='ConfigItem not found')
        
    update_data = config_in.model_dump(exclude_unset=True)
    
    content_updated = False
    if 'content' in update_data and update_data['content'] != item.content:
        content_updated = True
        
    for key, value in update_data.items():
        setattr(item, key, value)
        
    if content_updated:
        item.version += 1
        repo_file_path = os.path.join(scm.repo_path, item.file_path)
        os.makedirs(os.path.dirname(repo_file_path), exist_ok=True)
        with open(repo_file_path, 'w') as f:
            f.write(item.content)
        scm.commit(message=f'Update {item.name}', user=current_user.email)
        
    await db.commit()
    await db.refresh(item)
    return item

@router.delete('/{id}')
async def delete_config(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ConfigItem).where(ConfigItem.id == id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail='ConfigItem not found')
    
    await db.delete(item)
    await db.commit()
    return {'message': 'Deleted successfully'}

@router.get('/{id}/history', response_model=List[ConfigHistory])
async def config_history(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ConfigItem).where(ConfigItem.id == id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail='ConfigItem not found')
        
    history = scm.log(limit=50)
    
    parsed_history = []
    for h in history:
        content = scm.cat(item.file_path, rev=h['hash'])
        if content:
            parsed_history.append(ConfigHistory(
                version=h['hash'],
                content=content,
                committed_at=h['date'],
                commit_message=h['message'],
                commit_hash=h['hash']
            ))
            
    return parsed_history

@router.get('/{id}/diff')
async def config_diff(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ConfigItem).where(ConfigItem.id == id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail='ConfigItem not found')
        
    diff = scm.diff(item.file_path)
    return {'diff': diff}
