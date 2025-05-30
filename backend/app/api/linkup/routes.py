"""
🔗 Linkup.so API Routes for D&D Content Enhancement
Real-time web content integration for enhanced gameplay
"""

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from app.services.linkup_service import linkup_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["linkup"])

# Request Models
class RulesLookupRequest(BaseModel):
    query: str
    context: Optional[str] = ""

class MonsterSearchRequest(BaseModel):
    challenge_rating: Optional[str] = ""
    environment: Optional[str] = ""

class SpellSearchRequest(BaseModel):
    spell_name: Optional[str] = ""
    spell_level: Optional[str] = ""
    character_class: Optional[str] = ""

class ItemSearchRequest(BaseModel):
    item_type: Optional[str] = ""
    rarity: Optional[str] = ""

class CampaignInspirationRequest(BaseModel):
    theme: Optional[str] = ""
    setting: Optional[str] = ""

class SceneEnhancementRequest(BaseModel):
    scene_description: str
    party_level: Optional[int] = 1

class CharacterBuildRequest(BaseModel):
    character_class: str
    level: Optional[int] = 1
    build_type: Optional[str] = ""

@router.get("/status")
async def get_linkup_status():
    """
    🔗 Check Linkup.so service status
    """
    try:
        # Test with a simple query
        test_result = await linkup_service.search_dnd_rules("initiative order", "combat")
        
        return JSONResponse({
            "success": True,
            "service": "Linkup.so D&D Enhancement",
            "status": "ONLINE",
            "api_key_configured": bool(linkup_service.api_key),
            "test_query_success": test_result.get("success", False),
            "features": [
                "🎲 D&D Rules Lookup",
                "🐲 Monster Database Search", 
                "✨ Spell Reference",
                "⚔️ Magic Items & Equipment",
                "🗺️ Campaign Inspiration",
                "📰 D&D News & Updates",
                "🌟 Scene Enhancement",
                "👤 Character Build Advice"
            ]
        })
    except Exception as e:
        logger.error(f"Linkup status check failed: {e}")
        return JSONResponse({
            "success": False,
            "error": str(e),
            "status": "ERROR"
        }, status_code=500)

@router.post("/rules-lookup")
async def lookup_dnd_rules(request: RulesLookupRequest):
    """
    🎲 Look up D&D rules and mechanics
    """
    try:
        result = await linkup_service.search_dnd_rules(request.query, request.context)
        
        if result["success"]:
            logger.info(f"✅ Rules lookup successful: {request.query}")
            return JSONResponse({
                "success": True,
                "query": request.query,
                "answer": result["answer"],
                "sources": result["sources"],
                "type": "rules_lookup",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ Rules lookup failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Rules lookup failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Rules lookup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/monster-search")
async def search_monsters(request: MonsterSearchRequest):
    """
    🐲 Search for D&D monsters by challenge rating and environment
    """
    try:
        result = await linkup_service.search_monsters(
            request.challenge_rating, 
            request.environment
        )
        
        if result["success"]:
            logger.info(f"✅ Monster search successful: CR {request.challenge_rating}, {request.environment}")
            return JSONResponse({
                "success": True,
                "monsters": result["answer"],
                "sources": result["sources"],
                "challenge_rating": request.challenge_rating,
                "environment": request.environment,
                "type": "monster_search",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ Monster search failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Monster search failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Monster search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/spell-lookup")
async def lookup_spells(request: SpellSearchRequest):
    """
    ✨ Look up D&D spells and magical abilities
    """
    try:
        result = await linkup_service.search_spells(
            request.spell_name,
            request.spell_level,
            request.character_class
        )
        
        if result["success"]:
            logger.info(f"✅ Spell lookup successful: {request.spell_name}")
            return JSONResponse({
                "success": True,
                "spell_info": result["answer"],
                "sources": result["sources"],
                "spell_name": request.spell_name,
                "spell_level": request.spell_level,
                "character_class": request.character_class,
                "type": "spell_lookup",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ Spell lookup failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Spell lookup failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Spell lookup error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/item-search")
async def search_items(request: ItemSearchRequest):
    """
    ⚔️ Search for magical items and equipment
    """
    try:
        result = await linkup_service.search_items_and_equipment(
            request.item_type,
            request.rarity
        )
        
        if result["success"]:
            logger.info(f"✅ Item search successful: {request.item_type}, {request.rarity}")
            return JSONResponse({
                "success": True,
                "items": result["answer"],
                "sources": result["sources"],
                "item_type": request.item_type,
                "rarity": request.rarity,
                "type": "item_search",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ Item search failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Item search failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Item search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/campaign-inspiration")
async def get_campaign_inspiration(request: CampaignInspirationRequest):
    """
    🗺️ Get campaign ideas and plot hooks
    """
    try:
        result = await linkup_service.search_campaign_inspiration(
            request.theme,
            request.setting
        )
        
        if result["success"]:
            logger.info(f"✅ Campaign inspiration successful: {request.theme}, {request.setting}")
            return JSONResponse({
                "success": True,
                "inspiration": result["answer"],
                "sources": result["sources"],
                "theme": request.theme,
                "setting": request.setting,
                "type": "campaign_inspiration",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ Campaign inspiration failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Campaign inspiration failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Campaign inspiration error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dnd-news")
async def get_dnd_news():
    """
    📰 Get latest D&D news and updates
    """
    try:
        result = await linkup_service.search_dnd_news()
        
        if result["success"]:
            logger.info("✅ D&D news fetch successful")
            return JSONResponse({
                "success": True,
                "news": result["answer"],
                "sources": result["sources"],
                "type": "dnd_news",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ D&D news failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"D&D news failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"D&D news error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/enhance-scene")
async def enhance_scene_with_content(request: SceneEnhancementRequest):
    """
    🌟 Enhance current scene with relevant D&D content
    """
    try:
        result = await linkup_service.enhance_scene_with_content(
            request.scene_description,
            request.party_level
        )
        
        if result["success"]:
            logger.info(f"✅ Scene enhancement successful for level {request.party_level}")
            return JSONResponse({
                "success": True,
                "original_scene": request.scene_description,
                "enhanced_content": result["enhanced_content"],
                "sources": result["sources"],
                "party_level": request.party_level,
                "type": "scene_enhancement",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ Scene enhancement failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Scene enhancement failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Scene enhancement error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/character-build-advice")
async def get_character_build_advice(request: CharacterBuildRequest):
    """
    👤 Get character optimization and build advice
    """
    try:
        result = await linkup_service.get_character_build_advice(
            request.character_class,
            request.level,
            request.build_type
        )
        
        if result["success"]:
            logger.info(f"✅ Character build advice successful: {request.character_class} level {request.level}")
            return JSONResponse({
                "success": True,
                "character_class": request.character_class,
                "level": request.level,
                "build_type": request.build_type,
                "advice": result["build_advice"],
                "sources": result["sources"],
                "type": "character_build",
                "linkup_powered": True
            })
        else:
            logger.error(f"❌ Character build advice failed: {result.get('error')}")
            raise HTTPException(status_code=500, detail=f"Character build advice failed: {result.get('error')}")
            
    except Exception as e:
        logger.error(f"Character build advice error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Quick lookup endpoints with query parameters
@router.get("/quick-rules")
async def quick_rules_lookup(
    q: str = Query(..., description="Rules query"),
    context: str = Query("", description="Additional context")
):
    """
    🎲 Quick D&D rules lookup via GET request
    """
    request = RulesLookupRequest(query=q, context=context)
    return await lookup_dnd_rules(request)

@router.get("/quick-spell")
async def quick_spell_lookup(
    name: str = Query("", description="Spell name"),
    level: str = Query("", description="Spell level"),
    class_name: str = Query("", description="Character class")
):
    """
    ✨ Quick spell lookup via GET request
    """
    request = SpellSearchRequest(
        spell_name=name,
        spell_level=level,
        character_class=class_name
    )
    return await lookup_spells(request)

@router.get("/quick-monster")
async def quick_monster_search(
    cr: str = Query("", description="Challenge Rating"),
    environment: str = Query("", description="Environment type")
):
    """
    🐲 Quick monster search via GET request
    """
    request = MonsterSearchRequest(
        challenge_rating=cr,
        environment=environment
    )
    return await search_monsters(request) 