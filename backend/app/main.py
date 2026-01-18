import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.clients import router as clients_router
from app.api.v1.invoices import router as invoices_router
from app.api.v1.extraction import router as extraction_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.products import router as products_router
from app.api.v1.expenses import router as expenses_router
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import create_all_indexes
from app.core.config import settings



@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events for both PostgreSQL and MongoDB.
    """
    # Startup
    print("🚀 Starting up InvoYQ API...")
    
    
    # Initialize MongoDB connection and indexes
    await connect_to_mongo()
    await create_all_indexes(get_database())
    
    print("✅ Application startup complete")
    
    yield
    
    # Shutdown
    print("🛑 Shutting down InvoYQ API...")
    await close_mongo_connection()
    print("✅ Application shutdown complete")


app = FastAPI(
    title="InvoYQ API",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this more restrictively in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/v1/auth", tags=["auth"]) 
app.include_router(users_router, prefix="/v1", tags=["users"]) 
app.include_router(clients_router, prefix="/v1", tags=["clients"]) 
app.include_router(invoices_router, prefix="/v1", tags=["invoices"]) 
app.include_router(products_router, prefix="/v1/products", tags=["products"])
app.include_router(expenses_router, prefix="/v1/expenses", tags=["expenses"])
app.include_router(extraction_router, prefix="/v1", tags=["extraction"]) 
app.include_router(reminders_router, prefix="/v1", tags=["reminders"]) 

# Serve generated files via /static for local/dev usage
os.makedirs(settings.STORAGE_LOCAL_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory=settings.STORAGE_LOCAL_DIR), name="static")


@app.get("/")
async def root():
    """API health check endpoint."""
    return {
        "message": "InvoYQ API is running",
        "version": "0.1.0",
        "status": "ok"
    }
