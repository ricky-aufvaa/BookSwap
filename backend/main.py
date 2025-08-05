# main.py
from fastapi import FastAPI
from api.auth import router as auth_router
from api.books import router as books_router
from api.requests import router as requests_router
from config.database import create_db_and_tables

app = FastAPI(title="BookSwap API", version="1.0")

@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(books_router, prefix="/api/v1", tags=["books"])
app.include_router(requests_router, prefix="/api/v1", tags=["requests"])

@app.get("/")
def root():
    return {"message": "Welcome to BookSwap API! Visit /docs for API docs."}











#models--------------------(db related)