"""
AI Player Characters for Multiplayer D&D Sessions
Each AI player has unique personality, voice, and gameplay mechanics
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum
import random

class AIPlayerClass(Enum):
    WARRIOR = "warrior"
    MAGE = "mage"
    ROGUE = "rogue"
    CLERIC = "cleric"

class AIPersonality(Enum):
    BRAVE = "brave"
    CAUTIOUS = "cautious"
    WITTY = "witty"
    WISE = "wise"
    AGGRESSIVE = "aggressive"
    PROTECTIVE = "protective"

@dataclass
class AIPlayer:
    """AI Player Character with full D&D capabilities"""
    
    # Basic Info
    name: str
    player_class: AIPlayerClass
    personality: AIPersonality
    voice_id: str
    
    # D&D Stats
    level: int = 1
    hp: int = 100
    max_hp: int = 100
    ac: int = 15
    
    # Voice & Personality
    voice_description: str = ""
    personality_traits: List[str] = None
    combat_style: str = ""
    roleplay_style: str = ""
    
    # Equipment
    weapons: List[str] = None
    armor: str = ""
    items: List[str] = None
    
    def __post_init__(self):
        if self.personality_traits is None:
            self.personality_traits = []
        if self.weapons is None:
            self.weapons = []
        if self.items is None:
            self.items = []

class AIPlayerManager:
    """Manages AI players in multiplayer D&D sessions"""
    
    def __init__(self):
        self.ai_players = self._create_default_party()
        self.current_speaker = None
        
    def _create_default_party(self) -> Dict[str, AIPlayer]:
        """Create the default AI party members"""
        
        return {
            "thorgar": AIPlayer(
                name="Thorgar Ironbeard",
                player_class=AIPlayerClass.WARRIOR,
                personality=AIPersonality.BRAVE,
                voice_id="dwarf_warrior",
                level=3,
                hp=120,
                max_hp=120,
                ac=18,
                voice_description="⚔️ Gruff Dwarf Warrior - Bold and battle-hardened",
                personality_traits=[
                    "Never backs down from a fight",
                    "Extremely loyal to party members", 
                    "Loves ale and telling war stories",
                    "Speaks in a gruff, direct manner"
                ],
                combat_style="Aggressive front-line fighter, prefers melee combat",
                roleplay_style="Speaks with dwarven accent, protective of party",
                weapons=["Enchanted War Hammer", "Shield of Protection"],
                armor="Plate Mail Armor",
                items=["Healing Potions x3", "Rope", "Dwarven Ale"]
            ),
            
            "elara": AIPlayer(
                name="Elara Moonwhisper",
                player_class=AIPlayerClass.MAGE,
                personality=AIPersonality.WISE,
                voice_id="elf_mage",
                level=3,
                hp=80,
                max_hp=80,
                ac=12,
                voice_description="✨ Elegant Elf Mage - Mystical and wise",
                personality_traits=[
                    "Thoughtful and strategic in approach",
                    "Fascinated by ancient magic and lore",
                    "Often provides sage advice to the party",
                    "Speaks eloquently with wisdom"
                ],
                combat_style="Ranged spellcaster, prefers tactical magic",
                roleplay_style="Speaks with elvish grace, offers magical insights",
                weapons=["Staff of Arcane Power", "Crystal Orb"],
                armor="Robes of Protection",
                items=["Spellbook", "Magical Components", "Scrolls x5"]
            ),
            
            "zara": AIPlayer(
                name="Zara Swiftblade",
                player_class=AIPlayerClass.ROGUE,
                personality=AIPersonality.WITTY,
                voice_id="human_rogue", 
                level=3,
                hp=90,
                max_hp=90,
                ac=16,
                voice_description="🗡️ Cunning Human Rogue - Quick and clever",
                personality_traits=[
                    "Quick-witted with a sharp tongue",
                    "Expert at finding creative solutions",
                    "Loves treasure and shiny objects", 
                    "Makes jokes even in dangerous situations"
                ],
                combat_style="Stealth and precision strikes, avoids direct combat",
                roleplay_style="Sarcastic humor, always looking for profit",
                weapons=["Twin Daggers", "Shortbow"],
                armor="Leather Armor",
                items=["Thieves' Tools", "Caltrops", "Smoke Bombs x3"]
            ),
            
            "brother_marcus": AIPlayer(
                name="Brother Marcus",
                player_class=AIPlayerClass.CLERIC,
                personality=AIPersonality.PROTECTIVE,
                voice_id="wise_elder",
                level=3,
                hp=100,
                max_hp=100,
                ac=16,
                voice_description="📚 Wise Elder - Ancient knowledge keeper",
                personality_traits=[
                    "Deeply religious and moral",
                    "Always helps party members in need",
                    "Provides spiritual guidance and healing",
                    "Speaks with calm wisdom and compassion"
                ],
                combat_style="Support and healing, defensive combat when needed",
                roleplay_style="Offers blessings and moral guidance",
                weapons=["Holy Mace", "Shield of Faith"],
                armor="Chain Mail", 
                items=["Holy Symbol", "Healing Herbs", "Prayer Beads"]
            )
        }
    
    def get_party_members(self) -> List[AIPlayer]:
        """Get all AI party members"""
        return list(self.ai_players.values())
    
    def get_player_by_name(self, name: str) -> Optional[AIPlayer]:
        """Get AI player by name"""
        for player in self.ai_players.values():
            if player.name.lower() == name.lower():
                return player
        return None
    
    def generate_ai_response(
        self, 
        player_name: str, 
        situation: str, 
        context: str = ""
    ) -> Dict[str, Any]:
        """Generate AI player response to situation"""
        
        player = self.get_player_by_name(player_name)
        if not player:
            return {"error": "Player not found"}
        
        # Generate personality-based response
        response = self._create_character_response(player, situation, context)
        
        return {
            "player_name": player.name,
            "player_class": player.player_class.value,
            "personality": player.personality.value,
            "voice_id": player.voice_id,
            "response": response,
            "action_type": self._determine_action_type(player, situation),
            "voice_ready": True,
            "character_stats": {
                "hp": player.hp,
                "max_hp": player.max_hp,
                "ac": player.ac,
                "level": player.level
            }
        }
    
    def _create_character_response(
        self, 
        player: AIPlayer, 
        situation: str, 
        context: str
    ) -> str:
        """Create character-specific response based on personality"""
        
        personality_responses = {
            AIPersonality.BRAVE: {
                "combat": [
                    "Let's charge in and show them what we're made of!",
                    "I'll lead the charge! Follow me, companions!",
                    "No enemy can stand against our united strength!"
                ],
                "exploration": [
                    "I say we press forward! Adventure awaits!",
                    "Whatever lies ahead, we'll face it together!",
                    "Bold action is the path to glory!"
                ],
                "social": [
                    "Let me speak for the party - we mean business!",
                    "We stand united in our cause!",
                    "Honor and courage guide our path!"
                ]
            },
            
            AIPersonality.WISE: {
                "combat": [
                    "Let us think strategically about this encounter.",
                    "Knowledge of our foe will serve us better than rash action.",
                    "Ancient wisdom teaches patience in battle."
                ],
                "exploration": [
                    "These ancient markings suggest we should proceed carefully.",
                    "The arcane energies here are... unusual. We must be cautious.",
                    "My studies have prepared me for such mysteries."
                ],
                "social": [
                    "Perhaps diplomacy would serve us better than force.",
                    "Let us hear all perspectives before deciding.",
                    "Wisdom often lies in understanding others."
                ]
            },
            
            AIPersonality.WITTY: {
                "combat": [
                    "Well, this looks like fun! Anyone else excited about potential death?",
                    "I vote we try the 'not dying' strategy. Anyone else on board?",
                    "Great, another chance to test my running speed!"
                ],
                "exploration": [
                    "Nothing says 'adventure' like a suspiciously convenient entrance!",
                    "I love when ancient places look this welcoming and safe.",
                    "What could possibly go wrong? Famous last words, party!"
                ],
                "social": [
                    "I'm sure this conversation will go perfectly smoothly.",
                    "Let me handle this with my legendary charm and tact.",
                    "Time to deploy my secret weapon: sarcasm!"
                ]
            },
            
            AIPersonality.PROTECTIVE: {
                "combat": [
                    "Stay close, my friends. I'll keep you safe.",
                    "May the divine light protect us in this battle.",
                    "I call upon sacred power to shield our party!"
                ],
                "exploration": [
                    "Let me check for dangers before we proceed.",
                    "The gods watch over righteous travelers.",
                    "I sense we are not alone here. Stay vigilant."
                ],
                "social": [
                    "Let us approach with open hearts and peaceful intent.",
                    "All souls deserve compassion and understanding.",
                    "May we find common ground in this exchange."
                ]
            }
        }
        
        # Determine situation type
        situation_type = "exploration"  # default
        if any(word in situation.lower() for word in ["fight", "combat", "attack", "enemy", "battle"]):
            situation_type = "combat"
        elif any(word in situation.lower() for word in ["talk", "speak", "negotiate", "conversation", "meet"]):
            situation_type = "social"
        
        # Get appropriate responses for personality and situation
        responses = personality_responses.get(player.personality, {}).get(situation_type, [
            f"{player.name} considers the situation carefully."
        ])
        
        base_response = random.choice(responses)
        
        # Add character-specific flair
        if player.player_class == AIPlayerClass.WARRIOR:
            if "ye" not in base_response and random.choice([True, False]):
                base_response = base_response.replace("you", "ye").replace("your", "yer")
        
        return base_response
    
    def _determine_action_type(self, player: AIPlayer, situation: str) -> str:
        """Determine what type of action the AI player wants to take"""
        
        if any(word in situation.lower() for word in ["fight", "combat", "attack", "enemy"]):
            if player.player_class == AIPlayerClass.WARRIOR:
                return "melee_attack"
            elif player.player_class == AIPlayerClass.MAGE:
                return "cast_spell"
            elif player.player_class == AIPlayerClass.ROGUE:
                return "sneak_attack"
            elif player.player_class == AIPlayerClass.CLERIC:
                return "support_party"
        
        elif any(word in situation.lower() for word in ["heal", "hurt", "injured", "damage"]):
            if player.player_class == AIPlayerClass.CLERIC:
                return "heal_party"
        
        elif any(word in situation.lower() for word in ["investigate", "search", "explore"]):
            if player.player_class == AIPlayerClass.ROGUE:
                return "search_area"
        
        return "roleplay"

# Global AI player manager instance
ai_player_manager = AIPlayerManager()

# Export for main application
def get_ai_players() -> List[AIPlayer]:
    """Get all AI party members"""
    return ai_player_manager.get_party_members()

def generate_ai_player_response(
    player_name: str, 
    situation: str, 
    context: str = ""
) -> Dict[str, Any]:
    """Generate AI player response with voice"""
    return ai_player_manager.generate_ai_response(player_name, situation, context) 