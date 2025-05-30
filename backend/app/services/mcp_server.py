"""
MCP (Model Context Protocol) Server Integration
MANDATORY for AWS MCP Agents Hackathon
"""

from mcp.server.fastmcp import FastMCP
from typing import Any, Dict
import asyncio
import logging
from datetime import datetime

from app.services.agentic_ai import agentic_dm
from app.utils.dice import DiceEngine

# Setup logging
logger = logging.getLogger(__name__)

# Create FastMCP server (new simplified API)
mcp_server = FastMCP("AI-Dungeon-Master-MCP")
dice_engine = DiceEngine()

@mcp_server.tool()
def dm_analyze_player(player_input: str, session_id: str = "default") -> Dict[str, Any]:
    """AI Agent Tool: Analyze player behavior patterns for adaptive storytelling"""
    try:
        # Simulate analysis (will be enhanced with real AI)
        analysis = {
            "preferred_style": "adventure" if "explore" in player_input.lower() else "combat",
            "risk_tolerance": 0.7 if "attack" in player_input.lower() else 0.5,
            "engagement_type": "exploration"
        }
        
        return {
            "analysis": analysis,
            "recommendations": {
                "story_direction": analysis["preferred_style"],
                "tension_level": analysis["risk_tolerance"],
                "engagement_strategy": analysis["engagement_type"]
            },
            "mcp_agent_chain": "behavior_analysis → story_adaptation",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"MCP Player Analysis Error: {e}")
        return {"error": str(e), "mcp_status": "failed"}

@mcp_server.tool()
def dm_roll_dice(notation: str, advantage: bool = False, disadvantage: bool = False) -> Dict[str, Any]:
    """AI Agent Tool: Enhanced dice rolling with D&D mechanics"""
    try:
        roll_result = dice_engine.roll_dice(notation, advantage, disadvantage)
        
        return {
            "roll_result": {
                "total": roll_result.total,
                "dice_notation": roll_result.dice_notation,
                "individual_rolls": roll_result.individual_rolls,
                "critical": roll_result.critical,
                "modifier": roll_result.modifier
            },
            "dramatic_effect": "LEGENDARY" if roll_result.critical else "SUCCESS",
            "mcp_agent_chain": "dice_mechanics → ai_interpretation → story_integration",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"MCP Dice Roll Error: {e}")
        return {"error": str(e), "mcp_status": "failed"}

@mcp_server.resource("dnd://world-state")
def get_world_state() -> str:
    """MCP Resource: Get current D&D world state"""
    try:
        world_state = agentic_dm.get_current_world_state()
        return f"World State: {world_state}"
    except Exception as e:
        return f"Error retrieving world state: {e}"

@mcp_server.prompt()
def dm_epic_encounter(location: str = "mysterious cave", challenge_level: str = "medium") -> str:
    """MCP Prompt: Generate epic D&D encounters"""
    return f"""
You are an epic Dungeon Master creating a {challenge_level} encounter in a {location}.

Create an encounter that includes:
- Vivid description of the setting
- Interesting NPCs or creatures
- Multiple ways to resolve the situation
- Opportunities for character development

Make it memorable and engaging!
"""

# Export for use in main app
async def start_mcp_server():
    """Start the MCP server for AI agent integration"""
    logger.info("🤖 Starting AI Dungeon Master MCP Server")
    logger.info("📡 MCP Protocol: Enabled for agent chaining")
    logger.info("🎯 Hackathon Mode: ACTIVE")
    
    # Run the MCP server
    mcp_server.run()

if __name__ == "__main__":
    # Run MCP server standalone for testing
    asyncio.run(start_mcp_server()) 