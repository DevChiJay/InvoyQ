#!/usr/bin/env python3
"""
Quick diagnostic script for a specific user experiencing invoice duplication.

This script helps identify the exact cause of the issue for debugging purposes.

Usage:
    python debug_user_invoices.py <user_id>
"""

import asyncio
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))



async def diagnose_user_invoices(user_id: str):
    """Diagnose invoice issues for a specific user."""
    
    client = AsyncIOMotorClient("MongoDB_URI")
    db = client["invoyq"]
    
    try:
        print(f"\n{'='*70}")
        print(f"🔍 INVOICE DIAGNOSTIC REPORT FOR USER: {user_id}")
        print(f"{'='*70}\n")
        
        # Get all invoices for this user
        invoices = await db.invoices.find({"user_id": user_id}).to_list(length=None)
        
        if not invoices:
            print(f"❌ No invoices found for user {user_id}")
            return
        
        print(f"📊 Total invoices: {len(invoices)}\n")
        
        # Group by invoice number
        number_groups = {}
        for inv in invoices:
            num = inv.get('number', 'NO_NUMBER')
            if num not in number_groups:
                number_groups[num] = []
            number_groups[num].append(inv)
        
        # Check for duplicates
        duplicates_found = False
        for number, invs in number_groups.items():
            if len(invs) > 1:
                duplicates_found = True
                print(f"🚨 DUPLICATE FOUND: {number}")
                print(f"   Found {len(invs)} invoices with this number:")
                for i, inv in enumerate(invs, 1):
                    print(f"\n   Invoice #{i}:")
                    print(f"      ID: {inv['_id']}")
                    print(f"      Issued Date: {inv.get('issued_date')}")
                    print(f"      Created At: {inv.get('created_at')}")
                    print(f"      Status: {inv.get('status')}")
                    print(f"      Total: {inv.get('total')}")
                print()
        
        if not duplicates_found:
            print("✅ No duplicate invoice numbers found\n")
        
        # Analyze date consistency
        print(f"\n{'─'*70}")
        print("📅 DATE CONSISTENCY ANALYSIS")
        print(f"{'─'*70}\n")
        
        import re
        date_mismatches = []
        
        for inv in invoices:
            number = inv.get('number')
            issued_date = inv.get('issued_date')
            
            if not number or not number.startswith('INV-'):
                continue
            
            # Parse date from number
            match = re.match(r'INV-(\d{8})-\d{3}', number)
            if match:
                number_date_str = match.group(1)
                
                # Convert issued_date to comparable format
                if isinstance(issued_date, datetime):
                    issued_date_str = issued_date.strftime('%Y%m%d')
                elif issued_date:
                    try:
                        issued_date_str = datetime.fromisoformat(str(issued_date)).strftime('%Y%m%d')
                    except:
                        issued_date_str = str(issued_date).replace('-', '')[:8]
                else:
                    issued_date_str = None
                
                if issued_date_str != number_date_str:
                    date_mismatches.append({
                        'number': number,
                        'id': str(inv['_id']),
                        'number_date': number_date_str,
                        'issued_date': issued_date_str,
                        'status': inv.get('status'),
                    })
        
        if date_mismatches:
            print(f"🚨 Found {len(date_mismatches)} invoices with date mismatches:\n")
            for mismatch in date_mismatches:
                print(f"   Invoice: {mismatch['number']}")
                print(f"      ID: {mismatch['id']}")
                print(f"      Date in number: {mismatch['number_date']}")
                print(f"      Stored issued_date: {mismatch['issued_date']}")
                print(f"      Status: {mismatch['status']}")
                print()
            
            print("💡 FIX: Run the migration script:")
            print(f"   python migrations/fix_invoice_date_mismatch.py --user-id {user_id} --fix\n")
        else:
            print("✅ All invoice dates are consistent with their numbers\n")
        
        # Check for NULL issued_dates
        print(f"\n{'─'*70}")
        print("🔍 NULL ISSUED_DATE CHECK")
        print(f"{'─'*70}\n")
        
        null_dates = [inv for inv in invoices if inv.get('issued_date') is None]
        
        if null_dates:
            print(f"🚨 Found {len(null_dates)} invoices with NULL issued_date:\n")
            for inv in null_dates:
                print(f"   Invoice: {inv.get('number', 'NO_NUMBER')}")
                print(f"      ID: {inv['_id']}")
                print(f"      Created At: {inv.get('created_at')}")
                print(f"      Status: {inv.get('status')}")
                print()
            
            print("⚠️  These invoices are invisible to the counting logic!")
            print("💡 FIX: Update these invoices with proper issued_date values\n")
        else:
            print("✅ All invoices have issued_date set\n")
        
        # Timeline analysis
        print(f"\n{'─'*70}")
        print("📈 INVOICE CREATION TIMELINE")
        print(f"{'─'*70}\n")
        
        sorted_invoices = sorted(invoices, key=lambda x: x.get('created_at', datetime.min))
        
        print("Recent invoices (last 10):\n")
        for inv in sorted_invoices[-10:]:
            print(f"   {inv.get('number', 'NO_NUMBER')}")
            print(f"      Created: {inv.get('created_at')}")
            print(f"      Issued: {inv.get('issued_date')}")
            print(f"      Status: {inv.get('status')}")
            print()
        
        # Summary and recommendations
        print(f"\n{'='*70}")
        print("📋 SUMMARY & RECOMMENDATIONS")
        print(f"{'='*70}\n")
        
        issues_found = []
        
        if duplicates_found:
            issues_found.append("❌ Duplicate invoice numbers detected")
        
        if date_mismatches:
            issues_found.append(f"❌ {len(date_mismatches)} invoices with date mismatches")
        
        if null_dates:
            issues_found.append(f"❌ {len(null_dates)} invoices with NULL issued_date")
        
        if issues_found:
            print("Issues found:")
            for issue in issues_found:
                print(f"   {issue}")
            
            print("\n🔧 Recommended actions:")
            print("   1. Run migration script to fix date mismatches")
            print("   2. Update NULL issued_dates manually or via script")
            print("   3. Deploy the fixed invoice creation code")
            print("   4. Ask user to test creating new invoices")
        else:
            print("✅ No issues detected!")
            print("\nIf user is still experiencing problems:")
            print("   1. Check frontend/mobile app logs for what data is being sent")
            print("   2. Verify backend logs for actual errors during invoice creation")
            print("   3. Ensure the latest code with transaction support is deployed")
        
        print()
        
    finally:
        client.close()


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python debug_user_invoices.py <user_id>")
        sys.exit(1)
    
    user_id = sys.argv[1]
    asyncio.run(diagnose_user_invoices(user_id))
