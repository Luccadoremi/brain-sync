from pydantic import BaseModel, HttpUrl
from datetime import datetime
from typing import Optional, List


# RSS Source schemas
class RSSSourceBase(BaseModel):
    name: str
    url: str
    type: str = "blog"
    category: Optional[str] = ""


class RSSSourceCreate(RSSSourceBase):
    pass


class RSSSourceResponse(RSSSourceBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


# Feed schemas
class FeedBase(BaseModel):
    title: str
    link: str


class FeedResponse(FeedBase):
    id: int
    source_id: int
    original_title: Optional[str] = None
    published_at: Optional[datetime] = None
    content: Optional[str] = None
    is_analyzed: bool
    translated_title: Optional[str] = None
    summary: Optional[str] = None
    insight: Optional[str] = None
    is_read: bool
    is_archived: bool
    created_at: datetime
    source: Optional[RSSSourceResponse] = None
    
    class Config:
        from_attributes = True


class FeedAnalysisResponse(BaseModel):
    translated_title: str
    summary: str
    insight: str


# Note schemas
class TagBase(BaseModel):
    name: str


class TagResponse(TagBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class NoteBase(BaseModel):
    title: str
    content: str
    category: str


class NoteCreate(NoteBase):
    feed_id: Optional[int] = None
    original_link: Optional[str] = None
    tag_names: Optional[List[str]] = []


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tag_names: Optional[List[str]] = None


class NoteResponse(NoteBase):
    id: int
    feed_id: Optional[int] = None
    original_link: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    tags: List[TagResponse] = []
    
    class Config:
        from_attributes = True


# Auth
class AuthRequest(BaseModel):
    access_token: str
