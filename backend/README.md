# InvoIQ Backend API

AI-powered invoice and client management system backend built with FastAPI, Motor (async MongoDB driver), and MongoDB.

## 🚀 Features

- **Authentication**: JWT-based user registration and login with email verification
- **Client Management**: CRUD operations for client records
- **Invoice Management**: Create, update, delete, and track invoices with items
- **Product Catalog**: Manage products with SKU tracking, stock levels, and pricing
- **Expense Tracking**: Track business expenses with categories, tags, and period-based aggregation
- **AI Extraction**: Extract job details from chat screenshots or text using OpenAI
- **PDF Generation**: Generate professional invoice PDFs
- **Payment Integration**: Paystack and Stripe subscription management
- **Pro Features**: Subscription-based premium features
- **Reminders**: Send invoice payment reminders
- **Period Filters**: Week/month/year filtering for expenses and analytics

## 📋 Prerequisites

- Python 3.9+
- **MongoDB 4.4+** (local installation or MongoDB Atlas)
- OpenAI API key (for extraction features)
- Paystack/Stripe API keys (for payment features)

## 🛠️ Installation

### MongoDB Setup

1. **Install MongoDB locally** (option 1)
   ```bash
   # macOS
   brew tap mongodb/brew
   brew install mongodb-community@7.0
   brew services start mongodb-community@7.0
   
   # Ubuntu/Debian
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   
   # Windows
   # Download and install from https://www.mongodb.com/try/download/community
   ```

2. **Or use MongoDB Atlas** (option 2 - free tier available)
   - Create account at https://www.mongodb.com/cloud/atlas
   - Create a free cluster
   - Get connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)

### Backend Setup

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create and activate virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Create environment file**
   ```bash
   cp .env.example .env
   ```

5. **Configure environment variables** (see Environment Variables section)

6. **Run the application**
   ```bash
   uvicorn app.main:app --reload
   ```

The API will be available at `http://localhost:8000`

**Auto-Indexing**: MongoDB indexes are created automatically on first database connection. Check logs for index creation confirmation.

## 🔧 Environment Variables

Create a `.env` file in the backend directory with the following variables:

### Core Settings
```env
SECRET_KEY=your-secret-key-here-min-32-chars
APP_BASE_URL=http://localhost:8000
```

### MongoDB Database
```env
# Local MongoDB
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB_NAME=invoiq

# MongoDB Atlas (Cloud)
# MONGODB_URL=mongodb+srv://username:password@cluster.mongodb.net/
# MONGODB_DB_NAME=invoiq
```

### AI Extraction
```env
EXTRACTOR_PROVIDER=openai
OPENAI_API_KEY=your-openai-api-key
```

### Storage
```env
STORAGE_PROVIDER=local
STORAGE_LOCAL_DIR=./generated
```

### Payment Providers
```env
PAYSTACK_SECRET_KEY=your-paystack-secret-key
PAYSTACK_BASE_URL=https://api.paystack.co
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### Email (for verification emails)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@invoiq.com
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/auth/register` | Register new user | No |
| POST | `/v1/auth/login` | Login user | No |
| GET | `/v1/auth/verify-email` | Verify email with token | No |
| POST | `/v1/auth/resend-verification` | Resend verification email | No |
| POST | `/v1/auth/google` | OAuth login with Google | No |

### User Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/v1/users/me` | Get current user | Yes |
| PUT | `/v1/users/me` | Update user profile | Yes |
| POST | `/v1/users/me/avatar` | Upload avatar | Yes |
| POST | `/v1/users/me/company-logo` | Upload company logo | Yes |

### Client Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/v1/clients` | List all clients | Yes |
| POST | `/v1/clients` | Create new client | Yes |
| GET | `/v1/clients/{id}` | Get client details | Yes |
| PUT | `/v1/clients/{id}` | Update client | Yes |
| DELETE | `/v1/clients/{id}` | Delete client | Yes |

### Invoice Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/v1/invoices` | List invoices with filters | Yes |
| POST | `/v1/invoices` | Create invoice manually | Yes |
| GET | `/v1/invoices/{id}` | Get invoice details | Yes |
| PUT | `/v1/invoices/{id}` | Update invoice | Yes |
| DELETE | `/v1/invoices/{id}` | Delete invoice | Yes |

### Product Catalog

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/v1/products` | List products (search, filter, sort) | Yes |
| POST | `/v1/products` | Create product | Yes |
| GET | `/v1/products/{id}` | Get product details | Yes |
| PUT | `/v1/products/{id}` | Update product | Yes |
| DELETE | `/v1/products/{id}` | Soft delete product | Yes |
| POST | `/v1/products/{id}/adjust-quantity` | Adjust stock quantity | Yes |

**Product Query Parameters:**
- `search` - Search by name, SKU, or description
- `is_active` - Filter by active status (true/false)
- `sort_by` - Sort field (name, sku, price, quantity, created_at)
- `sort_order` - Sort direction (asc/desc)
- `limit` / `offset` - Pagination

### Expense Tracking

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/v1/expenses` | List expenses with filters | Yes |
| POST | `/v1/expenses` | Create expense | Yes |
| GET | `/v1/expenses/{id}` | Get expense details | Yes |
| PUT | `/v1/expenses/{id}` | Update expense | Yes |
| DELETE | `/v1/expenses/{id}` | Delete expense | Yes |
| GET | `/v1/expenses/categories` | Get unique categories | Yes |
| GET | `/v1/expenses/summary` | Get category summary | Yes |

**Expense Query Parameters:**
- `category` - Filter by category
- `date_from` / `date_to` - Date range filter
- `period` - Period filter (week/month/year)
- `reference_date` - Reference date for period filter
- `tags` - Filter by tags (comma-separated)
- `limit` / `offset` - Pagination

**Expense Summary Response:**
```json
{
  "summaries": [
    {
      "category": "travel",
      "total_amount": "80000.00",
      "count": 2
    }
  ],
  "grand_total": "95000.00",
  "period_start": "2024-01-01",
  "period_end": "2024-01-31"
}
```

### AI Extraction

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/extract-job-details` | Extract data from text/image | No |

### Payments & Subscriptions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/payments/subscription/create` | Create subscription | Yes |
| POST | `/v1/payments/subscription/verify` | Verify subscription | Yes |
| GET | `/v1/payments/subscription/status` | Get subscription status | Yes |
| POST | `/v1/payments/webhook/paystack` | Paystack webhook | No |
| POST | `/v1/payments/webhook/stripe` | Stripe webhook | No |

### Reminders

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/v1/send-reminder` | Send invoice reminder | Yes |

## 🗃️ Database Models

All models use MongoDB with string-based ObjectId primary keys.

### User
- `id` (string ObjectId), `email`, `hashed_password`, `full_name`, `is_active`, `is_verified`
- `verification_token`, `verification_token_expiry`
- Pro subscription fields: `is_pro`, `subscription_status`, `subscription_id`, etc.
- OAuth fields: `google_id`, `profile_picture`
- Business info: `company_name`, `company_logo_url`

### Client
- `id` (string ObjectId), `user_id` (string), `name`, `email`, `phone`, `address`
- Timestamps: `created_at`, `updated_at`

### Invoice
- `id` (string ObjectId), `user_id` (string), `client_id` (string)
- `number`, `status`, `due_date`, `issue_date`
- `items` (list), `subtotal`, `tax`, `total`, `pdf_url`, `payment_link`
- Timestamps: `created_at`, `updated_at`

### Product
- `id` (string ObjectId), `user_id` (string)
- `name`, `sku` (unique per user), `description`, `price`, `currency`
- `quantity`, `is_active`, `category`, `tags` (list)
- Timestamps: `created_at`, `updated_at`

### Expense
- `id` (string ObjectId), `user_id` (string)
- `category`, `description`, `amount`, `currency`, `vendor`
- `date`, `tags` (list), `notes`
- Timestamps: `created_at`, `updated_at`

### Extraction
- `id` (string ObjectId), `user_id` (string)
- `source_type`, `raw_text`, `parsed_data`, `confidence`
- Timestamps: `created_at`

### Payment
- `id` (string ObjectId), `invoice_id` (string)
- `amount`, `provider`, `provider_ref`, `status`
- Timestamps: `created_at`, `updated_at`

**⚠️ Breaking Change from v1:** All ID fields are now strings (MongoDB ObjectIds) instead of integers.

## 🧪 Testing

The test suite uses MongoDB with automatic database cleanup.

### Run Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_products.py

# Run specific test class
pytest tests/test_expenses.py::TestExpensesAPI

# Run tests with markers
pytest -m integration  # Run only integration tests
pytest -m unit         # Run only unit tests

# Verbose output
pytest -v
```

### Test Configuration

Tests use a separate MongoDB database (`test_invoiq_db`) that is automatically:
- Created before each test function
- Populated with necessary indexes
- Cleaned up after each test

Test fixtures provide:
- Authenticated test users (regular and pro)
- Pre-created entities (clients, products, expenses)
- Factory functions for bulk data creation

**Note**: Ensure MongoDB is running before running tests.

## 🚀 Deployment

### Using Docker
```bash
# Build image
docker build -t invoyq-backend .

# Run container
docker run -p 8000:8000 --env-file .env invoyq-backend
```

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
```

### Production Considerations

1. **Database**: Use MongoDB Atlas for production with proper authentication
   - Enable authentication on your MongoDB instance
   - Use connection string with authentication: `mongodb://username:password@host:port/db`
   - Enable SSL/TLS for encrypted connections
   - Set up replica sets for high availability

2. **Secret Key**: Generate a secure random secret key (min 32 characters)
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

3. **CORS**: Configure `allow_origins` restrictively in [main.py](app/main.py#L18-L25)

4. **SSL**: Enable HTTPS and secure cookie settings

5. **Rate Limiting**: Configure rate limiting for API endpoints (already implemented)

6. **Monitoring**: Add logging and health check endpoints

7. **MongoDB Indexes**: Indexes are created automatically on startup (see logs)

8. **Environment Variables**: Never commit `.env` file, use secure secrets management

9. **Email**: Configure SMTP settings for email verification (Gmail, SendGrid, etc.)

## 📝 API Response Examples

### Authentication
```json
// POST /v1/auth/register
{
  "email": "user@example.com",
  "password": "securepassword",
  "full_name": "John Doe"
}

// Response
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "is_active": true,
  "is_pro": false
}
```

### Invoice Creation
```json
// POST /v1/invoices
{
  "client_id": 1,
  "number": "INV-001",
  "due_date": "2024-01-15",
  "items": [
    {
      "description": "Web Development",
      "quantity": 1,
      "unit_price": 1500.00
    }
  ],
  "notes": "Payment due within 30 days"
}
```

### Extraction
```json
// POST /v1/extract-job-details
{
  "text": "I need a website built by January 15th. Budget is $1500."
}

// Response
{
  "extraction_id": 123,
  "parsed_data": {
    "jobs": ["Website development"],
    "deadline": "2024-01-15",
    "amount": 1500.00,
    "currency": "USD"
  },
  "confidence": 0.85
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related

- [Frontend Repository](../frontend) - Next.js frontend application
- [Documentation](../docs) - Detailed API documentation
- [Deployment Guide](../docs/deployment.md) - Production deployment guide
