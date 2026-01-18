"""
MongoDB index creation module.

Creates all necessary indexes on MongoDB collections based on
the specifications in indexes_spec.py. Includes helper utilities
for index management.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from app.db.indexes_spec import MONGO_INDEXES
from typing import List, Dict, Any
import asyncio


async def create_collection_indexes(
    db: AsyncIOMotorDatabase,
    collection_name: str,
    index_specs: List[Dict[str, Any]]
) -> None:
    """
    Create indexes for a single collection.
    
    Args:
        db: MongoDB database instance
        collection_name: Name of the collection
        index_specs: List of index specifications
    """
    collection = db[collection_name]
    
    for spec in index_specs:
        try:
            keys = spec["keys"]
            options = {k: v for k, v in spec.items() if k != "keys"}
            
            index_name = await collection.create_index(keys, **options)
            print(f"  ✅ Created index '{index_name}' on {collection_name}")
        except Exception as e:
            # Index might already exist, log but don't fail
            index_name = spec.get("name", str(keys))
            print(f"  ⚠️  Index '{index_name}' on {collection_name}: {str(e)}")


async def create_all_indexes(db: AsyncIOMotorDatabase) -> None:
    """
    Create all indexes defined in MONGO_INDEXES specification.
    
    This should be called on application startup after MongoDB connection
    is established. Indexes are created asynchronously and failures are
    logged but don't stop the application.
    
    Args:
        db: MongoDB database instance
        
    Example:
        @asynccontextmanager
        async def lifespan(app: FastAPI):
            await connect_to_mongo()
            await create_all_indexes(get_database())
            yield
            await close_mongo_connection()
    """
    print("🔧 Creating MongoDB indexes...")
    
    # Create indexes for each collection concurrently
    tasks = []
    for collection_name, index_specs in MONGO_INDEXES.items():
        task = create_collection_indexes(db, collection_name, index_specs)
        tasks.append(task)
    
    await asyncio.gather(*tasks, return_exceptions=True)
    
    print("✅ MongoDB indexes creation completed")


async def drop_all_indexes(db: AsyncIOMotorDatabase, exclude_id: bool = True) -> None:
    """
    Drop all indexes from all collections (useful for testing/development).
    
    Args:
        db: MongoDB database instance
        exclude_id: If True, preserves the default _id index
        
    Warning:
        This is a destructive operation. Use with caution!
    """
    print("⚠️  Dropping all MongoDB indexes...")
    
    for collection_name in MONGO_INDEXES.keys():
        collection = db[collection_name]
        try:
            if exclude_id:
                # Drop all indexes except _id
                indexes = await collection.index_information()
                for index_name in indexes.keys():
                    if index_name != "_id_":
                        await collection.drop_index(index_name)
                        print(f"  🗑️  Dropped index '{index_name}' from {collection_name}")
            else:
                # Drop all indexes including _id
                await collection.drop_indexes()
                print(f"  🗑️  Dropped all indexes from {collection_name}")
        except Exception as e:
            print(f"  ⚠️  Error dropping indexes from {collection_name}: {e}")
    
    print("✅ Index drop completed")


async def list_all_indexes(db: AsyncIOMotorDatabase) -> Dict[str, List[Dict[str, Any]]]:
    """
    List all existing indexes across all collections.
    
    Args:
        db: MongoDB database instance
        
    Returns:
        Dictionary mapping collection names to their index information
        
    Example:
        indexes = await list_all_indexes(db)
        for collection, index_list in indexes.items():
            print(f"{collection}: {len(index_list)} indexes")
    """
    all_indexes = {}
    
    for collection_name in MONGO_INDEXES.keys():
        collection = db[collection_name]
        try:
            indexes = await collection.index_information()
            all_indexes[collection_name] = indexes
        except Exception as e:
            print(f"  ⚠️  Error listing indexes from {collection_name}: {e}")
            all_indexes[collection_name] = {}
    
    return all_indexes


async def verify_indexes(db: AsyncIOMotorDatabase) -> bool:
    """
    Verify that all required indexes exist.
    
    Args:
        db: MongoDB database instance
        
    Returns:
        True if all required indexes exist, False otherwise
        
    Example:
        if not await verify_indexes(db):
            print("Some indexes are missing!")
            await create_all_indexes(db)
    """
    print("🔍 Verifying MongoDB indexes...")
    
    all_exist = True
    
    for collection_name, expected_specs in MONGO_INDEXES.items():
        collection = db[collection_name]
        existing_indexes = await collection.index_information()
        
        for spec in expected_specs:
            index_name = spec.get("name")
            if index_name and index_name not in existing_indexes:
                print(f"  ❌ Missing index '{index_name}' on {collection_name}")
                all_exist = False
            elif index_name:
                print(f"  ✅ Found index '{index_name}' on {collection_name}")
    
    if all_exist:
        print("✅ All required indexes exist")
    else:
        print("⚠️  Some indexes are missing")
    
    return all_exist
