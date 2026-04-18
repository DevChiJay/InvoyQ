from datetime import datetime, timedelta
from typing import Callable, Dict, List
from fastapi import Depends, HTTPException, Request
import threading


class InMemoryRateLimiter:
    """
    Simple in-memory rate limiter using sliding window approach.
    Not suitable for production with multiple instances, but good for single-instance dev/test.
    """
    
    def __init__(self, max_requests: int = 5, window_minutes: int = 1):
        self.max_requests = max_requests
        self.window_duration = timedelta(minutes=window_minutes)
        self.requests: Dict[str, List[datetime]] = {}
        self.lock = threading.Lock()
    
    def _get_client_key(self, request: Request) -> str:
        """Generate a unique key for the client based on IP address."""
        client_ip = request.client.host if request.client else "unknown"
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            # Use the first IP in case of multiple proxies
            client_ip = forwarded_for.split(",")[0].strip()
        return client_ip
    
    def _cleanup_old_requests(self, client_key: str, now: datetime):
        """Remove requests that are outside the current window."""
        if client_key in self.requests:
            cutoff_time = now - self.window_duration
            self.requests[client_key] = [
                req_time for req_time in self.requests[client_key]
                if req_time > cutoff_time
            ]
            if not self.requests[client_key]:
                del self.requests[client_key]
    
    def is_allowed(self, request: Request) -> bool:
        """Check if the request should be allowed based on rate limiting."""
        client_key = self._get_client_key(request)
        now = datetime.utcnow()
        
        with self.lock:
            # Clean up old requests
            self._cleanup_old_requests(client_key, now)
            
            # Initialize client if not exists
            if client_key not in self.requests:
                self.requests[client_key] = []
            
            # Check if under limit
            if len(self.requests[client_key]) >= self.max_requests:
                return False
            
            # Add current request
            self.requests[client_key].append(now)
            return True
    
    def check_rate_limit(self, request: Request):
        """Check rate limit and raise HTTPException if exceeded."""
        if not self.is_allowed(request):
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Maximum {self.max_requests} requests per {self.window_duration.total_seconds() / 60} minutes."
            )

    def dependency(self) -> Callable:
        """Return a FastAPI dependency that enforces this rate limit."""
        limiter = self

        async def _rate_limit_dep(request: Request):
            limiter.check_rate_limit(request)

        return _rate_limit_dep


# --- Global rate limiter instances ---

# Auth endpoints (login, register, Google auth): 5 req/min per IP
auth_rate_limiter = InMemoryRateLimiter(max_requests=5, window_minutes=1)

# Sensitive auth actions (password reset, resend verification): 3 req/min per IP
password_reset_rate_limiter = InMemoryRateLimiter(max_requests=3, window_minutes=1)

# Email-sending endpoints (send invoice, send reminder): 5 req/min per IP
email_send_rate_limiter = InMemoryRateLimiter(max_requests=5, window_minutes=1)

# File upload endpoints (avatar, logo): 10 req/min per IP
upload_rate_limiter = InMemoryRateLimiter(max_requests=10, window_minutes=1)

# Extraction endpoint: 10 req/min per IP
extraction_rate_limiter = InMemoryRateLimiter(max_requests=10, window_minutes=1)