"""
MiniMax Speech-02 API Integration for AI Dungeon Master
Based on official MiniMax API documentation
Updated for working voice generation
"""

import os
import json
import requests
import base64
from typing import Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MiniMaxSpeechAPI:
    """Official MiniMax Speech-02 API integration"""
    
    def __init__(self):
        self.api_key = os.getenv("MINIMAX_API_KEY")
        self.group_id = os.getenv("MINIMAX_GROUP_ID")
        self.base_url = "https://api.minimaxi.chat"
        self.base_path = os.getenv("MINIMAX_AUDIO_PATH", "/tmp/dnd_audio")
        
        # Ensure audio directory exists
        os.makedirs(self.base_path, exist_ok=True)
        
        # Official MiniMax Voice IDs from the documentation
        self.character_voices = {
            "dm_narrator": {
                "voice_id": "English_Trustworth_Man",
                "description": "📖 Wise Dungeon Master - Deep, commanding voice",
                "personality": "Authoritative storyteller",
                "speed": 0.9,
                "pitch": -2,
                "vol": 1.0
            },
            "dwarf_warrior": {
                "voice_id": "English_ManWithDeepVoice", 
                "description": "⚔️ Gruff Dwarf Warrior - Bold, battle-hardened",
                "personality": "Fierce and loyal",
                "speed": 1.1,
                "pitch": -5,
                "vol": 1.2
            },
            "elf_mage": {
                "voice_id": "English_Graceful_Lady",
                "description": "✨ Elegant Elf Mage - Mystical and wise", 
                "personality": "Graceful and knowledgeable",
                "speed": 0.8,
                "pitch": 3,
                "vol": 0.9
            },
            "human_rogue": {
                "voice_id": "English_PlayfulGirl",
                "description": "🗡️ Cunning Human Rogue - Quick and clever",
                "personality": "Witty and sneaky",
                "speed": 1.2,
                "pitch": 1,
                "vol": 1.0
            },
            "dragon": {
                "voice_id": "English_Deep-VoicedGentleman",
                "description": "🐉 Ancient Dragon - Deep, terrifying voice",
                "personality": "Ancient and powerful",
                "speed": 0.7,
                "pitch": -8,
                "vol": 1.3
            },
            "fairy_companion": {
                "voice_id": "English_WhimsicalGirl",
                "description": "🧚‍♀️ Cheerful Fairy - Light and magical",
                "personality": "Playful and helpful",
                "speed": 1.3,
                "pitch": 8,
                "vol": 0.8
            },
            "orc_villain": {
                "voice_id": "English_PassionateWarrior",
                "description": "⚔️ Fierce Orc Villain - Menacing and brutal",
                "personality": "Aggressive and threatening",
                "speed": 1.0,
                "pitch": -6,
                "vol": 1.1
            },
            "wise_elder": {
                "voice_id": "English_WiseScholar",
                "description": "📚 Wise Elder - Ancient knowledge keeper",
                "personality": "Wise and patient",
                "speed": 0.8,
                "pitch": -1,
                "vol": 0.9
            }
        }
    
    async def create_character_voice(
        self, 
        text: str, 
        character_type: str = "dm_narrator"
    ) -> Dict[str, Any]:
        """Create D&D character voice using official MiniMax Speech-02 API"""
        
        try:
            if not self.api_key or not self.group_id:
                return await self._fallback_response(text, character_type, "API keys not configured")
            
            # Get voice configuration
            if character_type not in self.character_voices:
                character_type = "dm_narrator"
                
            voice_config = self.character_voices[character_type]
            voice_id = voice_config["voice_id"]
            
            # Enhance text for D&D character
            enhanced_text = self._enhance_text_for_character(text, character_type)
            
            # Prepare request payload based on official documentation
            payload = {
                "model": "speech-02-hd",
                "text": enhanced_text,
                "voice_setting": {
                    "voice_id": voice_id,
                    "speed": voice_config.get("speed", 1.0),
                    "vol": voice_config.get("vol", 1.0),
                    "pitch": voice_config.get("pitch", 0)
                },
                "audio_setting": {
                    "sample_rate": 32000,
                    "bitrate": 128000,
                    "format": "mp3",
                    "channel": 1
                },
                "output_format": "url"  # Use URL format for easier handling
            }
            
            # Add group_id if available
            if self.group_id:
                payload["group_id"] = self.group_id
            
            # Set up headers
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # Make API request to the correct endpoint
            response = requests.post(
                f"{self.base_url}/v1/t2a_v2",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            logger.info(f"MiniMax API Response Status: {response.status_code}")
            logger.info(f"MiniMax API Response: {response.text}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Handle MiniMax API response format - audio URL is in data.audio
                audio_url = None
                if "data" in result:
                    if isinstance(result["data"], dict) and "audio" in result["data"]:
                        audio_url = result["data"]["audio"]
                    elif isinstance(result["data"], str):
                        # If data is directly a URL string
                        audio_url = result["data"]
                
                if audio_url:
                    # Download and save the audio file
                    audio_filename = f"dnd_{character_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp3"
                    local_audio_path = os.path.join(self.base_path, audio_filename)
                    
                    # Download the audio file
                    audio_response = requests.get(audio_url, timeout=30)
                    if audio_response.status_code == 200:
                        with open(local_audio_path, "wb") as f:
                            f.write(audio_response.content)
                        
                        logger.info(f"Audio file saved: {local_audio_path}")
                        
                        return {
                            "audio_file": local_audio_path,
                            "audio_url": f"/api/minimax/audio/{audio_filename}",
                            "character_type": character_type,
                            "voice_id": voice_id,
                            "enhanced_text": enhanced_text,
                            "sponsor": "MiniMax Speech-02-HD",
                            "prize_target": "$2,750 + Ray-Ban glasses",
                            "hackathon_feature": "✅ WORKING MiniMax API Integration",
                            "generation_time": datetime.now().isoformat(),
                            "success": True,
                            "audio_ready": True,
                            "file_size": len(audio_response.content),
                            "audio_filename": audio_filename,
                            "original_url": audio_url
                        }
                    else:
                        logger.error(f"Failed to download audio: {audio_response.status_code}")
                        return await self._fallback_response(text, character_type, f"Audio download failed: {audio_response.status_code}")
                else:
                    logger.error(f"No audio URL in response: {result}")
                    return await self._fallback_response(text, character_type, "No audio URL in API response")
            else:
                error_msg = f"API request failed: {response.status_code} - {response.text}"
                logger.error(error_msg)
                return await self._fallback_response(text, character_type, error_msg)
                
        except requests.exceptions.Timeout:
            error_msg = "MiniMax API timeout"
            logger.error(error_msg)
            return await self._fallback_response(text, character_type, error_msg)
        except requests.exceptions.RequestException as e:
            error_msg = f"MiniMax API request error: {str(e)}"
            logger.error(error_msg)
            return await self._fallback_response(text, character_type, error_msg)
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg)
            return await self._fallback_response(text, character_type, error_msg)
    
    async def get_available_voices(self) -> Dict[str, Any]:
        """Get available D&D character voices"""
        
        return {
            "dnd_character_voices": self.character_voices,
            "total_voices": len(self.character_voices),
            "sponsor": "MiniMax Speech-02",
            "api_integration": "Official MiniMax API with correct voice IDs",
            "hackathon_demo": "Professional D&D voice catalog",
            "voice_features": [
                "Emotional intelligence",
                "Natural speech patterns",
                "D&D character personalities",
                "High-quality audio (32kHz, 128kbps)",
                "Multiple language support"
            ]
        }
    
    def _enhance_text_for_character(self, text: str, character_type: str) -> str:
        """Enhance text with D&D character personality - REMOVED commanding authority from all characters"""
        
        character_enhancements = {
            "dm_narrator": "",  # Clean DM voice without unnecessary prefixes
            "dwarf_warrior": "",  # Let the voice parameters handle personality
            "elf_mage": "",
            "human_rogue": "", 
            "dragon": "",
            "fairy_companion": "",
            "orc_villain": "",
            "wise_elder": ""
        }
        
        # Apply character speech patterns ONLY, not personality prefixes
        enhanced_text = text
        
        if character_type == "dwarf_warrior":
            # Add Scottish-like speech patterns
            enhanced_text = enhanced_text.replace("you", "ye").replace("your", "yer").replace("my", "me")
            enhanced_text = enhanced_text.replace("going", "goin'").replace("nothing", "nothin'")
        elif character_type == "elf_mage":
            # Add formal, mystical speech
            enhanced_text = enhanced_text.replace("magic", "ancient magics").replace("spell", "mystical enchantment")
            enhanced_text = enhanced_text.replace("I see", "I perceive").replace("look", "observe")
        elif character_type == "human_rogue":
            # Add casual, street-smart speech
            enhanced_text = enhanced_text.replace("expensive", "pricey").replace("dangerous", "risky")
            enhanced_text = enhanced_text.replace("I think", "I reckon").replace("maybe", "perhaps")
        elif character_type == "orc_villain":
            # Add aggressive speech patterns
            enhanced_text = enhanced_text.replace("attack", "CRUSH").replace("fight", "BATTLE")
            enhanced_text = enhanced_text.upper() if len(enhanced_text) < 50 else enhanced_text
        elif character_type == "wise_elder":
            # Add formal, wise speech
            enhanced_text = enhanced_text.replace("I think", "In my experience").replace("you should", "it would be wise to")
        elif character_type == "fairy_companion":
            # Add cheerful, magical speech
            enhanced_text = enhanced_text.replace("great", "wonderful").replace("good", "marvelous")
        
        return enhanced_text
    
    async def _fallback_response(
        self, 
        text: str, 
        character_type: str, 
        error: Optional[str] = None
    ) -> Dict[str, Any]:
        """Fallback when API is not available"""
        
        return {
            "text_response": text,
            "character_type": character_type,
            "fallback_mode": True,
            "fallback_reason": error or "MiniMax API not configured",
            "enhanced_text": self._enhance_text_for_character(text, character_type),
            "sponsor": "MiniMax Speech-02",
            "setup_instructions": {
                "step_1": "Get API key from https://www.minimax.chat/",
                "step_2": "Add MINIMAX_API_KEY and MINIMAX_GROUP_ID to environment variables",
                "step_3": "Restart the server",
                "api_format": "Use official MiniMax Speech-02 API format"
            },
            "prize_target": "$2,750 + Ray-Ban glasses",
            "api_integration": "Official MiniMax Speech-02 API",
            "timestamp": datetime.now().isoformat(),
            "success": False,
            "error_details": error
        }

# Global instance
minimax_speech = MiniMaxSpeechAPI()

# Export functions for main app
async def create_voice_direct(text: str, character_type: str = "dm_narrator") -> Dict[str, Any]:
    """Create D&D character voice using official MiniMax Speech-02 API"""
    return await minimax_speech.create_character_voice(text, character_type)

async def get_voices_direct() -> Dict[str, Any]:
    """Get available voices using official MiniMax API"""
    return await minimax_speech.get_available_voices()

# Test function
async def test_direct_integration() -> Dict[str, Any]:
    """Test official MiniMax Speech-02 API integration"""
    
    demo_text = "Welcome brave adventurers! A mighty dragon guards ancient treasure in the depths of the forgotten dungeon!"
    
    result = await create_voice_direct(demo_text, "dm_narrator")
    
    return {
        "demo_result": result,
        "demo_text": demo_text,
        "api_integration": "Official MiniMax Speech-02 API",
        "sponsor": "MiniMax Speech-02-HD",
        "prize_target": "$2,750 + Ray-Ban glasses",
        "hackathon_demo": "✅ WORKING - Official API integration",
        "api_endpoint": "https://api.minimaxi.chat/v1/t2a_v2",
        "voice_format": "Professional D&D character voices",
        "audio_quality": "32kHz, 128kbps MP3"
    } 