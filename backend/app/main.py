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
from app.api.v1.payments import router as payments_router
from app.db.session import Base, engine
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import create_all_indexes
from app.core.config import settings

# Ensure models are imported so SQLAlchemy registers them with Base.metadata
# Routers import models already, but this import path makes the intent explicit.
from app.models import user as user_model  # noqa: F401
from app.models import client as client_model  # noqa: F401
from app.models import invoice as invoice_model  # noqa: F401
from app.models import payment as payment_model  # noqa: F401
from app.models import extraction as extraction_model  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events for both PostgreSQL and MongoDB.
    """
    # Startup
    print("🚀 Starting up InvoYQ API...")
    
    # Create PostgreSQL tables (legacy, will be removed in Phase 5)
    Base.metadata.create_all(bind=engine)
    
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
app.include_router(extraction_router, prefix="/v1", tags=["extraction"]) 
app.include_router(reminders_router, prefix="/v1", tags=["reminders"]) 
app.include_router(payments_router, prefix="/v1/payments", tags=["payments"]) 

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
