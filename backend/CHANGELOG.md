# Changelog

All notable changes to the InvoIQ Backend API.

## [2.0.0] - 2024 (MongoDB Migration)

### 🚨 BREAKING CHANGES

#### Database Migration: PostgreSQL → MongoDB

The backend has been completely migrated from PostgreSQL/SQLAlchemy to MongoDB with async Motor driver. This is a **breaking change** requiring fresh installation or data migration.

**Impact:**
- All ID fields changed from `int` to `string` (MongoDB ObjectId format: `"507f1f77bcf86cd799439011"`)
- Database connection string changed from `DATABASE_URL` to `MONGODB_URL` and `MONGODB_DB_NAME`
- All API responses now return string IDs instead of integers
- Foreign key relationships now use string references

**Migration Options:**
1. **Fresh Start** (Recommended for new deployments or <10 users)
   - Set up new MongoDB instance
   - Update environment variables
   - Users re-register on new system

2. **Data Migration** (For production systems with significant data)
   - Use provided migration script: `scripts/migrate_to_mongo.py`
   - See [PHASE5_COMPLETION.md](PHASE5_COMPLETION.md) for migration guide
   - Includes dry-run mode and validation

**Environment Variable Changes:**
```diff
# OLD (PostgreSQL)
- DATABASE_URL=postgresql://user:pass@host:5432/db

# NEW (MongoDB)
+ MONGODB_URL=mongodb://localhost:27017
+ MONGODB_DB_NAME=invoiq
```

**API Response Changes:**
```diff
# OLD Response
{
-  "id": 123,
-  "user_id": 456,
-  "client_id": 789
}

# NEW Response
{
+  "id": "507f1f77bcf86cd799439011",
+  "user_id": "507f191e810c19729de860ea",
+  "client_id": "507f191e810c19729de860eb"
}
```

**Frontend Compatibility:**
- Update all API client code to handle string IDs
- Update type definitions: `id: number` → `id: string`
- Update route parameters: `/invoices/${id}` works the same
- Update comparisons: `invoice.client_id === client.id` still works

---

### ✨ New Features

#### Product Catalog Management
- **Endpoints**: `/v1/products/*`
- Create and manage product catalog with SKU tracking
- Stock quantity management with adjustment tracking
- Search by name, SKU, or description
- Filter by active status and category
- Sort by multiple fields (name, price, quantity, date)
- Soft delete (marks `is_active=false`)
- SKU uniqueness validation per user

**Example:**
```json
POST /v1/products
{
  "name": "Premium Hosting",
  "sku": "HOST-PREM-001",
  "description": "Premium hosting package",
  "price": 50.00,
  "currency": "USD",
  "quantity": 100,
  "category": "hosting",
  "tags": ["premium", "managed"]
}
```

#### Expense Tracking & Analytics
- **Endpoints**: `/v1/expenses/*`
- Track business expenses with categorization
- Period-based filtering (week/month/year)
- Category aggregation and summary
- Tag support for flexible organization
- Date range filtering
- Expense summary with grand total

**Period Filters:**
- `period=week&reference_date=2024-01-15` - Week containing date
- `period=month&reference_date=2024-01-15` - Full month
- `period=year&reference_date=2024-01-15` - Full year

**Category Summary Example:**
```json
GET /v1/expenses/summary?period=month
{
  "summaries": [
    {
      "category": "travel",
      "total_amount": "80000.00",
      "count": 2
    },
    {
      "category": "office",
      "total_amount": "15000.00",
      "count": 1
    }
  ],
  "grand_total": "95000.00",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31"
}
```

#### Enhanced Authentication
- Email verification system with expiring tokens
- Resend verification email endpoint
- Google OAuth integration
- Email verification status in user profile

#### User Profile Enhancements
- Avatar upload and management
- Company logo upload
- Profile update endpoint
- Company information fields

---

### 🔄 Changed

#### Performance Improvements
- All database operations now async (Motor driver)
- 28 MongoDB indexes auto-created for optimal query performance
- Compound indexes for common query patterns
- Text indexes for search functionality

**Indexes Include:**
- Users: email (unique), google_id, verification_token
- Clients: user_id + name, user_id + email, user_id + created_at
- Invoices: user_id + status, user_id + client_id, user_id + number (unique)
- Products: user_id + sku (unique), user_id + is_active, text search (name, description)
- Expenses: user_id + category, user_id + date, text search (description)

#### Repository Pattern
- Introduced repository layer for database operations
- Repositories: `UserRepository`, `ClientRepository`, `InvoiceRepository`, `ProductRepository`, `ExpenseRepository`
- Consistent async/await patterns
- Better separation of concerns

#### Authentication Flow
- All auth endpoints now async
- Improved token handling
- Email verification integrated into registration flow

---

### 🗑️ Removed

- **SQLAlchemy** dependency completely removed
- **PostgreSQL** driver (psycopg2) removed
- **Alembic** migrations removed (MongoDB is schema-less)
- SQLAlchemy models from `app/models/` (obsolete)
- `app/db/session.py` (SQLAlchemy session factory)

---

### 📝 Migration Guide

#### For Fresh Installations
1. Install MongoDB (local or Atlas)
2. Update `.env` with MongoDB connection strings
3. Run application (indexes created automatically)
4. No migration needed

#### For Existing Deployments

**Option 1: Fresh Start (Small user base)**
1. Backup existing data for reference
2. Set up MongoDB
3. Update environment variables
4. Deploy new version
5. Inform users to re-register

**Option 2: Data Migration (Production systems)**
1. Backup PostgreSQL database
2. Set up MongoDB instance
3. Configure both databases in environment
4. Run migration script:
   ```bash
   # Dry run first
   python scripts/migrate_to_mongo.py --dry-run
   
   # Actual migration
   python scripts/migrate_to_mongo.py
   ```
5. Verify migration with validation queries
6. Update environment to use only MongoDB
7. Deploy new version

**See [PHASE5_COMPLETION.md](PHASE5_COMPLETION.md) for detailed migration steps.**

---

### 🔧 Technical Changes

#### Dependencies
**Added:**
- `motor>=3.3.2` - Async MongoDB driver
- `pymongo>=4.6.0` - MongoDB core driver

**Removed:**
- `sqlalchemy`
- `psycopg2-binary`
- `alembic`

#### Configuration Changes
**New in config.py:**
```python
MONGODB_URL: str
MONGODB_DB_NAME: str
```

**Removed from config.py:**
```python
DATABASE_URL  # Replaced by MONGODB_URL + MONGODB_DB_NAME
```

#### Database Schema
- No more SQL migrations (schema-less MongoDB)
- Collections created automatically
- Indexes created on startup
- Flexible schema allows easy field additions

---

### 🐛 Bug Fixes
- Fixed rate limiting edge cases
- Improved error handling for database operations
- Better validation for unique constraints (email, SKU)
- Consistent error messages across endpoints

---

### 📚 Documentation
- Updated README.md with MongoDB setup instructions
- Added comprehensive test suite documentation
- Created PHASE5_COMPLETION.md (migration guide)
- Updated API documentation with new endpoints
- Added environment variable documentation

---

### 🧪 Testing
- Complete test suite rewritten for async/MongoDB
- 21 product API tests
- 21 expense API tests
- Updated auth and client/invoice tests
- Test fixtures with MongoDB test database
- Automatic test database cleanup
- Factory fixtures for bulk test data

---

### ⚠️ Known Issues
- Migration script requires both PostgreSQL and MongoDB access
- Large datasets (>100k records) may require batched migration
- Geospatial queries not yet implemented (future feature)

---

### 📋 Upgrade Checklist

- [ ] Backup existing PostgreSQL database
- [ ] Install/provision MongoDB instance
- [ ] Update environment variables (MONGODB_URL, MONGODB_DB_NAME)
- [ ] Remove old environment variables (DATABASE_URL)
- [ ] Update frontend to handle string IDs
- [ ] Run migration script (if migrating data)
- [ ] Verify indexes created (check application logs)
- [ ] Run test suite: `pytest`
- [ ] Test critical user flows (registration, login, invoice creation)
- [ ] Update deployment documentation
- [ ] Monitor application logs for database errors

---

## [1.x.x] - Previous Versions

See Git history for changes prior to MongoDB migration.
