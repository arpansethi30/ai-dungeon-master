from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum
import uuid
from datetime import datetime

class CharacterClass(str, Enum):
    BARBARIAN = "barbarian"
    BARD = "bard"
    CLERIC = "cleric"
    DRUID = "druid"
    FIGHTER = "fighter"
    MONK = "monk"
    PALADIN = "paladin"
    RANGER = "ranger"
    ROGUE = "rogue"
    SORCERER = "sorcerer"
    WARLOCK = "warlock"
    WIZARD = "wizard"

class Race(str, Enum):
    HUMAN = "human"
    ELF = "elf"
    DWARF = "dwarf"
    HALFLING = "halfling"
    DRAGONBORN = "dragonborn"
    GNOME = "gnome"
    HALF_ELF = "half-elf"
    HALF_ORC = "half-orc"
    TIEFLING = "tiefling"

class AbilityScores(BaseModel):
    strength: int = Field(default=10, ge=1, le=30)
    dexterity: int = Field(default=10, ge=1, le=30)
    constitution: int = Field(default=10, ge=1, le=30)
    intelligence: int = Field(default=10, ge=1, le=30)
    wisdom: int = Field(default=10, ge=1, le=30)
    charisma: int = Field(default=10, ge=1, le=30)

    def get_modifier(self, ability: str) -> int:
        """Calculate ability modifier"""
        score = getattr(self, ability.lower())
        return (score - 10) // 2

class Skills(BaseModel):
    # Strength
    athletics: int = 0
    
    # Dexterity
    acrobatics: int = 0
    sleight_of_hand: int = 0
    stealth: int = 0
    
    # Intelligence
    arcana: int = 0
    history: int = 0
    investigation: int = 0
    nature: int = 0
    religion: int = 0
    
    # Wisdom
    animal_handling: int = 0
    insight: int = 0
    medicine: int = 0
    perception: int = 0
    survival: int = 0
    
    # Charisma
    deception: int = 0
    intimidation: int = 0
    performance: int = 0
    persuasion: int = 0

class Equipment(BaseModel):
    name: str
    description: str
    quantity: int = 1
    weight: float = 0.0
    value: int = 0  # in copper pieces
    item_type: str = "misc"  # weapon, armor, misc, consumable, etc.
    
class Spell(BaseModel):
    name: str
    level: int
    school: str
    casting_time: str
    range: str
    components: List[str]
    duration: str
    description: str
    damage: Optional[str] = None

class Character(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    player_id: str
    campaign_id: Optional[str] = None
    
    # Basic Info
    name: str
    race: Race
    character_class: CharacterClass
    level: int = Field(default=1, ge=1, le=20)
    background: str = "adventurer"
    alignment: str = "neutral"
    
    # Core Stats
    ability_scores: AbilityScores = Field(default_factory=AbilityScores)
    skills: Skills = Field(default_factory=Skills)
    proficiency_bonus: int = 2
    
    # Health & Combat
    max_hit_points: int = Field(default=10, gt=0)
    current_hit_points: int = Field(default=10, ge=0)
    armor_class: int = Field(default=10, ge=0)
    speed: int = Field(default=30, ge=0)
    initiative: int = 0
    
    # Resources
    hit_dice: str = "1d8"
    spell_slots: Dict[int, int] = Field(default_factory=dict)  # {level: slots}
    
    # Equipment & Inventory
    equipment: List[Equipment] = Field(default_factory=list)
    gold: int = 0
    
    # Spells (for casters)
    known_spells: List[Spell] = Field(default_factory=list)
    prepared_spells: List[str] = Field(default_factory=list)  # spell names
    
    # Character Development
    experience_points: int = 0
    personality_traits: List[str] = Field(default_factory=list)
    ideals: List[str] = Field(default_factory=list)
    bonds: List[str] = Field(default_factory=list)
    flaws: List[str] = Field(default_factory=list)
    
    # Meta
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    def get_ability_modifier(self, ability: str) -> int:
        """Get ability modifier for a given ability"""
        return self.ability_scores.get_modifier(ability)
    
    def get_skill_bonus(self, skill: str) -> int:
        """Calculate total skill bonus including ability modifier and proficiency"""
        skill_value = getattr(self.skills, skill, 0)
        
        # Map skills to their governing abilities
        skill_abilities = {
            "athletics": "strength",
            "acrobatics": "dexterity", "sleight_of_hand": "dexterity", "stealth": "dexterity",
            "arcana": "intelligence", "history": "intelligence", "investigation": "intelligence",
            "nature": "intelligence", "religion": "intelligence",
            "animal_handling": "wisdom", "insight": "wisdom", "medicine": "wisdom",
            "perception": "wisdom", "survival": "wisdom",
            "deception": "charisma", "intimidation": "charisma", "performance": "charisma",
            "persuasion": "charisma"
        }
        
        ability = skill_abilities.get(skill, "strength")
        ability_modifier = self.get_ability_modifier(ability)
        
        # If proficient (skill_value > 0), add proficiency bonus
        proficiency = self.proficiency_bonus if skill_value > 0 else 0
        
        return ability_modifier + proficiency + skill_value
    
    def is_alive(self) -> bool:
        """Check if character is alive"""
        return self.current_hit_points > 0
    
    def take_damage(self, damage: int) -> int:
        """Apply damage and return actual damage taken"""
        actual_damage = min(damage, self.current_hit_points)
        self.current_hit_points -= actual_damage
        self.updated_at = datetime.now()
        return actual_damage
    
    def heal(self, amount: int) -> int:
        """Heal character and return actual healing done"""
        max_heal = self.max_hit_points - self.current_hit_points
        actual_heal = min(amount, max_heal)
        self.current_hit_points += actual_heal
        self.updated_at = datetime.now()
        return actual_heal

class CharacterCreate(BaseModel):
    name: str
    race: Race
    character_class: CharacterClass
    background: str = "adventurer"
    alignment: str = "neutral"
    
    # Optional ability scores (will be rolled if not provided)
    ability_scores: Optional[AbilityScores] = None

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    level: Optional[int] = None
    current_hit_points: Optional[int] = None
    equipment: Optional[List[Equipment]] = None
    gold: Optional[int] = None 