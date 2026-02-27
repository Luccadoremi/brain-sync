from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# Many-to-many relationship table for notes and tags
note_tags = Table(
    'note_tags',
    Base.metadata,
    Column('note_id', Integer, ForeignKey('notes.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)


class RSSSource(Base):
    __tablename__ = "rss_sources"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, unique=True, nullable=False)
    type = Column(String, default="blog")  # blog or podcast
    category = Column(String, default="")  # e.g., "AI研究与官方博客", "金融与市场"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    feeds = relationship("Feed", back_populates="source", cascade="all, delete-orphan")


class Feed(Base):
    __tablename__ = "feeds"
    
    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("rss_sources.id"), nullable=False)
    title = Column(String, nullable=False)
    original_title = Column(String)
    link = Column(String, nullable=False)
    published_at = Column(DateTime)
    content = Column(Text)
    
    # AI analysis results
    is_analyzed = Column(Boolean, default=False)
    translated_title = Column(String)
    summary = Column(Text)
    insight = Column(Text)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_archived = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    source = relationship("RSSSource", back_populates="feeds")


class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False)  # 工作能力, AI技术, 投资, 个人提升
    
    # Optional: link to original feed if saved from feed
    feed_id = Column(Integer, ForeignKey("feeds.id"), nullable=True)
    original_link = Column(String)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    tags = relationship("Tag", secondary=note_tags, back_populates="notes")


class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    notes = relationship("Note", secondary=note_tags, back_populates="tags")
