"""
Multiplayer D&D Session Management
Handles turn-based gameplay, AI players, voice integration
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from enum import Enum
from datetime import datetime
import uuid
import random

from .ai_players import AIPlayer, get_ai_players, generate_ai_player_response

class SessionState(Enum):
    WAITING = "waiting"
    ACTIVE = "active"
    COMBAT = "combat"
    EXPLORATION = "exploration"
    SOCIAL = "social"
    PAUSED = "paused"
    COMPLETED = "completed"

class TurnType(Enum):
    HUMAN = "human"
    AI = "ai"
    DM = "dm"

@dataclass 
class GameTurn:
    """Individual turn in the game"""
    turn_id: str
    player_name: str
    player_type: TurnType
    action: str
    dialogue: str
    voice_id: Optional[str] = None
    audio_file: Optional[str] = None
    dice_rolls: List[Dict] = field(default_factory=list)
    timestamp: datetime = field(default_factory=datetime.now)

@dataclass
class MultiplayerSession:
    """D&D Multiplayer Session with AI players"""
    
    # Session Info
    session_id: str
    human_player_name: str
    session_state: SessionState = SessionState.WAITING
    
    # Campaign Info
    campaign_title: str = "The Enchanted Caverns"
    current_scene: str = "The party stands before a mysterious cave entrance..."
    
    # Players
    ai_players: List[AIPlayer] = field(default_factory=list)
    turn_order: List[str] = field(default_factory=list)
    current_turn_index: int = 0
    
    # Game State
    party_level: int = 3
    party_gold: int = 150
    current_location: str = "Forest Clearing"
    
    # History
    game_turns: List[GameTurn] = field(default_factory=list)
    voice_mode: bool = True
    
    # Session Stats
    created_at: datetime = field(default_factory=datetime.now)
    total_turns: int = 0
    
    def __post_init__(self):
        if not self.ai_players:
            self.ai_players = get_ai_players()
        if not self.turn_order:
            self._initialize_turn_order()

    def _initialize_turn_order(self):
        """Initialize turn order with human player + AI players"""
        self.turn_order = [self.human_player_name]
        for ai_player in self.ai_players:
            self.turn_order.append(ai_player.name)
        random.shuffle(self.turn_order[1:])  # Shuffle AI players, keep human first

class MultiplayerSessionManager:
    """Manages active multiplayer D&D sessions"""
    
    def __init__(self):
        self.active_sessions: Dict[str, MultiplayerSession] = {}
        self.session_scenarios = self._load_campaign_scenarios()
    
    def create_session(
        self, 
        human_player_name: str,
        voice_mode: bool = True
    ) -> Dict[str, Any]:
        """Create new multiplayer D&D session"""
        
        session_id = str(uuid.uuid4())[:8]
        
        # Create session with AI party
        session = MultiplayerSession(
            session_id=session_id,
            human_player_name=human_player_name,
            voice_mode=voice_mode,
            session_state=SessionState.ACTIVE
        )
        
        # Store session
        self.active_sessions[session_id] = session
        
        # Generate opening scene
        opening_scene = self._generate_opening_scene(session)
        
        return {
            "session_id": session_id,
            "status": "created",
            "party_members": self._format_party_info(session),
            "opening_scene": opening_scene,
            "turn_order": session.turn_order,
            "current_turn": session.turn_order[session.current_turn_index],
            "voice_mode": voice_mode,
            "hackathon_feature": "🎮 MULTIPLAYER D&D with AI Companions"
        }
    
    def get_session(self, session_id: str) -> Optional[MultiplayerSession]:
        """Get session by ID"""
        return self.active_sessions.get(session_id)
    
    def process_player_action(
        self,
        session_id: str,
        player_name: str,
        action: str,
        dialogue: str = ""
    ) -> Dict[str, Any]:
        """Process player action and generate AI responses"""
        
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        # Record human player turn
        human_turn = GameTurn(
            turn_id=str(uuid.uuid4())[:8],
            player_name=player_name,
            player_type=TurnType.HUMAN,
            action=action,
            dialogue=dialogue
        )
        session.game_turns.append(human_turn)
        
        # Generate AI responses
        ai_responses = []
        situation = f"{action}. {dialogue}" if dialogue else action
        
        for ai_player in session.ai_players:
            ai_response = generate_ai_player_response(
                ai_player.name,
                situation,
                context=session.current_scene
            )
            
            # Create AI turn
            ai_turn = GameTurn(
                turn_id=str(uuid.uuid4())[:8],
                player_name=ai_player.name,
                player_type=TurnType.AI,
                action=ai_response.get("action_type", "roleplay"),
                dialogue=ai_response.get("response", ""),
                voice_id=ai_response.get("voice_id")
            )
            session.game_turns.append(ai_turn)
            ai_responses.append(ai_response)
        
        # Generate DM response
        dm_response = self._generate_dm_response(session, action, dialogue)
        
        # Advance turn
        session.current_turn_index = (session.current_turn_index + 1) % len(session.turn_order)
        session.total_turns += 1
        
        return {
            "session_id": session_id,
            "human_action": {
                "player": player_name,
                "action": action,
                "dialogue": dialogue
            },
            "ai_responses": ai_responses,
            "dm_response": dm_response,
            "current_turn": session.turn_order[session.current_turn_index],
            "turn_number": session.total_turns,
            "party_stats": self._get_party_stats(session),
            "voice_mode": session.voice_mode
        }
    
    def generate_ai_turn(
        self,
        session_id: str,
        ai_player_name: str
    ) -> Dict[str, Any]:
        """Generate autonomous AI player turn"""
        
        session = self.get_session(session_id)
        if not session:
            return {"error": "Session not found"}
        
        # Generate AI action based on current situation
        situation = self._analyze_current_situation(session)
        
        ai_response = generate_ai_player_response(
            ai_player_name,
            situation,
            context=session.current_scene
        )
        
        # Record AI turn
        ai_turn = GameTurn(
            turn_id=str(uuid.uuid4())[:8],
            player_name=ai_player_name,
            player_type=TurnType.AI,
            action=ai_response.get("action_type", "roleplay"),
            dialogue=ai_response.get("response", ""),
            voice_id=ai_response.get("voice_id")
        )
        session.game_turns.append(ai_turn)
        
        # Advance turn
        session.current_turn_index = (session.current_turn_index + 1) % len(session.turn_order)
        session.total_turns += 1
        
        return {
            "session_id": session_id,
            "ai_action": ai_response,
            "turn_complete": True,
            "next_turn": session.turn_order[session.current_turn_index],
            "turn_number": session.total_turns
        }
    
    def _format_party_info(self, session: MultiplayerSession) -> List[Dict]:
        """Format party member information"""
        party_info = []
        
        # Human player
        party_info.append({
            "name": session.human_player_name,
            "type": "human",
            "class": "adventurer",
            "status": "ready"
        })
        
        # AI players
        for ai_player in session.ai_players:
            party_info.append({
                "name": ai_player.name,
                "type": "ai",
                "class": ai_player.player_class.value,
                "personality": ai_player.personality.value,
                "voice_id": ai_player.voice_id,
                "voice_description": ai_player.voice_description,
                "hp": ai_player.hp,
                "max_hp": ai_player.max_hp,
                "level": ai_player.level,
                "weapons": ai_player.weapons,
                "personality_traits": ai_player.personality_traits[:2]  # Show first 2 traits
            })
        
        return party_info
    
    def _generate_opening_scene(self, session: MultiplayerSession) -> Dict[str, Any]:
        """Generate epic opening scene for the campaign"""
        
        opening_scenarios = [
            {
                "title": "🏰 The Enchanted Caverns",
                "description": "Your party of brave adventurers stands before the entrance to the legendary Enchanted Caverns. Ancient runes glow faintly on the stone archway, and a cool breeze carries whispers of forgotten magic from within.",
                "setting": "Mysterious cave entrance in an ancient forest",
                "mood": "mysterious and adventurous",
                "voice_id": "dm_narrator"
            },
            {
                "title": "🐉 The Dragon's Lair",
                "description": "The mountain path has led your party to a massive cavern filled with glittering treasure. But somewhere in the darkness, you hear the slow, rhythmic breathing of something immense and ancient.",
                "setting": "Dragon's treasure-filled lair",
                "mood": "tense and dangerous",
                "voice_id": "dm_narrator"
            },
            {
                "title": "🏛️ The Lost Temple",
                "description": "After days of searching, your party has discovered the Lost Temple of Aethros. Vines have claimed much of the ancient structure, but the magical aura emanating from within suggests powerful artifacts still remain.",
                "setting": "Ancient temple ruins",
                "mood": "mystical and intriguing",
                "voice_id": "dm_narrator"
            }
        ]
        
        scenario = random.choice(opening_scenarios)
        session.campaign_title = scenario["title"]
        session.current_scene = scenario["description"]
        
        return {
            "title": scenario["title"],
            "description": scenario["description"],
            "setting": scenario["setting"],
            "mood": scenario["mood"],
            "voice_id": scenario["voice_id"],
            "dm_welcome": f"Welcome, {session.human_player_name}! You are joined by your trusted companions. What do you wish to do?",
            "available_actions": [
                "🔍 Investigate the entrance",
                "💬 Talk to party members",
                "⚔️ Prepare for combat",
                "🎒 Check inventory",
                "🎲 Make a skill check"
            ]
        }
    
    def _generate_dm_response(
        self,
        session: MultiplayerSession,
        player_action: str,
        player_dialogue: str
    ) -> Dict[str, Any]:
        """Generate DM response to player actions"""
        
        dm_responses = {
            "investigate": [
                "As you examine the area more closely, you notice...",
                "Your keen observation reveals something interesting...",
                "Looking carefully, you discover..."
            ],
            "attack": [
                "Roll for initiative! Combat begins!",
                "Your weapon strikes true!",
                "The battle is fierce and chaotic!"
            ],
            "talk": [
                "Your words carry weight in this moment...",
                "The conversation takes an interesting turn...",
                "Your diplomatic approach yields results..."
            ],
            "explore": [
                "As you venture forward, the path reveals...",
                "Your exploration uncovers new mysteries...",
                "The journey continues with unexpected discoveries..."
            ]
        }
        
        # Determine response type
        response_type = "explore"  # default
        for key in dm_responses.keys():
            if key in player_action.lower():
                response_type = key
                break
        
        base_response = random.choice(dm_responses[response_type])
        
        # Add dice roll if needed
        dice_roll = None
        if any(word in player_action.lower() for word in ["check", "roll", "attempt"]):
            dice_roll = {
                "die_type": "d20",
                "result": random.randint(1, 20),
                "modifier": random.randint(0, 5)
            }
        
        return {
            "dm_narration": base_response,
            "voice_id": "dm_narrator",
            "dice_roll": dice_roll,
            "scene_update": session.current_scene,
            "mood": "adventurous"
        }
    
    def _analyze_current_situation(self, session: MultiplayerSession) -> str:
        """Analyze current situation for AI decision making"""
        
        if not session.game_turns:
            return "The adventure begins and the party must decide their first move."
        
        recent_turn = session.game_turns[-1]
        return f"The party is dealing with: {recent_turn.action}. {recent_turn.dialogue}"
    
    def _get_party_stats(self, session: MultiplayerSession) -> Dict[str, Any]:
        """Get current party statistics"""
        
        total_hp = sum(ai.hp for ai in session.ai_players)
        max_total_hp = sum(ai.max_hp for ai in session.ai_players)
        
        return {
            "party_level": session.party_level,
            "party_gold": session.party_gold,
            "party_hp": f"{total_hp}/{max_total_hp}",
            "location": session.current_location,
            "total_turns": session.total_turns,
            "session_duration": str(datetime.now() - session.created_at).split('.')[0]
        }
    
    def _load_campaign_scenarios(self) -> List[Dict]:
        """Load pre-built campaign scenarios"""
        return [
            {
                "name": "The Enchanted Caverns",
                "description": "A mysterious cave system filled with ancient magic",
                "difficulty": "Medium",
                "estimated_duration": "2-3 hours"
            },
            {
                "name": "Dragon's Hoard",
                "description": "Face off against a legendary dragon",
                "difficulty": "Hard", 
                "estimated_duration": "3-4 hours"
            },
            {
                "name": "The Lost Temple",
                "description": "Explore ruins filled with puzzles and treasures",
                "difficulty": "Easy",
                "estimated_duration": "1-2 hours"
            }
        ]

# Global session manager
multiplayer_manager = MultiplayerSessionManager()

# Export functions
def create_multiplayer_session(
    human_player_name: str,
    voice_mode: bool = True
) -> Dict[str, Any]:
    """Create new multiplayer session"""
    return multiplayer_manager.create_session(human_player_name, voice_mode)

def process_player_turn(
    session_id: str,
    player_name: str,
    action: str,
    dialogue: str = ""
) -> Dict[str, Any]:
    """Process player turn and get AI responses"""
    return multiplayer_manager.process_player_action(session_id, player_name, action, dialogue)

def get_session_info(session_id: str) -> Optional[Dict[str, Any]]:
    """Get current session information"""
    session = multiplayer_manager.get_session(session_id)
    if not session:
        return None
    
    return {
        "session_id": session.session_id,
        "human_player": session.human_player_name,
        "party_members": multiplayer_manager._format_party_info(session),
        "current_scene": session.current_scene,
        "turn_order": session.turn_order,
        "current_turn": session.turn_order[session.current_turn_index],
        "voice_mode": session.voice_mode,
        "party_stats": multiplayer_manager._get_party_stats(session)
    } 