"""
Migration script to identify and fix invoice date mismatches.

This script finds invoices where the issued_date doesn't match the date
embedded in the invoice number, which can cause duplicate number generation.

Usage:
    # Dry run (analyze only, no changes):
    python migrations/fix_invoice_date_mismatch.py --dry-run
    
    # Fix issues automatically:
    python migrations/fix_invoice_date_mismatch.py --fix
    
    # Check specific user:
    python migrations/fix_invoice_date_mismatch.py --user-id <user_id> --dry-run
"""

import asyncio
import argparse
import re
from datetime import datetime, date
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Dict, Any, Optional
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


def parse_date_from_invoice_number(invoice_number: str) -> Optional[date]:
    """
    Extract date from invoice number format: INV-YYYYMMDD-###
    
    Args:
        invoice_number: Invoice number string
        
    Returns:
        Date object or None if parsing fails
    """
    if not invoice_number:
        return None
    
    # Match pattern: INV-YYYYMMDD-###
    match = re.match(r'INV-(\d{8})-\d{3}', invoice_number)
    if match:
        date_str = match.group(1)
        try:
            return datetime.strptime(date_str, '%Y%m%d').date()
        except ValueError:
            return None
    return None


async def find_mismatched_invoices(
    client: AsyncIOMotorClient,
    user_id: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Find all invoices where issued_date doesn't match the date in the number.
    
    Args:
        client: MongoDB client
        user_id: Optional user ID to filter by specific user
        
    Returns:
        List of mismatched invoice documents with analysis
    """
    db = client["invoyq"]
    
    # Build query
    query = {}
    if user_id:
        query["user_id"] = user_id
    
    # Only check invoices with auto-generated numbers (INV-YYYYMMDD-###)
    query["number"] = {"$regex": r"^INV-\d{8}-\d{3}$"}
    
    # Fetch all matching invoices
    invoices = await db.invoices.find(query).to_list(length=None)
    
    mismatches = []
    
    for invoice in invoices:
        number = invoice.get('number')
        issued_date = invoice.get('issued_date')
        
        # Parse date from number
        number_date = parse_date_from_invoice_number(number)
        
        if not number_date:
            continue
        
        # Convert issued_date to date object if it's a datetime
        if isinstance(issued_date, datetime):
            issued_date = issued_date.date()
        
        # Check for mismatch
        if issued_date != number_date:
            mismatches.append({
                '_id': str(invoice['_id']),
                'number': number,
                'user_id': invoice.get('user_id'),
                'issued_date': issued_date,
                'number_date': number_date,
                'created_at': invoice.get('created_at'),
                'client_id': invoice.get('client_id'),
                'total': invoice.get('total'),
                'status': invoice.get('status'),
            })
    
    return mismatches


async def fix_mismatched_invoice(
    client: AsyncIOMotorClient,
    invoice_id: str,
    correct_date: date
) -> bool:
    """
    Update an invoice's issued_date to match its number.
    
    Args:
        client: MongoDB client
        invoice_id: Invoice ID to fix
        correct_date: The correct issued_date from the invoice number
        
    Returns:
        True if updated successfully
    """
    db = client["invoyq"]
    
    result = await db.invoices.update_one(
        {"_id": invoice_id},
        {
            "$set": {
                "issued_date": datetime.combine(correct_date, datetime.min.time()),
                "updated_at": datetime.utcnow()
            },
            "$push": {
                "events": {
                    "action": "migration_fix_date",
                    "timestamp": datetime.utcnow(),
                    "details": {
                        "description": "Fixed issued_date to match invoice number",
                        "corrected_date": correct_date.isoformat()
                    }
                }
            }
        }
    )
    
    return result.modified_count > 0


async def main():
    """Main migration execution."""
    parser = argparse.ArgumentParser(
        description='Find and fix invoice date mismatches'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Analyze only, do not make changes'
    )
    parser.add_argument(
        '--fix',
        action='store_true',
        help='Automatically fix identified issues'
    )
    parser.add_argument(
        '--user-id',
        type=str,
        help='Check only invoices for specific user ID'
    )
    
    args = parser.parse_args()
    
    if not args.dry_run and not args.fix:
        print("ERROR: Must specify either --dry-run or --fix")
        parser.print_help()
        return
    
    # Connect to MongoDB
    print(f"\n🔌 Connecting to MongoDB: invoyq")
    client = AsyncIOMotorClient("MongoDB_URI")
    
    try:
        # Verify connection
        await client.admin.command('ping')
        print("✅ Connected successfully\n")
        
        # Find mismatched invoices
        print("🔍 Scanning for invoice date mismatches...")
        if args.user_id:
            print(f"   Filtering by user_id: {args.user_id}")
        
        mismatches = await find_mismatched_invoices(client, args.user_id)
        
        print(f"\n📊 Found {len(mismatches)} invoice(s) with date mismatches\n")
        
        if not mismatches:
            print("✅ No issues found! All invoices have consistent dates.")
            return
        
        # Display mismatches
        print("┌─────────────────────────────────────────────────────────────────┐")
        print("│ Mismatched Invoices                                             │")
        print("└─────────────────────────────────────────────────────────────────┘")
        
        for i, invoice in enumerate(mismatches, 1):
            print(f"\n{i}. Invoice: {invoice['number']}")
            print(f"   ID: {invoice['_id']}")
            print(f"   User ID: {invoice['user_id']}")
            print(f"   Status: {invoice['status']}")
            print(f"   Stored issued_date: {invoice['issued_date']}")
            print(f"   Date from number: {invoice['number_date']}")
            print(f"   Difference: {abs((invoice['issued_date'] - invoice['number_date']).days)} day(s)")
            print(f"   Total: {invoice['total']}")
        
        print("\n" + "─" * 65)
        
        # Fix if requested
        if args.fix:
            print("\n🔧 Fixing mismatched invoices...")
            
            fixed_count = 0
            for invoice in mismatches:
                success = await fix_mismatched_invoice(
                    client,
                    invoice['_id'],
                    invoice['number_date']
                )
                if success:
                    fixed_count += 1
                    print(f"   ✅ Fixed: {invoice['number']}")
                else:
                    print(f"   ❌ Failed: {invoice['number']}")
            
            print(f"\n✅ Successfully fixed {fixed_count}/{len(mismatches)} invoice(s)")
        else:
            print("\n💡 Run with --fix to automatically correct these issues")
            print("   Example: python migrations/fix_invoice_date_mismatch.py --fix")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise
    finally:
        client.close()
        print("\n✅ Connection closed")


if __name__ == "__main__":
    asyncio.run(main())
