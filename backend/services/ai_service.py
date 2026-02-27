from openai import OpenAI
from config import get_settings
import models
from sqlalchemy.orm import Session

settings = get_settings()

# Initialize Qwen client
client = OpenAI(
    api_key=settings.qwen_api_key,
    base_url=settings.qwen_api_base,
)


async def analyze_feed_with_qwen(feed: models.Feed, db: Session) -> dict:
    """
    Use Qwen AI to analyze a feed item and generate:
    1. Translated title (if English)
    2. Core summary (3 key points)
    3. Personal insight
    """
    
    # Prepare prompt
    prompt = f"""你是一个专业的知识助手,需要分析以下文章或播客内容,并按照特定格式输出:

标题: {feed.title}
内容: {feed.content[:2000] if feed.content else '暂无内容'}

请按照以下格式输出:

【标题翻译】
如果原标题是英文,提供精准的中文翻译。如果已经是中文,直接复述原标题。

【核心总结】
用3个要点提炼核心内容,每个要点一行,格式为:
1. 第一个要点
2. 第二个要点
3. 第三个要点

【专属见解】
结合用户的知识领域(工作能力、AI技术、投资、个人提升),给出一句简短的点评或建议(不超过50字)。

请严格按照上述格式输出,不要添加其他内容。"""

    try:
        response = client.chat.completions.create(
            model="qwen-plus",
            messages=[
                {"role": "system", "content": "你是一个专业的知识管理助手,擅长分析和提炼信息。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        result = response.choices[0].message.content
        
        # Parse the result
        translated_title = ""
        summary = ""
        insight = ""
        
        lines = result.split('\n')
        current_section = None
        
        for line in lines:
            line = line.strip()
            if '【标题翻译】' in line:
                current_section = 'title'
                continue
            elif '【核心总结】' in line:
                current_section = 'summary'
                continue
            elif '【专属见解】' in line:
                current_section = 'insight'
                continue
            
            if line:
                if current_section == 'title':
                    translated_title += line + '\n'
                elif current_section == 'summary':
                    summary += line + '\n'
                elif current_section == 'insight':
                    insight += line + '\n'
        
        # Update feed with analysis
        feed.is_analyzed = True
        feed.translated_title = translated_title.strip()
        feed.summary = summary.strip()
        feed.insight = insight.strip()
        
        db.commit()
        db.refresh(feed)
        
        return {
            "translated_title": feed.translated_title,
            "summary": feed.summary,
            "insight": feed.insight
        }
        
    except Exception as e:
        print(f"Error analyzing feed with Qwen: {e}")
        raise e
