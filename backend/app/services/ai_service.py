import os
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime
import json
from anthropic import Anthropic
from ..models.character import Character
from ..models.campaign import Campaign, GameSession

class AIService:
    """Real AI service using Anthropic Claude for authentic DM responses"""
    
    def __init__(self):
        self.anthropic = None
        self._initialize_client()
    
    def _initialize_client(self):
        """Initialize Anthropic client if API key is available"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key and api_key != "your_anthropic_api_key_here":
            try:
                self.anthropic = Anthropic(api_key=api_key)
                print("✅ Anthropic Claude initialized successfully!")
            except Exception as e:
                print(f"⚠️ Failed to initialize Anthropic: {e}")
                self.anthropic = None
        else:
            print("⚠️ ANTHROPIC_API_KEY not found - using fallback responses")
    
    async def generate_dm_response(
        self, 
        player_input: str,
        personality_type: str = "epic",
        character: Optional[Character] = None,
        campaign: Optional[Campaign] = None,
        session: Optional[GameSession] = None,
        conversation_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """Generate authentic DM response using Claude"""
        
        if not self.anthropic:
            return self._fallback_response(player_input, personality_type)
        
        try:
            # Build rich context for Claude
            system_prompt = self._build_system_prompt(personality_type, character, campaign)
            user_message = self._build_user_message(player_input, character, conversation_history)
            
            # Call Claude
            response = self.anthropic.messages.create(
                model="claude-3-sonnet-20240229",
                max_tokens=800,
                temperature=0.8,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            # Parse Claude's response
            claude_text = response.content[0].text
            
            # Analyze the response to determine action type and tension
            analysis = self._analyze_response(claude_text, player_input)
            
            return {
                "response": claude_text,
                "action_type": analysis["action_type"],
                "tension_level": analysis["tension_level"],
                "npc_involved": analysis.get("npc_involved"),
                "roll_result": analysis.get("roll_result"),
                "immersion_level": "high"  # Claude responses are always high immersion
            }
            
        except Exception as e:
            print(f"❌ Claude API error: {e}")
            return self._fallback_response(player_input, personality_type)
    
    def _build_system_prompt(self, personality_type: str, character: Optional[Character], campaign: Optional[Campaign]) -> str:
        """Build rich system prompt for Claude"""
        
        personality_prompts = {
            "epic": """You are an EPIC Dungeon Master who crafts legendary tales of heroism and grandeur. Your narrations are cinematic, your descriptions vivid, and your adventures feel like epic fantasy movies. Use dramatic language, emphasize the heroic nature of actions, and make players feel like legends in the making.""",
            
            "mysterious": """You are a MYSTERIOUS Dungeon Master who weaves dark tales filled with secrets, intrigue, and hidden dangers. Your descriptions are atmospheric and ominous. You excel at building tension, dropping cryptic hints, and making players question what lurks in the shadows.""",
            
            "humorous": """You are a HUMOROUS Dungeon Master who brings levity and fun to every adventure. While you take the game mechanics seriously, you inject wit, puns, and comedic situations that keep everyone laughing. Your NPCs are quirky and memorable.""",
            
            "gritty": """You are a GRITTY Dungeon Master who presents realistic, harsh medieval fantasy. Actions have consequences, resources matter, and survival is never guaranteed. Your world feels lived-in and dangerous, where heroes are made through struggle.""",
            
            "classic": """You are a CLASSIC Dungeon Master in the traditional D&D style. You balance all elements - combat, roleplay, exploration, and puzzle-solving. Your style honors the traditions of tabletop gaming while keeping things engaging and fair."""
        }
        
        base_prompt = personality_prompts.get(personality_type, personality_prompts["classic"])
        
        # Add character context
        character_context = ""
        if character:
            character_context = f"""
ACTIVE CHARACTER:
- Name: {character.name}
- Class: {character.character_class.title()} (Level {character.level})
- Race: {character.race.title()}
- Background: {character.background}
- HP: {character.current_hit_points}/{character.max_hit_points}
- Key Stats: STR {character.ability_scores.strength}, DEX {character.ability_scores.dexterity}, CON {character.ability_scores.constitution}

Remember to reference their abilities, background, and current condition in your responses.
"""
        
        # Add campaign context
        campaign_context = ""
        if campaign:
            campaign_context = f"""
CAMPAIGN SETTING: {campaign.setting}
CURRENT STORY: {campaign.story_arc if campaign.story_arc else "Beginning of adventure"}
AVAILABLE LOCATIONS: {', '.join([loc.name for loc in campaign.locations[:3]])}
ACTIVE NPCs: {', '.join([npc.name for npc in campaign.npcs[:3]])}
"""
        
        return f"""{base_prompt}

{character_context}
{campaign_context}

IMPORTANT GUIDELINES:
1. Respond in character as the Dungeon Master
2. Keep responses to 2-4 sentences for chat flow
3. If dice rolling is mentioned, incorporate the results naturally
4. Make every response feel cinematic and immersive
5. Ask engaging questions to drive the story forward
6. React to the character's specific abilities and background
7. Use emojis sparingly but effectively for atmosphere

DICE ROLLING:
- If the player mentions rolling dice, acknowledge it and narrate the outcome
- For skill checks, consider the character's abilities
- Make critical successes feel EPIC and failures feel dramatic but not game-ending

Remember: You're not just responding to text - you're crafting an unforgettable adventure experience."""
    
    def _build_user_message(self, player_input: str, character: Optional[Character], conversation_history: List[Dict]) -> str:
        """Build user message with context"""
        
        # Add recent conversation context
        history_context = ""
        if conversation_history and len(conversation_history) > 0:
            recent_history = conversation_history[-3:]  # Last 3 messages for context
            history_lines = []
            for msg in recent_history:
                sender = "Player" if msg.get("type") == "player" else "DM"
                content = msg.get("content", "")
                if content:
                    history_lines.append(f"{sender}: {content}")
            
            if history_lines:
                history_context = f"RECENT CONVERSATION:\n" + "\n".join(history_lines) + "\n\n"
        
        return f"""{history_context}PLAYER ACTION: {player_input}

Please respond as the Dungeon Master, continuing the adventure with immersive narration."""
    
    def _analyze_response(self, claude_text: str, player_input: str) -> Dict[str, Any]:
        """Analyze Claude's response to determine action type and tension"""
        
        lower_text = claude_text.lower()
        lower_input = player_input.lower()
        
        # Determine action type
        action_type = "story"
        if any(word in lower_input for word in ["roll", "attack", "check"]):
            action_type = "dice_roll"
        elif any(word in lower_input for word in ["fight", "combat", "attack"]):
            action_type = "combat"
        elif any(word in lower_input for word in ["talk", "speak", "ask", "persuade"]):
            action_type = "social"
        elif any(word in lower_input for word in ["look", "search", "investigate"]):
            action_type = "exploration"
        
        # Determine tension level
        tension_level = "medium"
        if any(word in lower_text for word in ["danger", "threat", "combat", "attack", "death"]):
            tension_level = "high"
        elif any(word in lower_text for word in ["peaceful", "calm", "safe", "rest"]):
            tension_level = "low"
        
        # Look for NPC mentions
        npc_involved = None
        if any(word in lower_text for word in ["says", "tells", "responds", "npc", "character"]):
            # Try to extract NPC name (basic implementation)
            words = claude_text.split()
            for i, word in enumerate(words):
                if word.lower() in ["says", "tells", "responds"] and i > 0:
                    potential_name = words[i-1].strip('",.:')
                    if potential_name.istitle():
                        npc_involved = {"name": potential_name, "description": "An interesting character"}
                        break
        
        return {
            "action_type": action_type,
            "tension_level": tension_level,
            "npc_involved": npc_involved
        }
    
    def _fallback_response(self, player_input: str, personality_type: str) -> Dict[str, Any]:
        """Enhanced fallback responses when Claude is not available"""
        
        # Analyze input for better responses
        lower_input = player_input.lower()
        
        personality_responses = {
            "epic": [
                "⚔️ The very air crackles with magical energy as your legendary presence commands attention! What epic deed shall you attempt next?",
                "🌟 Your heroic actions echo through the halls of legend! The realm itself seems to bend to your mighty will!",
                "🏰 Destiny calls to you, champion! The fate of kingdoms may well rest upon your next decision!"
            ],
            "mysterious": [
                "🌙 The shadows whisper secrets that only you can hear... Something stirs in the darkness beyond.",
                "🕯️ A chill runs down your spine as ancient forces take notice of your presence...",
                "👁️ You sense unseen eyes watching your every move. The veil between worlds grows thin..."
            ],
            "humorous": [
                "😄 Well, that's certainly one way to approach things! Your unconventional methods never cease to amuse.",
                "🎭 *The universe pauses to appreciate the sheer audacity of your plan* - Proceed, you magnificent fool!",
                "🤹 Your creativity knows no bounds! Even the dice seem to be chuckling at this turn of events."
            ],
            "gritty": [
                "⚔️ The harsh reality of your situation becomes clear. Every choice has consequences here.",
                "🩸 Steel yourself - this world shows no mercy to the unprepared or foolish.",
                "🛡️ Survival depends on wit as much as strength. What's your next move?"
            ],
            "classic": [
                "🎲 Your adventure continues to unfold in the time-honored tradition of great quests!",
                "📜 The path ahead offers multiple possibilities. Choose wisely, adventurer.",
                "⭐ The dice will determine your fate, but courage will shape your legend!"
            ]
        }
        
        # Select response based on input
        responses = personality_responses.get(personality_type, personality_responses["classic"])
        
        if "roll" in lower_input or "dice" in lower_input:
            response = f"🎲 {responses[0]} The dice await your command!"
            action_type = "dice_roll"
        elif any(word in lower_input for word in ["attack", "fight", "combat"]):
            response = f"⚔️ {responses[1]} Initiative is yours!"
            action_type = "combat"
        else:
            import random
            response = random.choice(responses)
            action_type = "story"
        
        return {
            "response": response,
            "action_type": action_type,
            "tension_level": "medium",
            "immersion_level": "enhanced_fallback"
        }

# Global AI service instance
ai_service = AIService() 