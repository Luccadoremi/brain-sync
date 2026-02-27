from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from routers.auth import verify_token
import models
import schemas
from services.ai_service import analyze_feed_with_qwen

router = APIRouter(prefix="/feeds", tags=["Feeds"])


@router.get("/", response_model=List[schemas.FeedResponse])
async def get_feeds(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    unarchived_only: bool = True,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Get all feeds with pagination"""
    query = db.query(models.Feed)
    
    if unread_only:
        query = query.filter(models.Feed.is_read == False)
    
    if unarchived_only:
        query = query.filter(models.Feed.is_archived == False)
    
    feeds = query.order_by(models.Feed.published_at.desc()).offset(skip).limit(limit).all()
    return feeds


@router.get("/{feed_id}", response_model=schemas.FeedResponse)
async def get_feed(
    feed_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Get a single feed by ID"""
    feed = db.query(models.Feed).filter(models.Feed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    return feed


@router.post("/{feed_id}/analyze", response_model=schemas.FeedAnalysisResponse)
async def analyze_feed(
    feed_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Analyze a feed with Qwen AI"""
    feed = db.query(models.Feed).filter(models.Feed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    # If already analyzed, return existing analysis
    if feed.is_analyzed:
        return {
            "translated_title": feed.translated_title,
            "summary": feed.summary,
            "insight": feed.insight
        }
    
    # Perform analysis
    try:
        result = await analyze_feed_with_qwen(feed, db)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze feed: {str(e)}")


@router.patch("/{feed_id}/mark-read")
async def mark_feed_read(
    feed_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Mark a feed as read"""
    feed = db.query(models.Feed).filter(models.Feed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    feed.is_read = True
    db.commit()
    
    return {"message": "Feed marked as read"}


@router.patch("/{feed_id}/archive")
async def archive_feed(
    feed_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Archive a feed"""
    feed = db.query(models.Feed).filter(models.Feed.id == feed_id).first()
    
    if not feed:
        raise HTTPException(status_code=404, detail="Feed not found")
    
    feed.is_archived = True
    db.commit()
    
    return {"message": "Feed archived"}
