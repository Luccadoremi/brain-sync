import feedparser
from datetime import datetime
from typing import List
from pathlib import Path

import yaml
from sqlalchemy.orm import Session
import models
import schemas


async def fetch_rss_feeds(source: models.RSSSource, db: Session) -> List[models.Feed]:
    """
    Fetch RSS feeds from a given source and save to database
    """
    try:
        feed = feedparser.parse(source.url)
        new_feeds = []
        
        for entry in feed.entries:
            # Check if feed already exists
            existing_feed = db.query(models.Feed).filter(
                models.Feed.link == entry.link
            ).first()
            
            if existing_feed:
                continue
            
            # Parse published date
            published_at = None
            if hasattr(entry, 'published_parsed') and entry.published_parsed:
                published_at = datetime(*entry.published_parsed[:6])
            
            # Get content (for podcasts, use description/summary)
            content = ""
            if hasattr(entry, 'content'):
                content = entry.content[0].value
            elif hasattr(entry, 'summary'):
                content = entry.summary
            elif hasattr(entry, 'description'):
                content = entry.description
            
            # Create new feed
            new_feed = models.Feed(
                source_id=source.id,
                title=entry.title,
                original_title=entry.title,
                link=entry.link,
                published_at=published_at,
                content=content,
            )
            
            db.add(new_feed)
            new_feeds.append(new_feed)
        
        db.commit()
        return new_feeds
        
    except Exception as e:
        print(f"Error fetching RSS from {source.url}: {e}")
        return []


async def fetch_all_rss_sources(db: Session):
    """
    Fetch all RSS sources and update feeds
    """
    sources = db.query(models.RSSSource).all()
    
    total_new = 0
    for source in sources:
        new_feeds = await fetch_rss_feeds(source, db)
        total_new += len(new_feeds)
    
    return {"message": f"Fetched {total_new} new feeds from {len(sources)} sources"}


def sync_sources_from_config(db: Session):
    """Load RSS sources from rss_source.yaml and sync with database.

    - Creates new sources when URL does not exist
    - Updates name/type when URL already exists
    """
    # rss_source.yaml is located in the project root (MindSync/)
    project_root = Path(__file__).resolve().parents[2]
    config_path = project_root / "rss_source.yaml"

    if not config_path.exists():
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with config_path.open("r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    feeds = data.get("feeds", []) or []

    created = 0
    updated = 0

    for cfg in feeds:
        name = cfg.get("name")
        url = cfg.get("url")
        category = cfg.get("category", "")

        if not name or not url:
            continue

        # Map yaml category to our simple type field (blog / podcast)
        lower_cat = str(category).lower()
        source_type = "podcast" if "podcast" in lower_cat or "播客" in lower_cat else "blog"

        existing = db.query(models.RSSSource).filter(models.RSSSource.url == url).first()

        if existing:
            changed = False
            if existing.name != name:
                existing.name = name
                changed = True
            if existing.type != source_type:
                existing.type = source_type
                changed = True
            if existing.category != category:
                existing.category = category
                changed = True
            if changed:
                updated += 1
        else:
            db_source = models.RSSSource(name=name, url=url, type=source_type, category=category)
            db.add(db_source)
            created += 1

    db.commit()

    return {
        "message": f"Synced {len(feeds)} sources from config (created={created}, updated={updated})",
        "created": created,
        "updated": updated,
        "total": len(feeds),
    }
