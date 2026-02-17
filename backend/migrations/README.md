# Database Migrations

This directory contains one-time migration scripts for data fixes and schema updates.

## Available Migrations

### fix_invoice_date_mismatch.py

Identifies and fixes invoices where the `issued_date` doesn't match the date embedded in the invoice number.

**Problem:** When invoice numbers are generated using server's `today` but stored with a different `issued_date` from the client, it can cause duplicate invoice number generation.

**Solution:** This script finds such mismatches and optionally corrects them.

#### Usage

**Analyze Issues (Dry Run):**

```bash
cd /Users/devchi/Local\ Disk/Work/InvoyQ/backend
python migrations/fix_invoice_date_mismatch.py --dry-run
```

**Fix Issues Automatically:**

```bash
python migrations/fix_invoice_date_mismatch.py --fix
```

**Check Specific User:**

```bash
python migrations/fix_invoice_date_mismatch.py --user-id <user_id> --dry-run
python migrations/fix_invoice_date_mismatch.py --user-id <user_id> --fix
```

#### What It Does

1. **Scans** all invoices with auto-generated numbers (format: `INV-YYYYMMDD-###`)
2. **Compares** the date in the invoice number with the stored `issued_date`
3. **Reports** any mismatches found
4. **Fixes** (if `--fix` flag is used) by updating `issued_date` to match the invoice number

#### Safety Features

- Non-destructive dry-run mode by default
- Adds audit trail event to invoice's `events` array
- Updates `updated_at` timestamp
- Can target specific users for testing
- Displays detailed report before and after fixes

## Running Migrations

### Prerequisites

Ensure your environment variables are set:

```bash
export MONGODB_URI="mongodb://localhost:27017"
export MONGODB_DB_NAME="invoyq"
```

Or use the `.env` file in the backend directory.

### Best Practices

1. **Always run dry-run first** to assess the scope of changes
2. **Backup your database** before running fixes on production data
3. **Test on development environment** before production
4. **Review the output** carefully before confirming fixes
5. **Keep a log** of migration runs for audit purposes

## Creating New Migrations

When creating new migration scripts:

1. Use descriptive filename: `fix_<issue_description>.py`
2. Include comprehensive docstring with usage examples
3. Implement `--dry-run` mode for safe analysis
4. Add detailed logging and reporting
5. Include error handling and rollback logic where applicable
6. Document the migration in this README
7. Add the migration date and reason to CHANGELOG.md
