# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.auth import router as auth_router
from api.books import router as books_router
from config.database import create_db_and_tables

app = FastAPI(title="BookSwap API", version="1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
async def on_startup():
    await create_db_and_tables()

app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(books_router, prefix="/api/v1", tags=["books"])

@app.get("/")
def root():
    return {"message": "Welcome to BookSwap API! Visit /docs for API docs."}











#models--------------------(db related)
