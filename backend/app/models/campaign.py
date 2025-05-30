from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid
from datetime import datetime

class CampaignStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active" 
    PAUSED = "paused"
    COMPLETED = "completed"
    ARCHIVED = "archived"

class SessionStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class GameEvent(BaseModel):
    """Represents a significant event in the campaign"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: datetime = Field(default_factory=datetime.now)
    event_type: str  # "combat", "social", "exploration", "story"
    description: str
    participants: List[str] = Field(default_factory=list)  # character IDs
    location: Optional[str] = None
    consequences: Optional[str] = None

class NPC(BaseModel):
    """Non-Player Character"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    race: str = "human"
    occupation: str = "commoner"
    location: str = "unknown"
    personality_traits: List[str] = Field(default_factory=list)
    relationship_status: str = "neutral"  # friendly, neutral, hostile
    notes: str = ""
    
class Location(BaseModel):
    """Campaign location/setting"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    location_type: str = "settlement"  # settlement, dungeon, wilderness, etc.
    parent_location: Optional[str] = None  # ID of parent location
    connected_locations: List[str] = Field(default_factory=list)
    npcs: List[str] = Field(default_factory=list)  # NPC IDs
    points_of_interest: List[str] = Field(default_factory=list)
    notes: str = ""

class Quest(BaseModel):
    """Campaign quest/mission"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    quest_giver: Optional[str] = None  # NPC ID
    status: str = "available"  # available, active, completed, failed
    objectives: List[str] = Field(default_factory=list)
    rewards: List[str] = Field(default_factory=list)
    location: Optional[str] = None
    level_requirement: int = 1
    notes: str = ""

class CombatEncounter(BaseModel):
    """Combat encounter definition"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    enemies: List[Dict[str, Any]] = Field(default_factory=list)
    difficulty: str = "medium"  # easy, medium, hard, deadly
    environment: str = "open"
    special_conditions: List[str] = Field(default_factory=list)
    treasure: List[str] = Field(default_factory=list)

class GameSession(BaseModel):
    """Individual game session"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    campaign_id: str
    session_number: int
    name: str = ""
    description: str = ""
    
    # Scheduling
    scheduled_start: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    status: SessionStatus = SessionStatus.SCHEDULED
    
    # Participants
    dm_id: str
    player_ids: List[str] = Field(default_factory=list)
    character_ids: List[str] = Field(default_factory=list)
    
    # Session Content
    events: List[GameEvent] = Field(default_factory=list)
    experience_awarded: int = 0
    treasure_awarded: List[str] = Field(default_factory=list)
    
    # Notes & Summary
    dm_notes: str = ""
    session_summary: str = ""
    player_feedback: Dict[str, str] = Field(default_factory=dict)
    
    # Meta
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

class Campaign(BaseModel):
    """D&D Campaign"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    setting: str = "Forgotten Realms"
    
    # Campaign Details
    status: CampaignStatus = CampaignStatus.PLANNING
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    current_level: int = 1
    
    # Participants
    dm_id: str  # Dungeon Master
    player_ids: List[str] = Field(default_factory=list)
    character_ids: List[str] = Field(default_factory=list)
    
    # World Building
    locations: List[Location] = Field(default_factory=list)
    npcs: List[NPC] = Field(default_factory=list)
    quests: List[Quest] = Field(default_factory=list)
    encounters: List[CombatEncounter] = Field(default_factory=list)
    
    # Campaign Progress
    sessions: List[str] = Field(default_factory=list)  # Session IDs
    current_session_id: Optional[str] = None
    story_arc: str = ""
    campaign_notes: str = ""
    
    # Rules & Settings
    homebrew_rules: List[str] = Field(default_factory=list)
    house_rules: Dict[str, str] = Field(default_factory=dict)
    allowed_sources: List[str] = Field(default_factory=lambda: ["Players Handbook"])
    
    # Meta
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    def add_player(self, player_id: str, character_id: str):
        """Add a player and their character to the campaign"""
        if player_id not in self.player_ids:
            self.player_ids.append(player_id)
        if character_id not in self.character_ids:
            self.character_ids.append(character_id)
        self.updated_at = datetime.now()
    
    def remove_player(self, player_id: str, character_id: str):
        """Remove a player and their character from the campaign"""
        if player_id in self.player_ids:
            self.player_ids.remove(player_id)
        if character_id in self.character_ids:
            self.character_ids.remove(character_id)
        self.updated_at = datetime.now()
    
    def add_session(self, session_id: str):
        """Add a session to the campaign"""
        if session_id not in self.sessions:
            self.sessions.append(session_id)
        self.updated_at = datetime.now()
    
    def get_active_quests(self) -> List[Quest]:
        """Get all active quests"""
        return [quest for quest in self.quests if quest.status == "active"]
    
    def get_available_quests(self) -> List[Quest]:
        """Get all available quests for the current level"""
        return [quest for quest in self.quests 
                if quest.status == "available" and quest.level_requirement <= self.current_level]

# Request/Response models
class CampaignCreate(BaseModel):
    name: str
    description: str
    setting: str = "Forgotten Realms"
    dm_id: str

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CampaignStatus] = None
    current_level: Optional[int] = None
    campaign_notes: Optional[str] = None

class SessionCreate(BaseModel):
    campaign_id: str
    name: str = ""
    description: str = ""
    scheduled_start: Optional[datetime] = None

class SessionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[SessionStatus] = None
    dm_notes: Optional[str] = None
    session_summary: Optional[str] = None 