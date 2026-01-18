"""
MongoDB transaction utilities for atomic multi-document operations.

Provides helpers for managing MongoDB sessions and transactions,
particularly useful for operations like invoice creation with stock updates.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorClientSession
from typing import AsyncContextManager, Callable, Any, Optional
from contextlib import asynccontextmanager
import asyncio


@asynccontextmanager
async def transaction_session(client: AsyncIOMotorClient) -> AsyncContextManager[AsyncIOMotorClientSession]:
    """
    Create a MongoDB transaction session context manager.
    
    Automatically commits on success and aborts on exception.
    
    Args:
        client: MongoDB client instance
        
    Yields:
        MongoDB session for transactional operations
        
    Example:
        from app.db.mongo import mongodb
        
        async with transaction_session(mongodb.client) as session:
            # All operations in this block use the same session
            await db.products.update_one(
                {"_id": product_id},
                {"$inc": {"quantity_available": -qty}},
                session=session
            )
            await db.invoices.insert_one(invoice_doc, session=session)
            # Auto-commit on success, auto-abort on exception
    """
    async with await client.start_session() as session:
        async with session.start_transaction():
            try:
                yield session
                # Transaction commits automatically if no exception
            except Exception as e:
                # Transaction aborts automatically on exception
                await session.abort_transaction()
                raise e


async def with_transaction(
    client: AsyncIOMotorClient,
    callback: Callable[[AsyncIOMotorClientSession], Any],
    max_retries: int = 3
) -> Any:
    """
    Execute a callback within a MongoDB transaction with retry logic.
    
    Handles transient transaction errors by retrying the operation.
    Useful for write conflicts in high-concurrency scenarios.
    
    Args:
        client: MongoDB client instance
        callback: Async function that accepts a session and performs operations
        max_retries: Maximum number of retry attempts for transient errors
        
    Returns:
        Result of the callback function
        
    Raises:
        Exception: If all retry attempts fail
        
    Example:
        async def create_invoice_with_stock_update(session):
            # Decrement stock
            result = await db.products.update_one(
                {"_id": product_id, "quantity_available": {"$gte": qty}},
                {"$inc": {"quantity_available": -qty}},
                session=session
            )
            if result.modified_count == 0:
                raise ValueError("Insufficient stock")
            
            # Create invoice
            invoice = await db.invoices.insert_one(invoice_doc, session=session)
            return invoice.inserted_id
        
        invoice_id = await with_transaction(mongodb.client, create_invoice_with_stock_update)
    """
    attempt = 0
    last_error = None
    
    while attempt < max_retries:
        try:
            async with transaction_session(client) as session:
                result = await callback(session)
                return result
        except Exception as e:
            attempt += 1
            last_error = e
            
            # Check if error is transient (retryable)
            error_msg = str(e).lower()
            is_transient = any(
                keyword in error_msg
                for keyword in ["transient", "write conflict", "snapshot"]
            )
            
            if is_transient and attempt < max_retries:
                # Wait before retry with exponential backoff
                await asyncio.sleep(0.1 * (2 ** attempt))
                continue
            else:
                # Non-transient error or max retries reached
                raise e
    
    # Should not reach here, but raise last error if we do
    raise last_error


class TransactionContext:
    """
    Transaction context manager for easier transaction handling.
    
    Example:
        tx = TransactionContext(mongodb.client)
        
        async with tx.begin() as session:
            await db.products.update_one(..., session=session)
            await db.invoices.insert_one(..., session=session)
    """
    
    def __init__(self, client: AsyncIOMotorClient):
        """
        Initialize transaction context.
        
        Args:
            client: MongoDB client instance
        """
        self.client = client
    
    def begin(self) -> AsyncContextManager[AsyncIOMotorClientSession]:
        """
        Begin a new transaction.
        
        Returns:
            Context manager for the transaction session
        """
        return transaction_session(self.client)
    
    async def execute(
        self,
        callback: Callable[[AsyncIOMotorClientSession], Any],
        max_retries: int = 3
    ) -> Any:
        """
        Execute a callback in a transaction with retry logic.
        
        Args:
            callback: Function to execute in transaction
            max_retries: Maximum retry attempts
            
        Returns:
            Result of callback
        """
        return await with_transaction(self.client, callback, max_retries)


async def check_transaction_support(client: AsyncIOMotorClient) -> bool:
    """
    Check if the MongoDB server supports transactions.
    
    Transactions require MongoDB 4.0+ for replica sets or 4.2+ for sharded clusters.
    
    Args:
        client: MongoDB client instance
        
    Returns:
        True if transactions are supported, False otherwise
        
    Example:
        if await check_transaction_support(mongodb.client):
            async with transaction_session(mongodb.client) as session:
                # Use transactions
        else:
            # Fall back to non-transactional operations
    """
    try:
        server_info = await client.server_info()
        version = server_info.get("version", "0.0.0")
        major, minor, *_ = map(int, version.split("."))
        
        # MongoDB 4.0+ supports transactions on replica sets
        # MongoDB 4.2+ supports transactions on sharded clusters
        return (major > 4) or (major == 4 and minor >= 0)
    except Exception:
        return False


async def validate_session_active(session: Optional[AsyncIOMotorClientSession]) -> bool:
    """
    Check if a transaction session is active.
    
    Args:
        session: MongoDB session to check
        
    Returns:
        True if session is active and in transaction, False otherwise
    """
    if session is None:
        return False
    
    try:
        return session.in_transaction
    except Exception:
        return False
