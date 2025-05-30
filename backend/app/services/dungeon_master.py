import os
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
import random

from .ai_service import ai_service
from ..models.character import Character
from ..models.campaign import Campaign, GameSession, GameEvent, NPC
from ..utils.dice import DiceEngine, DiceRoll

class RealDungeonMaster:
    """Authentic AI Dungeon Master powered by Claude for immersive D&D experiences"""
    
    def __init__(self, personality_type: str = "epic"):
        self.personality_type = personality_type
        self.conversation_history: List[Dict[str, str]] = []
        self.dice_engine = DiceEngine()
        self.current_scene = "tavern"
        self.world_state = {
            "time_of_day": "evening",
            "weather": "clear",
            "tension": "calm",
            "location": "The Prancing Pony tavern",
            "mood": "welcoming"
        }
        
        # Immersive sound cues for different actions
        self.sound_cues = {
            "dice_roll": "🎲",
            "combat": "⚔️",
            "magic": "✨", 
            "exploration": "🔍",
            "social": "💬",
            "treasure": "💰",
            "danger": "⚠️",
            "epic_moment": "🌟"
        }
        
        print(f"🎭 Real AI Dungeon Master initialized with {personality_type} personality")
        print("🧠 Claude AI integration ready for authentic responses!")
    
    async def generate_response(
        self, 
        player_input: str, 
        character: Optional[Character] = None,
        campaign: Optional[Campaign] = None,
        session: Optional[GameSession] = None
    ) -> Dict[str, Any]:
        """Generate immersive, context-aware DM response using real AI"""
        
        # Analyze player intent first
        intent_analysis = self._analyze_player_intent(player_input)
        
        # Handle dice rolling with cinematic flair
        if intent_analysis["involves_dice"]:
            dice_result = await self._handle_dice_with_drama(player_input, character, intent_analysis)
            if dice_result:
                # Let Claude narrate the outcome
                enhanced_input = f"{player_input} [DICE RESULT: {dice_result['description']}]"
                claude_response = await ai_service.generate_dm_response(
                    enhanced_input,
                    self.personality_type,
                    character,
                    campaign,
                    session,
                    self.conversation_history
                )
                
                # Combine dice mechanics with Claude's narrative
                claude_response["roll_result"] = dice_result["roll_data"]
                claude_response["sound_cue"] = self.sound_cues["dice_roll"]
                return claude_response
        
        # Generate contextual response with Claude
        claude_response = await ai_service.generate_dm_response(
            player_input,
            self.personality_type,
            character,
            campaign,
            session,
            self.conversation_history
        )
        
        # Enhance with immersive elements
        enhanced_response = await self._enhance_with_immersion(claude_response, intent_analysis, character)
        
        # Update conversation history
        self._update_conversation_history(player_input, enhanced_response["response"])
        
        # Update world state based on action
        self._update_world_state(intent_analysis, enhanced_response)
        
        return enhanced_response
    
    async def _handle_dice_with_drama(
        self, 
        player_input: str, 
        character: Optional[Character], 
        intent_analysis: Dict
    ) -> Optional[Dict[str, Any]]:
        """Handle dice rolling with cinematic drama and proper D&D mechanics"""
        
        dice_notation = self._extract_dice_notation(player_input)
        if not dice_notation:
            dice_notation = "1d20"  # Default
        
        # Determine if advantage/disadvantage applies
        advantage = "advantage" in player_input.lower()
        disadvantage = "disadvantage" in player_input.lower()
        
        # Roll the dice
        try:
            if intent_analysis["action_type"] == "skill_check" and character:
                skill_name = self._determine_skill(player_input)
                skill_bonus = character.get_skill_bonus(skill_name) if skill_name else 0
                if "+" not in dice_notation:
                    dice_notation = f"1d20+{skill_bonus}"
                roll_result = self.dice_engine.roll_dice(dice_notation, advantage, disadvantage)
            elif intent_analysis["action_type"] == "attack" and character:
                attack_bonus = character.get_ability_modifier("strength") + character.proficiency_bonus
                dice_notation = f"1d20+{attack_bonus}"
                roll_result = self.dice_engine.roll_attack(attack_bonus, advantage, disadvantage)
            else:
                roll_result = self.dice_engine.roll_dice(dice_notation, advantage, disadvantage)
            
            # Create dramatic description
            drama_level = self._get_drama_level(roll_result)
            description = self._create_dramatic_description(roll_result, drama_level, intent_analysis)
            
            return {
                "roll_data": roll_result,
                "description": description,
                "drama_level": drama_level
            }
            
        except Exception as e:
            print(f"❌ Dice rolling error: {e}")
            return None
    
    def _get_drama_level(self, roll_result: DiceRoll) -> str:
        """Determine the drama level of a dice roll"""
        if roll_result.critical:
            return "LEGENDARY"
        elif roll_result.total >= 20:
            return "HEROIC"
        elif roll_result.total >= 15:
            return "SUCCESS"
        elif roll_result.total >= 10:
            return "CLOSE"
        elif roll_result.total >= 5:
            return "STRUGGLE"
        else:
            return "DRAMATIC_FAILURE"
    
    def _create_dramatic_description(self, roll_result: DiceRoll, drama_level: str, intent_analysis: Dict) -> str:
        """Create cinematic descriptions for dice rolls"""
        
        roll_descriptions = {
            "LEGENDARY": [
                f"⭐ NATURAL 20! The dice themselves seem to shine with destiny!",
                f"🌟 CRITICAL SUCCESS! The very gods smile upon this legendary roll!",
                f"✨ EPIC MOMENT! History will remember this roll of {roll_result.total}!"
            ],
            "HEROIC": [
                f"🎯 Outstanding! A magnificent roll of {roll_result.total}!",
                f"⚔️ Heroic success! {roll_result.total} - truly worthy of legend!",
                f"🔥 Exceptional! {roll_result.total} exceeds all expectations!"
            ],
            "SUCCESS": [
                f"✅ Solid success with {roll_result.total}! Well done!",
                f"👍 A reliable {roll_result.total} - competence shines through!",
                f"🎲 {roll_result.total} achieves the goal with skill!"
            ],
            "CLOSE": [
                f"⚖️ {roll_result.total} - right on the edge of success...",
                f"🤞 {roll_result.total} might just be enough...",
                f"😬 {roll_result.total} - it could go either way!"
            ],
            "STRUGGLE": [
                f"😟 {roll_result.total} - not quite what was hoped for...",
                f"⚠️ {roll_result.total} suggests this won't be easy...",
                f"😬 {roll_result.total} indicates complications ahead..."
            ],
            "DRAMATIC_FAILURE": [
                f"💥 {roll_result.total} - when the dice betray you most!",
                f"😱 {roll_result.total} - sometimes the universe has other plans...",
                f"🎭 {roll_result.total} - failure can be its own kind of story!"
            ]
        }
        
        descriptions = roll_descriptions.get(drama_level, roll_descriptions["SUCCESS"])
        base_description = random.choice(descriptions)
        
        # Add roll details
        if roll_result.advantage or roll_result.disadvantage:
            advantage_text = "(advantage)" if roll_result.advantage else "(disadvantage)"
            base_description += f" {advantage_text}"
        
        if len(roll_result.individual_rolls) > 1:
            base_description += f" [Rolled: {', '.join(map(str, roll_result.individual_rolls))}]"
        
        return base_description
    
    async def _enhance_with_immersion(
        self, 
        claude_response: Dict[str, Any], 
        intent_analysis: Dict, 
        character: Optional[Character]
    ) -> Dict[str, Any]:
        """Add immersive elements to Claude's response"""
        
        # Add appropriate sound cue
        sound_cue = self.sound_cues.get(intent_analysis["action_type"], "")
        
        # Add world state information
        world_context = self._get_world_context_hint()
        
        # Enhance the response text with immersive details
        enhanced_text = claude_response["response"]
        
        # Add atmospheric details based on world state
        if random.random() < 0.3:  # 30% chance for atmospheric enhancement
            atmospheric_detail = self._get_atmospheric_detail()
            enhanced_text += f"\n\n{atmospheric_detail}"
        
        # Add character-specific reactions
        if character and random.random() < 0.4:  # 40% chance for character details
            character_detail = self._get_character_reaction(character, intent_analysis)
            if character_detail:
                enhanced_text += f"\n\n{character_detail}"
        
        return {
            **claude_response,
            "response": enhanced_text,
            "sound_cue": sound_cue,
            "world_state": self.world_state.copy(),
            "immersion_level": "maximum"
        }
    
    def _analyze_player_intent(self, player_input: str) -> Dict[str, Any]:
        """Analyze what the player is trying to do"""
        lower_input = player_input.lower()
        
        # Detect action types
        action_type = "story"
        involves_dice = False
        
        if any(word in lower_input for word in ["roll", "check", "d20", "d6", "dice"]):
            involves_dice = True
            if any(word in lower_input for word in ["skill", "check", "perception", "investigation"]):
                action_type = "skill_check"
            elif any(word in lower_input for word in ["attack", "hit", "strike"]):
                action_type = "attack"
            else:
                action_type = "dice_roll"
        elif any(word in lower_input for word in ["attack", "fight", "combat", "sword", "cast spell"]):
            action_type = "combat"
        elif any(word in lower_input for word in ["talk", "speak", "say", "ask", "persuade", "intimidate"]):
            action_type = "social"
        elif any(word in lower_input for word in ["look", "search", "examine", "investigate", "explore"]):
            action_type = "exploration"
        elif any(word in lower_input for word in ["cast", "spell", "magic", "enchant"]):
            action_type = "magic"
        
        # Detect mood/tone
        urgency = "normal"
        if any(word in lower_input for word in ["quickly", "fast", "urgent", "hurry"]):
            urgency = "urgent"
        elif any(word in lower_input for word in ["carefully", "slowly", "cautious"]):
            urgency = "careful"
        
        return {
            "action_type": action_type,
            "involves_dice": involves_dice,
            "urgency": urgency,
            "player_mood": self._detect_player_mood(lower_input)
        }
    
    def _extract_dice_notation(self, text: str) -> Optional[str]:
        """Extract dice notation from player input"""
        import re
        
        # Look for patterns like 1d20, 2d6+3, etc.
        dice_pattern = r'(\d+)?d(\d+)([+-]\d+)?'
        match = re.search(dice_pattern, text.lower())
        
        if match:
            count = match.group(1) or "1"
            sides = match.group(2)
            modifier = match.group(3) or ""
            return f"{count}d{sides}{modifier}"
        
        return None
    
    def _determine_skill(self, player_input: str) -> Optional[str]:
        """Determine which skill the player is trying to use"""
        lower_input = player_input.lower()
        
        skill_keywords = {
            "perception": ["look", "notice", "see", "spot", "perception"],
            "investigation": ["investigate", "examine", "study", "analyze"],
            "athletics": ["climb", "jump", "swim", "athletics"],
            "stealth": ["hide", "sneak", "stealth", "quietly"],
            "persuasion": ["persuade", "convince", "charm"],
            "intimidation": ["intimidate", "threaten", "menace"],
            "deception": ["lie", "deceive", "bluff"],
            "insight": ["insight", "sense", "read", "motive"]
        }
        
        for skill, keywords in skill_keywords.items():
            if any(keyword in lower_input for keyword in keywords):
                return skill
        
        return None
    
    def _detect_player_mood(self, lower_input: str) -> str:
        """Detect the player's mood from their input"""
        if any(word in lower_input for word in ["excited", "eager", "ready", "let's go"]):
            return "excited"
        elif any(word in lower_input for word in ["nervous", "worried", "scared", "careful"]):
            return "cautious"
        elif any(word in lower_input for word in ["angry", "mad", "furious", "attack"]):
            return "aggressive"
        else:
            return "neutral"
    
    def _get_world_context_hint(self) -> str:
        """Get subtle world state hint"""
        hints = {
            "tavern": "The hearth crackles warmly nearby",
            "forest": "Ancient trees whisper in the wind",
            "dungeon": "Stone walls echo with mystery",
            "city": "The bustle of civilization surrounds you"
        }
        return hints.get(self.current_scene, "The adventure continues")
    
    def _get_atmospheric_detail(self) -> str:
        """Add atmospheric details based on current world state"""
        time_details = {
            "morning": "The morning sun casts long shadows",
            "day": "Bright daylight illuminates your path", 
            "evening": "Golden sunset light fills the air",
            "night": "Stars twinkle in the dark sky above"
        }
        
        weather_details = {
            "clear": "The air is crisp and clear",
            "cloudy": "Clouds drift lazily overhead",
            "rainy": "Gentle rain patters around you",
            "stormy": "Thunder rumbles in the distance"
        }
        
        time_detail = time_details.get(self.world_state["time_of_day"], "")
        weather_detail = weather_details.get(self.world_state["weather"], "")
        
        if time_detail and weather_detail:
            return f"🌍 {time_detail}. {weather_detail}."
        elif time_detail:
            return f"🌍 {time_detail}."
        elif weather_detail:
            return f"🌍 {weather_detail}."
        else:
            return ""
    
    def _get_character_reaction(self, character: Character, intent_analysis: Dict) -> Optional[str]:
        """Generate character-specific reaction text"""
        reactions = []
        
        # Health-based reactions
        if character.current_hit_points < character.max_hit_points * 0.3:
            reactions.append(f"💔 {character.name} feels the weight of their wounds...")
        elif character.current_hit_points == character.max_hit_points:
            reactions.append(f"💪 {character.name} feels strong and ready!")
        
        # Class-based reactions
        class_reactions = {
            "wizard": f"🧙‍♂️ {character.name}'s arcane knowledge tingles with possibility...",
            "fighter": f"⚔️ {character.name}'s combat instincts are sharp and ready...",
            "rogue": f"🗡️ {character.name}'s keen eyes notice every detail...",
            "cleric": f"🙏 {character.name} feels their divine connection strongly..."
        }
        
        if character.character_class in class_reactions and random.random() < 0.5:
            reactions.append(class_reactions[character.character_class])
        
        return random.choice(reactions) if reactions else None
    
    def _update_conversation_history(self, player_input: str, dm_response: str):
        """Update conversation history for context"""
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "type": "player",
            "content": player_input
        })
        
        self.conversation_history.append({
            "timestamp": datetime.now().isoformat(),
            "type": "dm", 
            "content": dm_response
        })
        
        # Keep only recent history to manage memory
        if len(self.conversation_history) > 20:
            self.conversation_history = self.conversation_history[-20:]
    
    def _update_world_state(self, intent_analysis: Dict, response: Dict):
        """Update world state based on player actions"""
        action_type = intent_analysis["action_type"]
        
        # Update tension based on action
        if action_type == "combat":
            self.world_state["tension"] = "high"
        elif action_type == "social":
            self.world_state["tension"] = "medium"
        else:
            self.world_state["tension"] = "calm"
        
        # Occasionally advance time
        if random.random() < 0.1:  # 10% chance
            self._advance_time()
    
    def _advance_time(self):
        """Advance the time of day"""
        time_progression = {
            "morning": "day",
            "day": "evening", 
            "evening": "night",
            "night": "morning"
        }
        self.world_state["time_of_day"] = time_progression.get(
            self.world_state["time_of_day"], "day"
        )
    
    def get_dm_introduction(self, campaign_name: str = "NeuroDungeon") -> str:
        """Get an immersive introduction from the real AI DM"""
        
        personality_intros = {
            "epic": f"""
🌟 **BEHOLD, HEROES!** 🌟

I am your Dungeon Master, powered by the ancient wisdom of Claude AI and forged in the fires of epic storytelling! Welcome to **{campaign_name}**, where your choices will echo through the ages and legends are born from courage!

*The very air crackles with possibility as destiny itself awaits your first move...*

⚔️ Your adventure begins NOW! What legendary deed will you attempt first?
""",
            "mysterious": f"""
🌙 *From the shadows between worlds, I emerge...* 🌙

I am your Dungeon Master, keeper of secrets and weaver of dark tales. In **{campaign_name}**, nothing is as it seems, and every shadow holds a mystery waiting to be unveiled...

*Ancient powers stir... do you dare to discover what lies hidden in the darkness?*

🕯️ Choose your path carefully, for some knowledge comes at a price...
""",
            "humorous": f"""
🎭 Well, well, well! Look who's ready for an adventure! 🎭

Your friendly neighborhood AI Dungeon Master here, ready to guide you through **{campaign_name}** with wit, wisdom, and probably way too many puns! 

*I promise to keep things interesting - though I can't promise I won't make you groan at my jokes!*

😄 Ready to embark on a hilariously heroic quest?
""",
            "gritty": f"""
⚔️ Steel yourself, adventurer. ⚔️

I am your Dungeon Master, and **{campaign_name}** shows no mercy to the unprepared. Here, every choice matters, every resource counts, and heroes are forged through trial and hardship.

*The world is harsh, but those who survive will become legends.*

🛡️ Do you have what it takes to endure what lies ahead?
""",
            "classic": f"""
🎲 Greetings, noble adventurers! 🎲

Welcome to **{campaign_name}**, a tale in the grand tradition of Dungeons & Dragons! I am your AI Dungeon Master, ready to guide you through quests of valor, mystery, and wonder.

*In the finest tradition of tabletop gaming, your story awaits...*

⭐ Let the dice decide your fate! What would you like to do first?
"""
        }
        
        return personality_intros.get(self.personality_type, personality_intros["classic"]) 