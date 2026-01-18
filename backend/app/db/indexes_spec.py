"""
MongoDB index specifications for InvoIQ collections.
Defines all indexes needed for optimal query performance.
"""

# Index specifications by collection
# Format: {collection_name: [index_spec, ...]}

MONGO_INDEXES = {
    "users": [
        {
            "keys": [("email", 1)],
            "unique": True,
            "name": "idx_users_email_unique"
        },
        {
            "keys": [("is_active", 1)],
            "name": "idx_users_is_active"
        },
        {
            "keys": [("oauth_provider", 1), ("oauth_provider_id", 1)],
            "sparse": True,  # Only index documents with these fields
            "name": "idx_users_oauth"
        },
        {
            "keys": [("subscription_status", 1), ("is_pro", 1)],
            "name": "idx_users_subscription"
        }
    ],
    
    "clients": [
        {
            "keys": [("user_id", 1)],
            "name": "idx_clients_user_id"
        },
        {
            "keys": [("user_id", 1), ("name", 1)],
            "name": "idx_clients_user_name"
        },
        {
            "keys": [("email", 1)],
            "sparse": True,
            "name": "idx_clients_email"
        },
        {
            "keys": [("name", "text")],  # Text index for search
            "name": "idx_clients_name_text"
        }
    ],
    
    "products": [
        {
            "keys": [("user_id", 1), ("sku", 1)],
            "unique": True,
            "name": "idx_products_user_sku_unique"
        },
        {
            "keys": [("user_id", 1), ("is_active", 1)],
            "name": "idx_products_user_active"
        },
        {
            "keys": [("user_id", 1), ("created_at", -1)],
            "name": "idx_products_user_created"
        },
        {
            "keys": [("name", "text"), ("description", "text")],
            "name": "idx_products_text_search",
            "weights": {"name": 10, "description": 1}  # Name more important in search
        }
    ],
    
    "invoices": [
        {
            "keys": [("user_id", 1), ("number", 1)],
            "unique": True,
            "sparse": True,  # Allow null numbers (auto-generated)
            "name": "idx_invoices_user_number_unique"
        },
        {
            "keys": [("user_id", 1), ("status", 1)],
            "name": "idx_invoices_user_status"
        },
        {
            "keys": [("user_id", 1), ("client_id", 1)],
            "name": "idx_invoices_user_client"
        },
        {
            "keys": [("user_id", 1), ("issued_date", -1)],
            "name": "idx_invoices_user_issued_date"
        },
        {
            "keys": [("user_id", 1), ("due_date", 1)],
            "name": "idx_invoices_user_due_date"
        },
        {
            "keys": [("user_id", 1), ("status", 1), ("due_date", 1)],
            "name": "idx_invoices_user_status_due"
        },
        {
            "keys": [("user_id", 1), ("created_at", -1)],
            "name": "idx_invoices_user_created"
        },
        {
            "keys": [("number", "text")],
            "name": "idx_invoices_number_text"
        }
    ],
    
    "expenses": [
        {
            "keys": [("user_id", 1), ("date", -1)],
            "name": "idx_expenses_user_date"
        },
        {
            "keys": [("user_id", 1), ("category", 1)],
            "name": "idx_expenses_user_category"
        },
        {
            "keys": [("user_id", 1), ("category", 1), ("date", -1)],
            "name": "idx_expenses_user_category_date"
        },
        {
            "keys": [("user_id", 1), ("created_at", -1)],
            "name": "idx_expenses_user_created"
        },
        {
            "keys": [("tags", 1)],
            "sparse": True,
            "name": "idx_expenses_tags"
        }
    ],
    
    "extractions": [
        {
            "keys": [("user_id", 1), ("created_at", -1)],
            "sparse": True,  # user_id is nullable for anonymous extractions
            "name": "idx_extractions_user_created"
        },
        {
            "keys": [("source_type", 1)],
            "name": "idx_extractions_source_type"
        },
        {
            "keys": [("created_at", -1)],
            "name": "idx_extractions_created"
        }
    ]
}


# Compound index patterns for common queries
QUERY_PATTERNS = {
    "users": {
        "find_by_email": "idx_users_email_unique",
        "list_active": "idx_users_is_active",
        "list_pro_users": "idx_users_subscription"
    },
    
    "clients": {
        "list_by_user": "idx_clients_user_id",
        "search_by_name": "idx_clients_name_text",
        "list_by_user_sorted": "idx_clients_user_name"
    },
    
    "products": {
        "find_by_sku": "idx_products_user_sku_unique",
        "list_active_products": "idx_products_user_active",
        "search_products": "idx_products_text_search",
        "list_recent": "idx_products_user_created"
    },
    
    "invoices": {
        "find_by_number": "idx_invoices_user_number_unique",
        "list_by_status": "idx_invoices_user_status",
        "list_by_client": "idx_invoices_user_client",
        "list_by_due_date": "idx_invoices_user_due_date",
        "list_overdue": "idx_invoices_user_status_due",
        "list_recent": "idx_invoices_user_created",
        "weekly_monthly_filter": "idx_invoices_user_issued_date"
    },
    
    "expenses": {
        "list_by_date": "idx_expenses_user_date",
        "list_by_category": "idx_expenses_user_category",
        "weekly_monthly_by_category": "idx_expenses_user_category_date",
        "list_by_tags": "idx_expenses_tags"
    }
}


# Index creation commands (for reference/documentation)
INDEX_CREATION_COMMANDS = """
# MongoDB shell commands to create indexes manually (for reference)

# Users
db.users.createIndex({email: 1}, {unique: true, name: "idx_users_email_unique"})
db.users.createIndex({is_active: 1}, {name: "idx_users_is_active"})
db.users.createIndex({oauth_provider: 1, oauth_provider_id: 1}, {sparse: true, name: "idx_users_oauth"})
db.users.createIndex({subscription_status: 1, is_pro: 1}, {name: "idx_users_subscription"})

# Clients
db.clients.createIndex({user_id: 1}, {name: "idx_clients_user_id"})
db.clients.createIndex({user_id: 1, name: 1}, {name: "idx_clients_user_name"})
db.clients.createIndex({email: 1}, {sparse: true, name: "idx_clients_email"})
db.clients.createIndex({name: "text"}, {name: "idx_clients_name_text"})

# Products
db.products.createIndex({user_id: 1, sku: 1}, {unique: true, name: "idx_products_user_sku_unique"})
db.products.createIndex({user_id: 1, is_active: 1}, {name: "idx_products_user_active"})
db.products.createIndex({user_id: 1, created_at: -1}, {name: "idx_products_user_created"})
db.products.createIndex({name: "text", description: "text"}, {name: "idx_products_text_search", weights: {name: 10, description: 1}})

# Invoices
db.invoices.createIndex({user_id: 1, number: 1}, {unique: true, sparse: true, name: "idx_invoices_user_number_unique"})
db.invoices.createIndex({user_id: 1, status: 1}, {name: "idx_invoices_user_status"})
db.invoices.createIndex({user_id: 1, client_id: 1}, {name: "idx_invoices_user_client"})
db.invoices.createIndex({user_id: 1, issued_date: -1}, {name: "idx_invoices_user_issued_date"})
db.invoices.createIndex({user_id: 1, due_date: 1}, {name: "idx_invoices_user_due_date"})
db.invoices.createIndex({user_id: 1, status: 1, due_date: 1}, {name: "idx_invoices_user_status_due"})
db.invoices.createIndex({user_id: 1, created_at: -1}, {name: "idx_invoices_user_created"})
db.invoices.createIndex({number: "text"}, {name: "idx_invoices_number_text"})

# Expenses
db.expenses.createIndex({user_id: 1, date: -1}, {name: "idx_expenses_user_date"})
db.expenses.createIndex({user_id: 1, category: 1}, {name: "idx_expenses_user_category"})
db.expenses.createIndex({user_id: 1, category: 1, date: -1}, {name: "idx_expenses_user_category_date"})
db.expenses.createIndex({user_id: 1, created_at: -1}, {name: "idx_expenses_user_created"})
db.expenses.createIndex({tags: 1}, {sparse: true, name: "idx_expenses_tags"})

# Extractions
db.extractions.createIndex({user_id: 1, created_at: -1}, {sparse: true, name: "idx_extractions_user_created"})
db.extractions.createIndex({source_type: 1}, {name: "idx_extractions_source_type"})
db.extractions.createIndex({created_at: -1}, {name: "idx_extractions_created"})
"""
