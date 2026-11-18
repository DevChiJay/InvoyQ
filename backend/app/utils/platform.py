"""Which client a request came from, for registration tracking.

The apps send ``X-Client-Platform: ios|android``; the web frontend sends nothing. Older
mobile builds send ``registration_source: "mobile"`` in the register body instead, which is
kept as ``"mobile"`` (the real OS can't be recovered).
"""
from typing import Optional

CLIENT_PLATFORMS = ("web", "ios", "android")
LEGACY_MOBILE = "mobile"
PLATFORM_HEADER = "X-Client-Platform"


def resolve_platform(header: Optional[str], fallback: Optional[str] = None) -> str:
    """Valid header wins; else a legacy ``"mobile"`` fallback; else ``"web"``."""
    value = (header or "").strip().lower()
    if value in CLIENT_PLATFORMS:
        return value
    fallback = (fallback or "").strip().lower()
    if fallback in CLIENT_PLATFORMS or fallback == LEGACY_MOBILE:
        return fallback
    return "web"
