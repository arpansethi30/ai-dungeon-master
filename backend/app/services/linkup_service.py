"""
🔗 Linkup.so Integration Service for D&D Enhancement
Brings real-time D&D content and rules to enhance gameplay experience
"""

import os
import asyncio
from typing import Dict, List, Optional, Any
import json
from datetime import datetime
from linkup import LinkupClient

class LinkupDnDService:
    """
    🌐 Linkup.so powered D&D content enhancement service
    """
    
    def __init__(self):
        # Use the API key from environment or hardcoded (for demo)
        self.api_key = os.getenv("LINKUP_API_KEY", "30cfefd6-decb-4278-acdf-20ed6b2a4ff7")
        self.client = LinkupClient(api_key=self.api_key)
        self.cache = {}  # Simple cache for frequently requested content
        
    def _parse_linkup_response(self, response) -> tuple[str, list]:
        """
        Helper method to parse Linkup client response consistently
        """
        answer = ""
        sources = []
        
        if hasattr(response, 'answer'):
            answer = response.answer
        elif hasattr(response, 'content'):
            answer = response.content
        elif isinstance(response, dict):
            answer = response.get("answer", "")
        else:
            answer = str(response)
        
        if hasattr(response, 'sources'):
            raw_sources = response.sources if response.sources else []
            # Convert source objects to dictionaries
            for source in raw_sources:
                if hasattr(source, '__dict__'):
                    # Convert object to dict
                    source_dict = {
                        'name': getattr(source, 'name', getattr(source, 'title', 'Unknown Source')),
                        'url': getattr(source, 'url', getattr(source, 'link', '#')),
                        'snippet': getattr(source, 'snippet', getattr(source, 'content', ''))[:200]
                    }
                    sources.append(source_dict)
                elif isinstance(source, dict):
                    sources.append(source)
                else:
                    # Fallback for unknown source format
                    sources.append({
                        'name': str(source),
                        'url': '#',
                        'snippet': str(source)[:200]
                    })
        elif isinstance(response, dict):
            sources = response.get("sources", [])
        
        return answer, sources

    async def search_dnd_rules(self, query: str, context: str = "") -> Dict[str, Any]:
        """
        🎲 Search for D&D rules and mechanics with context
        """
        try:
            # Enhance query with D&D context
            enhanced_query = f"Dungeons and Dragons 5e rules {query} {context}".strip()
            
            response = self.client.search(
                query=enhanced_query,
                depth="deep",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "query": query,
                "answer": answer,
                "sources": sources,
                "timestamp": datetime.now().isoformat(),
                "type": "rules_lookup"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "type": "rules_lookup"
            }
    
    async def search_monsters(self, challenge_rating: str = "", environment: str = "") -> Dict[str, Any]:
        """
        🐲 Find monsters suitable for current encounter
        """
        try:
            query = f"Dungeons and Dragons monsters CR {challenge_rating} {environment} stat block abilities".strip()
            
            response = self.client.search(
                query=query,
                depth="deep",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "answer": answer,
                "sources": sources,
                "challenge_rating": challenge_rating,
                "environment": environment,
                "timestamp": datetime.now().isoformat(),
                "type": "monster_lookup"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "monster_lookup"
            }
    
    async def search_spells(self, spell_name: str = "", spell_level: str = "", character_class: str = "") -> Dict[str, Any]:
        """
        ✨ Look up spells and magical abilities
        """
        try:
            query = f"D&D 5e spell {spell_name} level {spell_level} {character_class} description effects".strip()
            
            response = self.client.search(
                query=query,
                depth="deep",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "answer": answer,
                "sources": sources,
                "spell_name": spell_name,
                "spell_level": spell_level,
                "character_class": character_class,
                "timestamp": datetime.now().isoformat(),
                "type": "spell_lookup"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "spell_lookup"
            }
    
    async def search_items_and_equipment(self, item_type: str = "", rarity: str = "") -> Dict[str, Any]:
        """
        ⚔️ Find magical items and equipment
        """
        try:
            query = f"D&D 5e magic items {item_type} {rarity} description properties stats".strip()
            
            response = self.client.search(
                query=query,
                depth="deep",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "answer": answer,
                "sources": sources,
                "item_type": item_type,
                "rarity": rarity,
                "timestamp": datetime.now().isoformat(),
                "type": "item_lookup"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "item_lookup"
            }
    
    async def search_campaign_inspiration(self, theme: str = "", setting: str = "") -> Dict[str, Any]:
        """
        🗺️ Get campaign ideas and plot hooks
        """
        try:
            query = f"D&D campaign ideas {theme} {setting} adventure hooks story plots".strip()
            
            response = self.client.search(
                query=query,
                depth="deep",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "answer": answer,
                "sources": sources,
                "theme": theme,
                "setting": setting,
                "timestamp": datetime.now().isoformat(),
                "type": "campaign_inspiration"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "campaign_inspiration"
            }
    
    async def search_dnd_news(self) -> Dict[str, Any]:
        """
        📰 Get latest D&D news and updates
        """
        try:
            query = "Dungeons and Dragons news updates 2024 Wizards of the Coast new releases"
            
            response = self.client.search(
                query=query,
                depth="standard",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "answer": answer,
                "sources": sources,
                "timestamp": datetime.now().isoformat(),
                "type": "dnd_news"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "type": "dnd_news"
            }
    
    async def enhance_scene_with_content(self, scene_description: str, party_level: int = 1) -> Dict[str, Any]:
        """
        🌟 Enhance current scene with relevant D&D content
        """
        try:
            # Extract key elements from scene
            query = f"D&D encounter ideas level {party_level} {scene_description} monsters NPCs treasure"
            
            response = self.client.search(
                query=query,
                depth="deep",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "original_scene": scene_description,
                "enhanced_content": answer,
                "sources": sources,
                "party_level": party_level,
                "timestamp": datetime.now().isoformat(),
                "type": "scene_enhancement"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "original_scene": scene_description,
                "type": "scene_enhancement"
            }
    
    async def get_character_build_advice(self, character_class: str, level: int = 1, build_type: str = "") -> Dict[str, Any]:
        """
        👤 Get character optimization and build advice
        """
        try:
            query = f"D&D 5e {character_class} build level {level} {build_type} optimization guide feats spells"
            
            response = self.client.search(
                query=query,
                depth="deep",
                output_type="sourcedAnswer"
            )
            
            answer, sources = self._parse_linkup_response(response)
            
            return {
                "success": True,
                "character_class": character_class,
                "level": level,
                "build_advice": answer,
                "sources": sources,
                "timestamp": datetime.now().isoformat(),
                "type": "character_build"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "character_class": character_class,
                "type": "character_build"
            }
    
    def get_cached_result(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached result if available and not expired"""
        if cache_key in self.cache:
            result = self.cache[cache_key]
            # Cache for 1 hour
            if (datetime.now() - datetime.fromisoformat(result["timestamp"])).seconds < 3600:
                return result
        return None
    
    def cache_result(self, cache_key: str, result: Dict[str, Any]):
        """Cache result for future use"""
        self.cache[cache_key] = result

# Global instance
linkup_service = LinkupDnDService() 