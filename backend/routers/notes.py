from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from routers.auth import verify_token
import models
import schemas

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("/", response_model=List[schemas.NoteResponse])
async def get_notes(
    category: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Get all notes with optional filtering"""
    query = db.query(models.Note)
    
    if category:
        query = query.filter(models.Note.category == category)
    
    if search:
        query = query.filter(
            (models.Note.title.contains(search)) | (models.Note.content.contains(search))
        )
    
    notes = query.order_by(models.Note.updated_at.desc()).offset(skip).limit(limit).all()
    return notes


@router.get("/{note_id}", response_model=schemas.NoteResponse)
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Get a single note by ID"""
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    return note


@router.post("/", response_model=schemas.NoteResponse)
async def create_note(
    note: schemas.NoteCreate,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Create a new note"""
    # Validate category
    valid_categories = ["工作能力", "AI技术", "投资", "个人提升"]
    if note.category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
        )
    
    # Create note
    db_note = models.Note(
        title=note.title,
        content=note.content,
        category=note.category,
        feed_id=note.feed_id,
        original_link=note.original_link
    )
    
    # Handle tags
    if note.tag_names:
        for tag_name in note.tag_names:
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
            db_note.tags.append(tag)
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    # If created from feed, mark feed as archived
    if note.feed_id:
        feed = db.query(models.Feed).filter(models.Feed.id == note.feed_id).first()
        if feed:
            feed.is_archived = True
            db.commit()
    
    return db_note


@router.put("/{note_id}", response_model=schemas.NoteResponse)
async def update_note(
    note_id: int,
    note_update: schemas.NoteUpdate,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Update a note"""
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Update fields
    if note_update.title is not None:
        db_note.title = note_update.title
    if note_update.content is not None:
        db_note.content = note_update.content
    if note_update.category is not None:
        valid_categories = ["工作能力", "AI技术", "投资", "个人提升"]
        if note_update.category not in valid_categories:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid category. Must be one of: {', '.join(valid_categories)}"
            )
        db_note.category = note_update.category
    
    # Update tags if provided
    if note_update.tag_names is not None:
        db_note.tags = []
        for tag_name in note_update.tag_names:
            tag = db.query(models.Tag).filter(models.Tag.name == tag_name).first()
            if not tag:
                tag = models.Tag(name=tag_name)
                db.add(tag)
            db_note.tags.append(tag)
    
    db.commit()
    db.refresh(db_note)
    
    return db_note


@router.delete("/{note_id}")
async def delete_note(
    note_id: int,
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Delete a note"""
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}


@router.get("/categories/list")
async def get_categories(
    authenticated: bool = Depends(verify_token)
):
    """Get list of available categories"""
    return {
        "categories": [
            {"id": "工作能力", "name": "💼 工作能力", "description": "工作复盘、专业技能"},
            {"id": "AI技术", "name": "🤖 AI技术", "description": "大模型动态、提示词、工具"},
            {"id": "投资", "name": "📈 投资", "description": "宏观经济、理财策略"},
            {"id": "个人提升", "name": "🌟 个人提升", "description": "摄影、运动、读书计划"}
        ]
    }


@router.get("/tags/list", response_model=List[schemas.TagResponse])
async def get_tags(
    db: Session = Depends(get_db),
    authenticated: bool = Depends(verify_token)
):
    """Get all tags"""
    tags = db.query(models.Tag).all()
    return tags
