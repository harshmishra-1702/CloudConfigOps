from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str = 'postgresql+asyncpg://cloudguard:cloudguard@localhost:5432/cloudguard'
    SECRET_KEY: str = 'cloudguard-secret-key-change-in-production'
    ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    MERCURIAL_REPO_PATH: str = './config_repo'
    SSH_KEY_PATH: str = '~/.ssh/id_rsa'
    AWS_REGION: str = 'us-east-1'

    model_config = SettingsConfigDict(env_file='.env')

settings = Settings()
