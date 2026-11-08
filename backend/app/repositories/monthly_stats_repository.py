"""
Repository for monthly statistics aggregations.
Aggregates data from invoices, expenses, clients, and products collections.
"""
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import date, datetime
from calendar import monthrange
from decimal import Decimal
from typing import Dict, List, Optional

from app.schemas.monthly_stats import DailyPoint, MonthlyStats, MonthTrendPoint, StatsTrend, TopProduct
from app.utils.logger import get_logger

logger = get_logger(__name__)


class MonthlyStatsRepository:
    """Repository for aggregating monthly statistics"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.invoices = db.invoices
        self.expenses = db.expenses
        self.clients = db.clients
        self.products = db.products
    
    def _get_month_boundaries(self, month: int, year: int) -> tuple[datetime, datetime]:
        """Get start and end datetime for a given month/year"""
        # First day of month at 00:00:00
        start_date = datetime(year, month, 1, 0, 0, 0)
        
        # Last day of month at 23:59:59
        last_day = monthrange(year, month)[1]
        end_date = datetime(year, month, last_day, 23, 59, 59)
        
        return start_date, end_date
    
    async def get_monthly_invoice_stats(
        self,
        user_id: str,
        month: int,
        year: int,
        currency: Optional[str] = None
    ) -> dict:
        """
        Get invoice statistics for a specific month.
        
        Returns:
            dict with: total_revenue, total_invoices, paid_invoices, unpaid_invoices
        """
        start_date, end_date = self._get_month_boundaries(month, year)
        
        # Build match filter
        match_filter = {
            "user_id": user_id,
            "issued_date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        
        if currency:
            match_filter["currency"] = currency
        
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1},
                    "total_amount": {"$sum": {"$toDouble": "$total"}}
                }
            }
        ]
        
        results = await self.invoices.aggregate(pipeline).to_list(None)
        
        # Process results
        total_revenue = Decimal("0.00")
        total_invoices = 0
        paid_invoices = 0
        unpaid_invoices = 0
        status_counts: Dict[str, int] = {}
        
        for result in results:
            status = result["_id"]
            count = result["count"]
            amount = Decimal(str(result.get("total_amount", 0)))
            
            total_invoices += count
            status_counts[str(status)] = status_counts.get(str(status), 0) + count
            
            if status == "paid":
                total_revenue += amount
                paid_invoices += count
            else:
                # draft, sent, overdue count as unpaid
                unpaid_invoices += count
        
        return {
            "total_revenue": total_revenue,
            "total_invoices": total_invoices,
            "paid_invoices": paid_invoices,
            "unpaid_invoices": unpaid_invoices,
            "status_counts": status_counts,
        }
    
    async def get_monthly_expense_stats(
        self,
        user_id: str,
        month: int,
        year: int,
        currency: Optional[str] = None
    ) -> Decimal:
        """
        Get total expenses for a specific month.
        
        Returns:
            Decimal: total_expenses
        """
        start_date, end_date = self._get_month_boundaries(month, year)
        
        # Build match filter
        match_filter = {
            "user_id": user_id,
            "expense_date": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        
        if currency:
            match_filter["currency"] = currency
        
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": None,
                    "total": {"$sum": {"$toDouble": "$amount"}}
                }
            }
        ]
        
        results = await self.expenses.aggregate(pipeline).to_list(1)
        
        if results:
            return Decimal(str(results[0].get("total", 0)))
        return Decimal("0.00")
    
    async def get_monthly_products_sold(
        self,
        user_id: str,
        month: int,
        year: int,
        currency: Optional[str] = None,
        limit: int = 5
    ) -> tuple[int, List[TopProduct]]:
        """
        Get total products sold and top products for a specific month.
        Only counts products from paid invoices.
        
        Returns:
            tuple: (total_quantity_sold, list of TopProduct)
        """
        start_date, end_date = self._get_month_boundaries(month, year)
        
        # Build match filter for paid invoices only
        match_filter = {
            "user_id": user_id,
            "issued_date": {
                "$gte": start_date,
                "$lte": end_date
            },
            "status": "paid"
        }
        
        if currency:
            match_filter["currency"] = currency
        
        # Aggregate pipeline to extract items and calculate totals
        pipeline = [
            {"$match": match_filter},
            {"$unwind": "$items"},
            {
                "$group": {
                    "_id": {
                        "product_id": "$items.product_id",
                        "description": "$items.description"
                    },
                    "quantity_sold": {"$sum": {"$toDouble": "$items.quantity"}}
                }
            },
            {"$sort": {"quantity_sold": -1}},
            {"$limit": limit + 1}  # +1 to include all for total calculation
        ]
        
        results = await self.invoices.aggregate(pipeline).to_list(None)
        
        # Calculate total and extract top products
        total_quantity_sold = 0
        top_products: List[TopProduct] = []
        
        for idx, result in enumerate(results):
            quantity = int(result["quantity_sold"])
            total_quantity_sold += quantity
            
            # Only include top N in the list
            if idx < limit:
                top_products.append(TopProduct(
                    product_id=result["_id"].get("product_id"),
                    name=result["_id"]["description"],
                    quantity_sold=quantity
                ))
        
        return total_quantity_sold, top_products
    
    async def get_new_clients_count(
        self,
        user_id: str,
        month: int,
        year: int
    ) -> int:
        """
        Get count of new clients added in a specific month.
        
        Returns:
            int: number of new clients
        """
        start_date, end_date = self._get_month_boundaries(month, year)
        
        count = await self.clients.count_documents({
            "user_id": user_id,
            "created_at": {
                "$gte": start_date,
                "$lte": end_date
            }
        })
        
        return count
    
    async def get_monthly_stats(
        self,
        user_id: str,
        month: int,
        year: int,
        currency: str = "NGN"
    ) -> MonthlyStats:
        """
        Get all monthly statistics for a user.
        Aggregates data from multiple collections.
        
        Args:
            user_id: User ID to get stats for
            month: Month number (1-12)
            year: Year
            currency: Currency filter (optional)
            
        Returns:
            MonthlyStats with all aggregated data
        """
        # Get date boundaries
        start_date, end_date = self._get_month_boundaries(month, year)
        
        # Fetch all stats in parallel
        import asyncio
        
        invoice_stats_task = self.get_monthly_invoice_stats(user_id, month, year, currency)
        expense_stats_task = self.get_monthly_expense_stats(user_id, month, year, currency)
        products_sold_task = self.get_monthly_products_sold(user_id, month, year, currency)
        new_clients_task = self.get_new_clients_count(user_id, month, year)
        
        invoice_stats, total_expenses, (total_products_sold, top_products), new_clients = await asyncio.gather(
            invoice_stats_task,
            expense_stats_task,
            products_sold_task,
            new_clients_task
        )
        
        # Calculate net income
        net_income = invoice_stats["total_revenue"] - total_expenses
        
        # Build response
        return MonthlyStats(
            month=month,
            year=year,
            currency=currency,
            total_revenue=invoice_stats["total_revenue"],
            total_expenses=total_expenses,
            net_income=net_income,
            total_invoices=invoice_stats["total_invoices"],
            paid_invoices=invoice_stats["paid_invoices"],
            unpaid_invoices=invoice_stats["unpaid_invoices"],
            status_counts=invoice_stats["status_counts"],
            total_products_sold=total_products_sold,
            top_products=top_products,
            new_clients=new_clients,
            period_start=start_date.date(),
            period_end=end_date.date()
        )


    @staticmethod
    def _month_sequence(month: int, year: int, count: int) -> List[tuple[int, int]]:
        """The `count` (year, month) pairs ending at (year, month), oldest first."""
        seq = []
        for back in range(count - 1, -1, -1):
            index = year * 12 + (month - 1) - back
            seq.append((index // 12, index % 12 + 1))
        return seq

    async def get_trend(
        self,
        user_id: str,
        month: int,
        year: int,
        currency: str = "NGN",
        months: int = 6,
    ) -> StatsTrend:
        """
        Revenue and expenses for the `months` months ending at the selected month, plus the
        daily figures of the selected month.

        Same definitions as `get_monthly_stats`: revenue is paid invoices bucketed by
        `issued_date`; expenses by `expense_date`. Months with no activity are zero-filled.
        One aggregation per collection and shape, run in parallel.
        """
        import asyncio

        sequence = self._month_sequence(month, year, months)
        first_year, first_month = sequence[0]
        range_start = datetime(first_year, first_month, 1)
        _, range_end = self._get_month_boundaries(month, year)
        month_start, month_end = self._get_month_boundaries(month, year)

        def window(field: str, start: datetime, end: datetime) -> dict:
            match = {"user_id": user_id, field: {"$gte": start, "$lte": end}}
            if currency:
                match["currency"] = currency
            return match

        invoices_by_month = self.invoices.aggregate([
            {"$match": window("issued_date", range_start, range_end)},
            {"$group": {
                "_id": {"y": {"$year": "$issued_date"}, "m": {"$month": "$issued_date"}, "status": "$status"},
                "count": {"$sum": 1},
                "amount": {"$sum": {"$toDouble": "$total"}},
            }},
        ]).to_list(None)
        expenses_by_month = self.expenses.aggregate([
            {"$match": window("expense_date", range_start, range_end)},
            {"$group": {
                "_id": {"y": {"$year": "$expense_date"}, "m": {"$month": "$expense_date"}},
                "amount": {"$sum": {"$toDouble": "$amount"}},
            }},
        ]).to_list(None)
        revenue_by_day = self.invoices.aggregate([
            {"$match": {**window("issued_date", month_start, month_end), "status": "paid"}},
            {"$group": {"_id": {"$dayOfMonth": "$issued_date"}, "amount": {"$sum": {"$toDouble": "$total"}}}},
        ]).to_list(None)
        expenses_by_day = self.expenses.aggregate([
            {"$match": window("expense_date", month_start, month_end)},
            {"$group": {"_id": {"$dayOfMonth": "$expense_date"}, "amount": {"$sum": {"$toDouble": "$amount"}}}},
        ]).to_list(None)

        inv_rows, exp_rows, rev_days, exp_days = await asyncio.gather(
            invoices_by_month, expenses_by_month, revenue_by_day, expenses_by_day
        )

        def money(value: float) -> Decimal:
            return Decimal(str(value)).quantize(Decimal("0.01"))

        points: Dict[tuple[int, int], dict] = {
            key: {"revenue": Decimal("0.00"), "expenses": Decimal("0.00"), "total": 0, "paid": 0}
            for key in sequence
        }
        for row in inv_rows:
            key = (row["_id"]["y"], row["_id"]["m"])
            if key not in points:
                continue
            points[key]["total"] += row["count"]
            if row["_id"]["status"] == "paid":
                points[key]["paid"] += row["count"]
                points[key]["revenue"] += money(row["amount"])
        for row in exp_rows:
            key = (row["_id"]["y"], row["_id"]["m"])
            if key in points:
                points[key]["expenses"] += money(row["amount"])

        trend_months = [
            MonthTrendPoint(
                month=m,
                year=y,
                revenue=points[(y, m)]["revenue"],
                expenses=points[(y, m)]["expenses"],
                net_income=points[(y, m)]["revenue"] - points[(y, m)]["expenses"],
                total_invoices=points[(y, m)]["total"],
                paid_invoices=points[(y, m)]["paid"],
            )
            for (y, m) in sequence
        ]

        revenue_map = {int(r["_id"]): money(r["amount"]) for r in rev_days}
        expense_map = {int(r["_id"]): money(r["amount"]) for r in exp_days}
        days_in_month = monthrange(year, month)[1]
        daily = [
            DailyPoint(
                date=date(year, month, day),
                revenue=revenue_map.get(day, Decimal("0.00")),
                expenses=expense_map.get(day, Decimal("0.00")),
            )
            for day in range(1, days_in_month + 1)
        ]

        return StatsTrend(currency=currency, month=month, year=year, months=trend_months, daily=daily)
