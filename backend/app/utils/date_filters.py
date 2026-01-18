"""
Date filtering utilities for time-based queries.

Provides helpers for weekly and monthly date range calculations,
commonly used in invoice and expense filtering.
"""

from datetime import datetime, date, timedelta
from typing import Dict, Any, Tuple, Optional
from enum import Enum


class PeriodFilter(str, Enum):
    """Supported period filter types."""
    WEEK = "week"
    MONTH = "month"
    YEAR = "year"


def get_week_range(reference_date: date) -> Tuple[datetime, datetime]:
    """
    Get Monday-Sunday range for the week containing the reference date.
    
    Args:
        reference_date: Date within the target week
        
    Returns:
        Tuple of (start_datetime, end_datetime) representing Monday 00:00 to Sunday 23:59:59
        
    Example:
        start, end = get_week_range(date(2026, 1, 15))  # Wednesday
        # Returns: (2026-01-13 00:00:00, 2026-01-19 23:59:59)  # Mon-Sun
    """
    # Get the Monday of the week (weekday() returns 0 for Monday)
    monday = reference_date - timedelta(days=reference_date.weekday())
    
    # Get the Sunday of the week
    sunday = monday + timedelta(days=6)
    
    # Convert to datetime with start/end of day
    start_datetime = datetime.combine(monday, datetime.min.time())
    end_datetime = datetime.combine(sunday, datetime.max.time())
    
    return start_datetime, end_datetime


def get_month_range(reference_date: date) -> Tuple[datetime, datetime]:
    """
    Get first-to-last day range for the month containing the reference date.
    
    Args:
        reference_date: Date within the target month
        
    Returns:
        Tuple of (start_datetime, end_datetime) representing first day 00:00 to last day 23:59:59
        
    Example:
        start, end = get_month_range(date(2026, 1, 15))
        # Returns: (2026-01-01 00:00:00, 2026-01-31 23:59:59)
    """
    # First day of the month
    first_day = date(reference_date.year, reference_date.month, 1)
    
    # Last day of the month (go to first day of next month, subtract 1 day)
    if reference_date.month == 12:
        last_day = date(reference_date.year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(reference_date.year, reference_date.month + 1, 1) - timedelta(days=1)
    
    # Convert to datetime with start/end of day
    start_datetime = datetime.combine(first_day, datetime.min.time())
    end_datetime = datetime.combine(last_day, datetime.max.time())
    
    return start_datetime, end_datetime


def get_year_range(reference_date: date) -> Tuple[datetime, datetime]:
    """
    Get January 1st to December 31st range for the year containing the reference date.
    
    Args:
        reference_date: Date within the target year
        
    Returns:
        Tuple of (start_datetime, end_datetime) representing first to last day of year
        
    Example:
        start, end = get_year_range(date(2026, 6, 15))
        # Returns: (2026-01-01 00:00:00, 2026-12-31 23:59:59)
    """
    first_day = date(reference_date.year, 1, 1)
    last_day = date(reference_date.year, 12, 31)
    
    start_datetime = datetime.combine(first_day, datetime.min.time())
    end_datetime = datetime.combine(last_day, datetime.max.time())
    
    return start_datetime, end_datetime


def parse_period_filter(
    period: Optional[str] = None,
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Convert period filter to MongoDB date range query.
    
    Args:
        period: Period type ("week", "month", "year"). If None, returns empty dict.
        reference_date: Date to base the period on. Defaults to today.
        
    Returns:
        MongoDB query dict with $gte and $lte operators, or empty dict if no period
        
    Example:
        # Get this week's range
        query = parse_period_filter("week")
        # Returns: {"$gte": datetime(...), "$lte": datetime(...)}
        
        # Get specific month
        query = parse_period_filter("month", date(2025, 12, 1))
        # Returns: {"$gte": 2025-12-01 00:00:00, "$lte": 2025-12-31 23:59:59}
        
        # Use in MongoDB query
        invoices = await db.invoices.find({
            "user_id": user_id,
            "issued_date": parse_period_filter("week")
        }).to_list(100)
    """
    if not period:
        return {}
    
    if reference_date is None:
        reference_date = date.today()
    
    # Convert string reference_date to date object if needed
    if isinstance(reference_date, str):
        reference_date = datetime.fromisoformat(reference_date).date()
    elif isinstance(reference_date, datetime):
        reference_date = reference_date.date()
    
    # Get the appropriate range based on period type
    if period == PeriodFilter.WEEK:
        start_dt, end_dt = get_week_range(reference_date)
    elif period == PeriodFilter.MONTH:
        start_dt, end_dt = get_month_range(reference_date)
    elif period == PeriodFilter.YEAR:
        start_dt, end_dt = get_year_range(reference_date)
    else:
        raise ValueError(f"Invalid period: {period}. Must be one of: week, month, year")
    
    return {
        "$gte": start_dt,
        "$lte": end_dt
    }


def build_date_range_query(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    period: Optional[str] = None,
    reference_date: Optional[date] = None
) -> Dict[str, Any]:
    """
    Build a MongoDB date range query with flexible inputs.
    
    Supports both explicit date ranges (date_from/date_to) and
    period-based ranges (week/month/year).
    
    Priority: explicit date_from/date_to takes precedence over period.
    
    Args:
        date_from: Start date (inclusive)
        date_to: End date (inclusive)
        period: Period filter ("week", "month", "year")
        reference_date: Reference date for period calculation
        
    Returns:
        MongoDB query dict with date range operators
        
    Example:
        # Explicit range
        query = build_date_range_query(
            date_from=date(2026, 1, 1),
            date_to=date(2026, 1, 31)
        )
        
        # Period-based (this month)
        query = build_date_range_query(period="month")
        
        # Use in query
        expenses = await db.expenses.find({
            "user_id": user_id,
            "date": build_date_range_query(period="week")
        }).to_list(100)
    """
    # If explicit dates provided, use them
    if date_from or date_to:
        query = {}
        if date_from:
            query["$gte"] = datetime.combine(date_from, datetime.min.time())
        if date_to:
            query["$lte"] = datetime.combine(date_to, datetime.max.time())
        return query
    
    # Otherwise use period filter
    return parse_period_filter(period, reference_date)


def get_current_week() -> Tuple[datetime, datetime]:
    """Get the current week's date range (Monday-Sunday)."""
    return get_week_range(date.today())


def get_current_month() -> Tuple[datetime, datetime]:
    """Get the current month's date range."""
    return get_month_range(date.today())


def get_current_year() -> Tuple[datetime, datetime]:
    """Get the current year's date range."""
    return get_year_range(date.today())


def get_last_n_days(days: int) -> Tuple[datetime, datetime]:
    """
    Get date range for the last N days (including today).
    
    Args:
        days: Number of days to look back
        
    Returns:
        Tuple of (start_datetime, end_datetime)
        
    Example:
        # Last 7 days
        start, end = get_last_n_days(7)
    """
    end_date = date.today()
    start_date = end_date - timedelta(days=days - 1)
    
    start_datetime = datetime.combine(start_date, datetime.min.time())
    end_datetime = datetime.combine(end_date, datetime.max.time())
    
    return start_datetime, end_datetime
