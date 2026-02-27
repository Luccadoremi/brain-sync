from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base, get_db
from routers import auth, rss, feeds, notes
from services.rss_service import sync_sources_from_config


# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: auto-sync RSS sources from config
    print("🚀 Starting up Brain-Sync API...")
    Base.metadata.create_all(bind=engine)
    
    try:
        db = next(get_db())
        result = sync_sources_from_config(db)
        print(f"✅ Auto-synced RSS sources: {result}")
    except Exception as e:
        print(f"⚠️ Failed to auto-sync RSS sources: {e}")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Brain-Sync API...")


app = FastAPI(
    title="Brain-Sync API",
    description="Personal Knowledge Management System - 大脑外脑",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, tags=["Authentication"])
app.include_router(rss.router)
app.include_router(feeds.router)
app.include_router(notes.router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to Brain-Sync API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
