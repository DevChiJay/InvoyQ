import os
import uuid
import traceback
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
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
from app.api.v1.monthly_stats import router as monthly_stats_router
from app.db.mongo import connect_to_mongo, close_mongo_connection, get_database
from app.db.indexes import create_all_indexes
from app.core.config import settings
from app.utils.logger import setup_logging, get_logger


# Initialize logger
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events for both PostgreSQL and MongoDB.
    """
    # Startup - Initialize logging first
    setup_logging(
        log_dir=settings.LOG_DIR,
        log_level=settings.LOG_LEVEL,
        max_bytes=settings.LOG_FILE_MAX_BYTES,
        backup_count=settings.LOG_FILE_BACKUP_COUNT
    )
    logger.info("🚀 Starting up InvoYQ API...")
    
    # Initialize MongoDB connection and indexes
    await connect_to_mongo()
    await create_all_indexes(get_database())
    
    logger.info("✅ Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down InvoYQ API...")
    await close_mongo_connection()
    logger.info("✅ Application shutdown complete")


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


# Request/Response logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware to log all HTTP requests and responses.
    Excludes health check endpoint to avoid log spam.
    """
    # Skip logging for health check endpoint
    if request.url.path == "/":
        return await call_next(request)
    
    start_time = time.time()
    
    # Log the incoming request
    logger.info(f"Incoming request: {request.method} {request.url.path}")
    
    # Process the request
    response = await call_next(request)
    
    # Calculate request duration
    duration_ms = (time.time() - start_time) * 1000
    
    # Log the response with appropriate level based on status code
    log_message = (
        f"Completed request: {request.method} {request.url.path} | "
        f"Status: {response.status_code} | Duration: {duration_ms:.2f}ms"
    )
    
    if response.status_code >= 500:
        # Server errors (5xx)
        logger.error(log_message)
    elif response.status_code >= 400:
        # Client errors (4xx)
        logger.warning(log_message)
    else:
        # Success (2xx, 3xx)
        logger.info(log_message)
    
    return response


# HTTPException handler for validation and client errors
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handler for HTTPException (validation errors, 404s, unauthorized, etc.).
    Logs with appropriate level based on status code.
    """
    log_message = (
        f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}"
    )
    
    if exc.status_code >= 500:
        logger.error(log_message)
    elif exc.status_code >= 400:
        logger.warning(log_message)
    else:
        logger.info(log_message)
    
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


# Global exception handler for unhandled errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler to catch and log all unhandled exceptions.
    Returns a standardized error response with a unique error ID for tracking.
    """
    error_id = str(uuid.uuid4())
    error_traceback = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    
    logger.error(
        f"Unhandled exception [error_id={error_id}] on {request.method} {request.url.path}\n"
        f"Error: {str(exc)}\n"
        f"Traceback:\n{error_traceback}"
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error. Please contact support with the error ID.",
            "error_id": error_id
        }
    )


app.include_router(auth_router, prefix="/v1/auth", tags=["auth"]) 
app.include_router(users_router, prefix="/v1", tags=["users"]) 
app.include_router(clients_router, prefix="/v1", tags=["clients"]) 
app.include_router(invoices_router, prefix="/v1", tags=["invoices"]) 
app.include_router(products_router, prefix="/v1/products", tags=["products"])
app.include_router(expenses_router, prefix="/v1/expenses", tags=["expenses"])
app.include_router(extraction_router, prefix="/v1", tags=["extraction"]) 
app.include_router(reminders_router, prefix="/v1", tags=["reminders"])
app.include_router(monthly_stats_router, prefix="/v1/stats", tags=["stats"]) 

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
