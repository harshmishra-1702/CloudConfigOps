from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.routes import auth, configs, change_requests, baselines, dashboard
from app.core.database import init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title='CloudConfig Ops API')

# CORS middleware allowing all origins (dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Include all routers with /api prefix
app.include_router(auth.router, prefix='/api/auth', tags=['auth'])
app.include_router(configs.router, prefix='/api/configs', tags=['configs'])
app.include_router(change_requests.router, prefix='/api/change-requests', tags=['change-requests'])
app.include_router(baselines.router, prefix='/api/baselines', tags=['baselines'])
app.include_router(dashboard.router, prefix='/api/dashboard', tags=['dashboard'])

@app.on_event('startup')
async def startup_event():
    logger.info('CloudConfig Ops API started')
    await init_db()

@app.get('/api/health')
async def health_check():
    return {'status': 'ok'}
