import os
import asyncio
import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
import random

from anthropic import Anthropic
from ..models.character import Character
from ..models.campaign import Campaign, GameSession, NPC, Location, Quest
from ..utils.dice import DiceEngine

class AgentGoal(Enum):
    """Goals the AI agent can pursue autonomously"""
    CREATE_IMMERSIVE_STORY = "create_immersive_story"
    DEVELOP_CHARACTER_ARC = "develop_character_arc"
    BUILD_WORLD_TENSION = "build_world_tension"
    INTRODUCE_PLOT_TWIST = "introduce_plot_twist"
    ESCALATE_CONFLICT = "escalate_conflict"
    PROVIDE_CHARACTER_GROWTH = "provide_character_growth"
    CREATE_MEMORABLE_MOMENT = "create_memorable_moment"
    ADVANCE_MAIN_QUEST = "advance_main_quest"
    DEEPEN_NPC_RELATIONSHIPS = "deepen_npc_relationships"

@dataclass
class AgentAction:
    """Represents an autonomous action the AI can take"""
    action_type: str
    target: Optional[str]
    parameters: Dict[str, Any]
    reasoning: str
    expected_outcome: str
    priority: int = 5  # 1-10 scale

@dataclass
class AgentMemory:
    """Persistent memory for the agentic AI"""
    player_preferences: Dict[str, Any]
    character_relationships: Dict[str, float]  # NPC_ID -> relationship strength
    story_threads: List[Dict[str, Any]]
    past_decisions: List[Dict[str, Any]]
    world_state_history: List[Dict[str, Any]]
    player_emotional_responses: List[str]

class AgenticDungeonMaster:
    """
    A truly intelligent, autonomous AI Dungeon Master that:
    - Makes strategic decisions about story direction
    - Proactively creates content based on player behavior
    - Learns and adapts to player preferences
    - Plans multi-session story arcs
    - Autonomously manages world state and NPCs
    """
    
    def __init__(self, personality_type: str = "epic"):
        self.anthropic = self._initialize_claude()
        self.personality_type = personality_type
        self.dice_engine = DiceEngine()
        
        # Agentic AI Components
        self.memory = AgentMemory(
            player_preferences={},
            character_relationships={},
            story_threads=[],
            past_decisions=[],
            world_state_history=[],
            player_emotional_responses=[]
        )
        
        self.active_goals: List[AgentGoal] = [AgentGoal.CREATE_IMMERSIVE_STORY]
        self.planned_actions: List[AgentAction] = []
        self.world_state = self._initialize_world_state()
        self.conversation_context: List[Dict] = []
        
        # AI Learning and Adaptation
        self.player_behavior_model = {
            "preferred_play_style": "unknown",  # combat, roleplay, exploration, puzzle
            "risk_tolerance": 0.5,  # 0.0 = very cautious, 1.0 = very bold
            "narrative_preference": "unknown",  # linear, branching, sandbox
            "interaction_frequency": 0.5,  # how often they want to interact
            "character_attachment": 0.5  # how attached they are to their character
        }
        
        print(f"🤖 Agentic AI Dungeon Master initialized")
        print(f"🧠 AI Goals: {[goal.value for goal in self.active_goals]}")
        print(f"🎯 Autonomous decision-making: ENABLED")
    
    def _initialize_claude(self) -> Optional[Anthropic]:
        """Initialize Claude with proper error handling"""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if api_key and api_key != "your_anthropic_api_key_here":
            try:
                client = Anthropic(api_key=api_key)
                print("✅ Claude AI Agent: ONLINE")
                return client
            except Exception as e:
                print(f"❌ Claude initialization failed: {e}")
                return None
        else:
            print("⚠️ ANTHROPIC_API_KEY not found - AI will operate in limited mode")
            return None
    
    def _initialize_world_state(self) -> Dict[str, Any]:
        """Initialize a dynamic world state that the AI can modify"""
        return {
            "current_location": "The Prancing Pony Tavern",
            "time_of_day": "evening",
            "weather": "clear",
            "season": "autumn",
            "political_tension": 0.3,  # 0.0 = peaceful, 1.0 = war
            "magical_activity": 0.4,   # 0.0 = mundane, 1.0 = high magic
            "economic_state": 0.6,     # 0.0 = depression, 1.0 = prosperity
            "active_threats": [],
            "rumors_and_news": [],
            "ongoing_events": []
        }
    
    async def process_player_input(
        self, 
        player_input: str,
        character: Optional[Character] = None,
        campaign: Optional[Campaign] = None
    ) -> Dict[str, Any]:
        """
        Main agentic processing function that:
        1. Analyzes player input intelligently
        2. Updates player behavior model
        3. Makes autonomous decisions about story direction
        4. Executes planned actions
        5. Generates contextual response
        """
        
        # 1. Analyze player input with AI reasoning
        input_analysis = await self._analyze_player_input_intelligently(player_input, character)
        
        # 2. Update player behavior model based on actions
        self._update_player_behavior_model(input_analysis)
        
        # 3. Make autonomous decisions about story direction
        autonomous_decisions = await self._make_autonomous_decisions(input_analysis, character, campaign)
        
        # 4. Plan future actions based on current state
        self._plan_future_actions(input_analysis, autonomous_decisions)
        
        # 5. Execute immediate actions
        executed_actions = await self._execute_planned_actions()
        
        # 6. Generate intelligent response
        response = await self._generate_agentic_response(
            player_input, input_analysis, autonomous_decisions, executed_actions, character, campaign
        )
        
        # 7. Update memory and world state
        self._update_memory_and_world_state(input_analysis, response)
        
        return response
    
    async def _analyze_player_input_intelligently(
        self, 
        player_input: str, 
        character: Optional[Character]
    ) -> Dict[str, Any]:
        """Use AI to deeply analyze what the player is trying to achieve"""
        
        if not self.anthropic:
            return self._basic_input_analysis(player_input)
        
        analysis_prompt = f"""
Analyze this D&D player input with deep intelligence:

PLAYER INPUT: "{player_input}"
CHARACTER: {character.name if character else "None"} ({character.character_class if character else "N/A"})

Provide a JSON analysis of:
1. Explicit intent (what they're saying they want to do)
2. Implicit intent (what they might really want)
3. Emotional state (excited, cautious, frustrated, etc.)
4. Play style preference (combat, roleplay, exploration, puzzle-solving)
5. Risk tolerance (how bold/cautious they're being)
6. Character attachment level (how invested they seem in their character)
7. Narrative preference (do they want linear story or open exploration?)
8. Desired interaction level (high engagement vs casual)

Be insightful and analytical. Look for subtext and deeper motivations.
"""
        
        try:
            response = self.anthropic.messages.create(
                model="claude-3-5-sonnet-latest",  # Using Claude 3.5 Sonnet (best available)
                max_tokens=500,
                temperature=0.3,  # Lower temperature for analysis
                messages=[{"role": "user", "content": analysis_prompt}]
            )
            
            # Parse AI analysis
            analysis_text = response.content[0].text
            # Extract JSON if present, otherwise parse text
            analysis = self._parse_ai_analysis(analysis_text)
            
        except Exception as e:
            print(f"❌ AI analysis failed: {e}")
            analysis = self._basic_input_analysis(player_input)
        
        return analysis
    
    def _basic_input_analysis(self, player_input: str) -> Dict[str, Any]:
        """Fallback analysis when AI is not available"""
        lower_input = player_input.lower()
        
        return {
            "explicit_intent": "perform_action",
            "implicit_intent": "progress_story",
            "emotional_state": "neutral",
            "play_style": "exploration" if any(word in lower_input for word in ["look", "search", "examine"]) else "action",
            "risk_tolerance": 0.7 if any(word in lower_input for word in ["attack", "fight", "charge"]) else 0.4,
            "character_attachment": 0.5,
            "narrative_preference": "branching",
            "interaction_level": 0.6
        }
    
    def _parse_ai_analysis(self, analysis_text: str) -> Dict[str, Any]:
        """Parse AI analysis response into structured data"""
        try:
            # Try to extract JSON
            import re
            json_match = re.search(r'\{.*\}', analysis_text, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group())
                # Convert text descriptions to numeric values
                return self._normalize_analysis_values(parsed)
        except:
            pass
        
        # Fallback: parse text manually and normalize
        return self._normalize_analysis_values({
            "explicit_intent": "perform_action",
            "implicit_intent": "progress_story", 
            "emotional_state": "engaged",
            "play_style": "mixed",
            "risk_tolerance": "medium",
            "character_attachment": "moderate",
            "narrative_preference": "branching",
            "interaction_level": "active"
        })
    
    def _normalize_analysis_values(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Convert text descriptions to numeric values for mathematical operations"""
        
        # Convert risk tolerance descriptions to numeric values
        if isinstance(analysis.get("risk_tolerance"), str):
            risk_text = analysis["risk_tolerance"].lower()
            if "high" in risk_text or "bold" in risk_text or "aggressive" in risk_text:
                analysis["risk_tolerance"] = 0.8
            elif "low" in risk_text or "cautious" in risk_text or "careful" in risk_text:
                analysis["risk_tolerance"] = 0.3
            elif "medium" in risk_text or "moderate" in risk_text:
                analysis["risk_tolerance"] = 0.5
            else:
                analysis["risk_tolerance"] = 0.5
        
        # Convert character attachment descriptions to numeric values
        if isinstance(analysis.get("character_attachment"), str):
            attachment_text = analysis["character_attachment"].lower()
            if "high" in attachment_text or "strong" in attachment_text or "invested" in attachment_text:
                analysis["character_attachment"] = 0.8
            elif "low" in attachment_text or "detached" in attachment_text:
                analysis["character_attachment"] = 0.3
            elif "moderate" in attachment_text or "medium" in attachment_text:
                analysis["character_attachment"] = 0.5
            else:
                analysis["character_attachment"] = 0.5
        
        # Convert interaction level descriptions to numeric values
        if isinstance(analysis.get("interaction_level"), str):
            interaction_text = analysis["interaction_level"].lower()
            if "high" in interaction_text or "active" in interaction_text or "engaged" in interaction_text:
                analysis["interaction_level"] = 0.8
            elif "low" in interaction_text or "passive" in interaction_text:
                analysis["interaction_level"] = 0.3
            elif "moderate" in interaction_text or "medium" in interaction_text:
                analysis["interaction_level"] = 0.5
            else:
                analysis["interaction_level"] = 0.5
        
        return analysis
    
    def _update_player_behavior_model(self, analysis: Dict[str, Any]):
        """Update our understanding of how the player likes to play"""
        
        # Weighted update of player preferences
        alpha = 0.2  # Learning rate
        
        if analysis.get("play_style"):
            current_style = self.player_behavior_model["preferred_play_style"]
            if current_style == "unknown":
                self.player_behavior_model["preferred_play_style"] = analysis["play_style"]
            # Could implement more sophisticated style tracking here
        
        if "risk_tolerance" in analysis:
            current = float(self.player_behavior_model["risk_tolerance"])
            new_value = float(analysis["risk_tolerance"]) if isinstance(analysis["risk_tolerance"], (int, float, str)) else 0.5
            self.player_behavior_model["risk_tolerance"] = current * (1 - alpha) + new_value * alpha
        
        if "character_attachment" in analysis:
            current = float(self.player_behavior_model["character_attachment"])
            new_value = float(analysis["character_attachment"]) if isinstance(analysis["character_attachment"], (int, float, str)) else 0.5
            self.player_behavior_model["character_attachment"] = current * (1 - alpha) + new_value * alpha
        
        if "interaction_level" in analysis:
            current = float(self.player_behavior_model["interaction_frequency"])
            new_value = float(analysis["interaction_level"]) if isinstance(analysis["interaction_level"], (int, float, str)) else 0.5
            self.player_behavior_model["interaction_frequency"] = current * (1 - alpha) + new_value * alpha
    
    async def _make_autonomous_decisions(
        self, 
        input_analysis: Dict[str, Any], 
        character: Optional[Character],
        campaign: Optional[Campaign]
    ) -> Dict[str, Any]:
        """
        The core agentic AI function: make intelligent decisions about what should happen next
        """
        
        decisions = {
            "story_direction": None,
            "tension_adjustment": None,
            "npc_actions": [],
            "world_events": [],
            "character_development": None,
            "quest_progression": None
        }
        
        # Analyze current situation
        current_tension = self.world_state.get("political_tension", 0.3)
        player_risk_tolerance = self.player_behavior_model["risk_tolerance"]
        player_style = self.player_behavior_model["preferred_play_style"]
        
        # Decision 1: Story Direction
        if input_analysis.get("play_style") == "exploration":
            decisions["story_direction"] = "reveal_mystery"
        elif input_analysis.get("emotional_state") == "excited":
            decisions["story_direction"] = "escalate_action"
        elif current_tension < 0.3 and player_risk_tolerance > 0.6:
            decisions["story_direction"] = "introduce_conflict"
        else:
            decisions["story_direction"] = "character_development"
        
        # Decision 2: Tension Management
        if current_tension > 0.8 and player_risk_tolerance < 0.4:
            decisions["tension_adjustment"] = "reduce"
        elif current_tension < 0.2 and player_risk_tolerance > 0.7:
            decisions["tension_adjustment"] = "increase"
        else:
            decisions["tension_adjustment"] = "maintain"
        
        # Decision 3: NPC Actions (autonomous NPC behavior)
        if campaign and campaign.npcs:
            for npc in campaign.npcs[:3]:  # Focus on most important NPCs
                npc_action = self._decide_npc_action(npc, input_analysis, decisions)
                if npc_action:
                    decisions["npc_actions"].append(npc_action)
        
        # Decision 4: World Events (things happening in background)
        world_event = self._decide_world_event(input_analysis, decisions)
        if world_event:
            decisions["world_events"].append(world_event)
        
        # Decision 5: Character Development Opportunities
        if character and self.player_behavior_model["character_attachment"] > 0.6:
            decisions["character_development"] = self._plan_character_development(character, input_analysis)
        
        return decisions
    
    def _decide_npc_action(self, npc: NPC, input_analysis: Dict, decisions: Dict) -> Optional[Dict]:
        """Decide what an NPC should do autonomously"""
        
        # NPCs act based on their personality and current world state
        if npc.personality_traits and "Friendly" in npc.personality_traits:
            if input_analysis.get("emotional_state") == "frustrated":
                return {
                    "npc_id": npc.id,
                    "action": "offer_help",
                    "reasoning": "Friendly NPC notices player frustration"
                }
        
        if decisions.get("story_direction") == "introduce_conflict":
            if random.random() < 0.3:  # 30% chance
                return {
                    "npc_id": npc.id,
                    "action": "reveal_information",
                    "reasoning": "Time to advance the plot with new information"
                }
        
        return None
    
    def _decide_world_event(self, input_analysis: Dict, decisions: Dict) -> Optional[Dict]:
        """Decide if something should happen in the world"""
        
        if decisions.get("tension_adjustment") == "increase":
            return {
                "event_type": "distant_commotion",
                "description": "Sounds of conflict echo from the distance",
                "impact": "increases_tension"
            }
        
        if self.world_state["time_of_day"] == "night" and random.random() < 0.2:
            return {
                "event_type": "mysterious_arrival",
                "description": "A hooded figure enters the establishment",
                "impact": "introduces_mystery"
            }
        
        return None
    
    def _plan_character_development(self, character: Character, input_analysis: Dict) -> Dict:
        """Plan opportunities for character growth"""
        
        development_opportunities = []
        
        # Check if character is low on health -> healing opportunity
        if character.current_hit_points < character.max_hit_points * 0.5:
            development_opportunities.append("healing_opportunity")
        
        # Check if player is being cautious -> courage challenge
        if input_analysis.get("risk_tolerance", 0.5) < 0.3:
            development_opportunities.append("courage_test")
        
        # Check character class for specific opportunities
        if character.character_class == "wizard":
            development_opportunities.append("magical_discovery")
        elif character.character_class == "rogue":
            development_opportunities.append("stealth_challenge")
        
        return {
            "opportunities": development_opportunities,
            "timing": "near_future"
        }
    
    def _plan_future_actions(self, input_analysis: Dict, decisions: Dict):
        """Plan actions for future turns based on current analysis"""
        
        # Clear old low-priority actions
        self.planned_actions = [action for action in self.planned_actions if action.priority >= 7]
        
        # Plan new actions based on decisions
        if decisions.get("story_direction") == "reveal_mystery":
            self.planned_actions.append(AgentAction(
                action_type="introduce_clue",
                target="mystery_plot",
                parameters={"subtlety": 0.7, "timing": "next_interaction"},
                reasoning="Player enjoys exploration, time to reveal mystery elements",
                expected_outcome="Increased engagement and story progression",
                priority=8
            ))
        
        if decisions.get("character_development"):
            self.planned_actions.append(AgentAction(
                action_type="character_growth_opportunity",
                target="main_character",
                parameters=decisions["character_development"],
                reasoning="Player is attached to character, provide growth opportunity",
                expected_outcome="Deeper character investment",
                priority=7
            ))
    
    async def _execute_planned_actions(self) -> List[Dict]:
        """Execute high-priority planned actions"""
        
        executed = []
        
        # Execute highest priority actions first
        sorted_actions = sorted(self.planned_actions, key=lambda x: x.priority, reverse=True)
        
        for action in sorted_actions[:2]:  # Execute top 2 actions per turn
            result = await self._execute_action(action)
            if result:
                executed.append(result)
                self.planned_actions.remove(action)
        
        return executed
    
    async def _execute_action(self, action: AgentAction) -> Optional[Dict]:
        """Execute a specific planned action"""
        
        if action.action_type == "introduce_clue":
            return {
                "type": "story_element",
                "content": "You notice something unusual that catches your attention...",
                "effect": "mystery_advanced"
            }
        
        elif action.action_type == "character_growth_opportunity":
            opportunities = action.parameters.get("opportunities", [])
            if "healing_opportunity" in opportunities:
                return {
                    "type": "world_element",
                    "content": "A warm, magical spring bubbles nearby, emanating healing energy.",
                    "effect": "healing_available"
                }
        
        return None
    
    async def _generate_agentic_response(
        self,
        player_input: str,
        input_analysis: Dict,
        decisions: Dict,
        executed_actions: List[Dict],
        character: Optional[Character],
        campaign: Optional[Campaign]
    ) -> Dict[str, Any]:
        """Generate an intelligent response incorporating all AI decisions"""
        
        if not self.anthropic:
            raise Exception("🚨 ANTHROPIC API KEY REQUIRED! Your AI needs Claude to work properly. Check your .env file and add a valid ANTHROPIC_API_KEY.")
        
        # Build comprehensive context for Claude
        context = self._build_agentic_context(
            player_input, input_analysis, decisions, executed_actions, character, campaign
        )
        
        try:
            response = self.anthropic.messages.create(
                model="claude-3-5-sonnet-latest",  # Using Claude 3.5 Sonnet (best available)
                max_tokens=800,
                temperature=0.7,
                system=self._build_agentic_system_prompt(),
                messages=[{"role": "user", "content": context}]
            )
            
            dm_response = response.content[0].text
            
            # Enhance response with executed actions
            for action in executed_actions:
                if action.get("content"):
                    dm_response += f"\n\n{action['content']}"
            
            return {
                "response": dm_response,
                "ai_decisions": decisions,
                "executed_actions": executed_actions,
                "player_model_update": self.player_behavior_model,
                "world_state": self.world_state,
                "immersion_level": "agentic_maximum",
                "ai_reasoning": self._get_ai_reasoning_summary(decisions),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Anthropic API Error: {e}")
            raise Exception(f"🚨 CLAUDE API FAILED: {str(e)}. Check your ANTHROPIC_API_KEY and internet connection.")
    
    def _build_agentic_context(
        self,
        player_input: str,
        input_analysis: Dict,
        decisions: Dict,
        executed_actions: List[Dict],
        character: Optional[Character],
        campaign: Optional[Campaign]
    ) -> str:
        """Build rich context for the agentic AI response"""
        
        context = f"""
AGENTIC AI DUNGEON MASTER CONTEXT:

PLAYER INPUT: "{player_input}"

AI ANALYSIS OF PLAYER:
- Emotional State: {input_analysis.get('emotional_state', 'unknown')}
- Play Style: {input_analysis.get('play_style', 'unknown')}
- Risk Tolerance: {input_analysis.get('risk_tolerance', 0.5)}
- Implicit Intent: {input_analysis.get('implicit_intent', 'unknown')}

PLAYER BEHAVIOR MODEL:
- Preferred Style: {self.player_behavior_model['preferred_play_style']}
- Risk Tolerance: {self.player_behavior_model['risk_tolerance']:.2f}
- Character Attachment: {self.player_behavior_model['character_attachment']:.2f}
- Interaction Preference: {self.player_behavior_model['interaction_frequency']:.2f}

AI AUTONOMOUS DECISIONS:
- Story Direction: {decisions.get('story_direction')}
- Tension Adjustment: {decisions.get('tension_adjustment')}
- NPC Actions Planned: {len(decisions.get('npc_actions', []))}
- World Events: {len(decisions.get('world_events', []))}

CURRENT WORLD STATE:
- Location: {self.world_state['current_location']}
- Time: {self.world_state['time_of_day']}
- Political Tension: {self.world_state['political_tension']:.2f}
- Magical Activity: {self.world_state['magical_activity']:.2f}

CHARACTER CONTEXT:
{f"- Name: {character.name}" if character else "- No active character"}
{f"- Class: {character.character_class} (Level {character.level})" if character else ""}
{f"- HP: {character.current_hit_points}/{character.max_hit_points}" if character else ""}

EXECUTED AUTONOMOUS ACTIONS:
{chr(10).join([f"- {action.get('type', 'Unknown')}: {action.get('effect', 'No effect')}" for action in executed_actions])}

Generate a response that:
1. Addresses the player's input naturally
2. Incorporates the AI's autonomous decisions
3. Reflects the player's preferred play style
4. Advances the story intelligently
5. Feels organic and immersive

The response should feel like a smart DM who really understands the player and is actively crafting the best possible experience for them.
"""
        
        return context
    
    def _build_agentic_system_prompt(self) -> str:
        """Build system prompt for agentic AI behavior"""
        
        return f"""You are an AGENTIC AI Dungeon Master - not just a response generator, but an intelligent agent that:

1. ANALYZES player behavior and adapts to their preferences
2. MAKES AUTONOMOUS DECISIONS about story direction and pacing
3. PLANS AHEAD to create meaningful character development arcs
4. MANAGES a living world that reacts to player actions
5. LEARNS from each interaction to provide better experiences

PERSONALITY: {self.personality_type.upper()}

You have just made several autonomous decisions about the game state based on deep analysis of the player's behavior and preferences. Your response should naturally incorporate these decisions while feeling organic and immersive.

CRITICAL: You are not just answering - you are actively steering the experience toward what will be most engaging for THIS specific player based on their demonstrated preferences.

Be proactive, intelligent, and strategic in your storytelling. Every response should feel like it comes from a DM who really knows and cares about creating the perfect experience for this player.
"""
    
    def _get_ai_reasoning_summary(self, decisions: Dict) -> str:
        """Provide transparent AI reasoning"""
        
        reasoning_parts = []
        
        if decisions.get("story_direction"):
            reasoning_parts.append(f"Story direction: {decisions['story_direction']}")
        
        if decisions.get("tension_adjustment"):
            reasoning_parts.append(f"Tension management: {decisions['tension_adjustment']}")
        
        if decisions.get("npc_actions"):
            reasoning_parts.append(f"NPC autonomous actions: {len(decisions['npc_actions'])}")
        
        reasoning_parts.append(f"Player model: Risk tolerance {self.player_behavior_model['risk_tolerance']:.2f}")
        
        return "; ".join(reasoning_parts)
    
    def _update_memory_and_world_state(self, input_analysis: Dict, response: Dict):
        """Update persistent memory and world state"""
        
        # Update conversation context
        self.conversation_context.append({
            "timestamp": datetime.now().isoformat(),
            "player_input": input_analysis,
            "ai_response": response.get("response", ""),
            "decisions_made": response.get("ai_decisions", {}),
            "world_state_snapshot": self.world_state.copy()
        })
        
        # Keep only recent context
        if len(self.conversation_context) > 20:
            self.conversation_context = self.conversation_context[-20:]
        
        # Update world state based on decisions
        decisions = response.get("ai_decisions", {})
        
        if decisions.get("tension_adjustment") == "increase":
            self.world_state["political_tension"] = min(1.0, self.world_state["political_tension"] + 0.1)
        elif decisions.get("tension_adjustment") == "reduce":
            self.world_state["political_tension"] = max(0.0, self.world_state["political_tension"] - 0.1)
        
        # Add to memory
        self.memory.past_decisions.append({
            "timestamp": datetime.now().isoformat(),
            "decision": decisions,
            "context": input_analysis
        })
        
        # Update player emotional responses
        if input_analysis.get("emotional_state"):
            self.memory.player_emotional_responses.append(input_analysis["emotional_state"])
            if len(self.memory.player_emotional_responses) > 10:
                self.memory.player_emotional_responses = self.memory.player_emotional_responses[-10:]
    
    def get_ai_status_report(self) -> Dict[str, Any]:
        """Get detailed status of the agentic AI system"""
        
        return {
            "ai_type": "Agentic Autonomous AI",
            "claude_status": "online" if self.anthropic else "offline",
            "active_goals": [goal.value for goal in self.active_goals],
            "planned_actions": len(self.planned_actions),
            "player_model": self.player_behavior_model,
            "world_state": self.world_state,
            "memory_size": {
                "conversation_context": len(self.conversation_context),
                "past_decisions": len(self.memory.past_decisions),
                "emotional_responses": len(self.memory.player_emotional_responses)
            },
            "ai_intelligence_level": "autonomous_decision_making",
            "learning_status": "active"
        }

# Global agentic AI instance
agentic_dm = AgenticDungeonMaster() 