# test_db.py
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text  # ← Required for raw SQL

DATABASE_URL = 'postgresql+asyncpg://postgress:Welcome%40123456@localhost:5432/QuizApplication'

engine = create_async_engine(DATABASE_URL, echo=True)

async def test_connection():
    try:
        async with engine.begin() as conn:
            # ✅ Use text() to wrap raw SQL
            result = await conn.execute(text("SELECT 1 AS health"))
            print("✅ Success! DB Connected.")
            print("Query result:", result.scalar())  # Should print 1
    except Exception as e:
        print("❌ Failed:", str(e))

asyncio.run(test_connection())