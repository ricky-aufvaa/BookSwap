import ssl
from sqlalchemy.ext.asyncio import create_async_engine

ssl_context = ssl.create_default_context()
DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_pRiWKt0yda8c@ep-sparkling-leaf-a1ipinyg-pooler.ap-southeast-1.aws.neon.tech/neondb"

engine = create_async_engine(
    DATABASE_URL,
    connect_args={"ssl": ssl_context},
    echo=True
)
