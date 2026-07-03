# database.py
import os
import asyncio
from supabase import AsyncClient, acreate_client
from dotenv import load_dotenv
import logging

# Configure standardized logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    logger.critical("Missing Supabase credentials in environment variables.")
    raise ValueError("CRITICAL BACKEND ERROR: Missing SUPABASE_URL or SUPABASE_KEY.")

# Global variable to hold the async singleton
_async_supabase_client: AsyncClient = None

async def init_db() -> AsyncClient:
    """
    Initializes the asynchronous Supabase client on application startup.
    Must be awaited in the FastAPI lifespan/startup event.
    """
    global _async_supabase_client
    if _async_supabase_client is None:
        try:
            _async_supabase_client = await acreate_client(SUPABASE_URL, SUPABASE_KEY)
            logger.info("Supabase AsyncClient successfully initialized.")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase AsyncClient: {str(e)}")
            raise
    return _async_supabase_client

async def get_db() -> AsyncClient:
    """
    Dependency injection provider for FastAPI routing contexts.
    Ensures non-blocking database operations.
    """
    if _async_supabase_client is None:
        raise RuntimeError("Database client not initialized. Call init_db() first.")
    return _async_supabase_client