from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from routers.auth import verify_token
import models
import schemas
from services.rss_service import fetch_rss_feeds, fetch_all_rss_sources, sync_sources_from_config

router = APIRouter(prefix="/rss", tags=["RSS Sources"])


@router.get("/sources", response_model=List[schemas.RSSSourceResponse])
async def get_rss_sources(
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Get all RSS sources"""
    sources = db.query(models.RSSSource).all()
    return sources


@router.post("/sources", response_model=schemas.RSSSourceResponse)
async def create_rss_source(
    source: schemas.RSSSourceCreate,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Create a new RSS source"""
    # Check if source already exists
    existing = db.query(models.RSSSource).filter(
        models.RSSSource.url == source.url
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="RSS source already exists")
    
    db_source = models.RSSSource(**source.dict())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    
    return db_source


@router.delete("/sources/{source_id}")
async def delete_rss_source(
    source_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Delete an RSS source"""
    source = db.query(models.RSSSource).filter(models.RSSSource.id == source_id).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="RSS source not found")
    
    db.delete(source)
    db.commit()
    
    return {"message": "RSS source deleted successfully"}


@router.post("/fetch")
async def fetch_all_feeds(
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Manually trigger fetching all RSS feeds"""
    result = await fetch_all_rss_sources(db)
    return result


@router.post("/sources/sync-from-config")
async def sync_sources(
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Sync RSS sources from rss_source.yaml on the server"""
    try:
        result = sync_sources_from_config(db)
        return result
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="Config file rss_source.yaml not found on server")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sources/{source_id}/fetch")
async def fetch_source_feeds(
    source_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Fetch feeds from a specific RSS source"""
    source = db.query(models.RSSSource).filter(models.RSSSource.id == source_id).first()
    
    if not source:
        raise HTTPException(status_code=404, detail="RSS source not found")
    
    new_feeds = await fetch_rss_feeds(source, db)
    return {"message": f"Fetched {len(new_feeds)} new feeds"}
