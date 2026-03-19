"""
Centralized logging utility using Python's stdlib logging module.
Provides rotating file handlers for application and error logs.
"""
import logging
import os
from logging.handlers import RotatingFileHandler
from typing import Optional


# Global flag to ensure logging is only configured once
_logging_configured = False


def setup_logging(
    log_dir: str = "./logs",
    log_level: str = "INFO",
    max_bytes: int = 10 * 1024 * 1024,  # 10MB
    backup_count: int = 5
) -> None:
    """
    Configure the root logger with rotating file handlers.
    Should be called once during application startup.
    
    Args:
        log_dir: Directory to store log files
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        max_bytes: Maximum size of each log file before rotation
        backup_count: Number of backup files to keep
    """
    global _logging_configured
    
    if _logging_configured:
        return
    
    # Create logs directory if it doesn't exist
    os.makedirs(log_dir, exist_ok=True)
    
    # Convert log level string to logging constant
    numeric_level = getattr(logging, log_level.upper(), logging.INFO)
    
    # Define log format
    log_format = logging.Formatter(
        fmt='[%(asctime)s] [%(levelname)s] [%(name)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(numeric_level)
    
    # Remove any existing handlers (in case of reconfiguration)
    root_logger.handlers.clear()
    
    # Create rotating file handler for general logs
    app_log_file = os.path.join(log_dir, "app.log")
    app_handler = RotatingFileHandler(
        app_log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    app_handler.setLevel(numeric_level)
    app_handler.setFormatter(log_format)
    root_logger.addHandler(app_handler)
    
    # Create rotating file handler for error logs only
    error_log_file = os.path.join(log_dir, "error.log")
    error_handler = RotatingFileHandler(
        error_log_file,
        maxBytes=max_bytes,
        backupCount=backup_count,
        encoding='utf-8'
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(log_format)
    root_logger.addHandler(error_handler)
    
    # Add console handler for development (optional, can be controlled via env var)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(numeric_level)
    console_handler.setFormatter(log_format)
    root_logger.addHandler(console_handler)
    
    _logging_configured = True
    
    # Log that logging has been configured
    logger = logging.getLogger(__name__)
    logger.info(f"Logging configured: level={log_level}, log_dir={log_dir}, max_bytes={max_bytes}, backup_count={backup_count}")


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance for the given module name.
    
    Args:
        name: Logger name (typically __name__ of the calling module)
    
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name or __name__)
