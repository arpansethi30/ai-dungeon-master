"""
Multiplayer D&D API Endpoints
Voice-enabled multiplayer sessions with AI companions
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Dict, List, Any, Optional
import asyncio

from ..models.multiplayer_session import (
    create_multiplayer_session,
    process_player_turn,
    get_session_info,
    multiplayer_manager
)
from ..models.ai_players import get_ai_players, generate_ai_player_response
from ..services.minimax_direct_api import create_voice_direct

router = APIRouter()

# Request Models
class CreateSessionRequest(BaseModel):
    player_name: str
    voice_mode: bool = True

class PlayerActionRequest(BaseModel):
    session_id: str
    player_name: str
    action: str
    dialogue: str = ""
    generate_voice: bool = True

class VoiceGenerationRequest(BaseModel):
    session_id: str
    player_name: str
    text: str
    voice_id: str

# === MULTIPLAYER SESSION ENDPOINTS ===

@router.post("/create-session")
async def create_session(request: CreateSessionRequest) -> Dict[str, Any]:
    """🎮 Create new multiplayer D&D session with AI companions"""
    
    try:
        # Create session
        session_data = create_multiplayer_session(
            human_player_name=request.player_name,
            voice_mode=request.voice_mode
        )
        
        # Generate voice for opening scene if voice mode enabled
        if request.voice_mode:
            opening_scene = session_data["opening_scene"]
            voice_result = await create_voice_direct(
                text=opening_scene["description"] + " " + opening_scene["dm_welcome"],
                character_type="dm_narrator"
            )
            
            if voice_result.get("success"):
                session_data["opening_scene"]["audio_file"] = voice_result.get("audio_url")
                session_data["opening_scene"]["voice_ready"] = True
        
        return {
            "success": True,
            "message": "Multiplayer D&D session created successfully!",
            "session": session_data,
            "hackathon_feature": "🎮 AI Multiplayer D&D with Voice Acting",
            "sponsor_integration": "MiniMax Speech-02-HD",
            "prize_qualification": "$2,750 + Ray-Ban glasses"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

@router.get("/session/{session_id}")
async def get_session(session_id: str) -> Dict[str, Any]:
    """📊 Get current session information"""
    
    session_info = get_session_info(session_id)
    if not session_info:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {
        "success": True,
        "session": session_info,
        "multiplayer_active": True
    }

@router.post("/player-action")
async def player_action(
    request: PlayerActionRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """⚔️ Process player action and generate AI companion responses"""
    
    try:
        print(f"🔍 Processing action: {request.session_id}, {request.player_name}, {request.action}")
        
        # Validate session exists first
        session_info = get_session_info(request.session_id)
        if not session_info:
            print(f"❌ Session not found: {request.session_id}")
            raise HTTPException(status_code=404, detail=f"Session {request.session_id} not found")
        
        print(f"✅ Session found: {session_info['session_id']}")
        
        # Process player turn and get AI responses
        turn_result = process_player_turn(
            session_id=request.session_id,
            player_name=request.player_name,
            action=request.action,
            dialogue=request.dialogue
        )
        
        print(f"🎲 Turn result keys: {turn_result.keys() if isinstance(turn_result, dict) else 'Not a dict'}")
        
        if "error" in turn_result:
            print(f"❌ Turn processing error: {turn_result['error']}")
            raise HTTPException(status_code=404, detail=turn_result["error"])
        
        # Generate voice for AI responses if voice mode enabled
        if request.generate_voice:
            print(f"🎤 Generating voice for responses...")
            
            # Generate voice for DM response
            dm_response = turn_result.get("dm_response", {})
            if dm_response.get("dm_narration"):
                print(f"🎭 Generating DM voice...")
                voice_result = await create_voice_direct(
                    text=dm_response["dm_narration"],
                    character_type="dm_narrator"
                )
                if voice_result.get("success"):
                    turn_result["dm_response"]["audio_file"] = voice_result.get("audio_url")
                    print(f"✅ DM voice generated: {voice_result.get('audio_url')}")
            
            # Generate voices for AI player responses
            ai_responses = turn_result.get("ai_responses", [])
            for i, ai_response in enumerate(ai_responses):
                if ai_response.get("response"):
                    print(f"🤖 Generating voice for {ai_response.get('player_name', 'Unknown')}")
                    voice_result = await create_voice_direct(
                        text=ai_response["response"],
                        character_type=ai_response.get("voice_id", "dm_narrator")
                    )
                    if voice_result.get("success"):
                        turn_result["ai_responses"][i]["audio_file"] = voice_result.get("audio_url")
                        print(f"✅ Voice generated for {ai_response.get('player_name')}: {voice_result.get('audio_url')}")
        
        print(f"✅ Action processed successfully!")
        
        return {
            "success": True,
            "turn_result": turn_result,
            "voice_generation": "processing" if request.generate_voice else "disabled",
            "multiplayer_feature": "AI companions responding",
            "hackathon_demo": "Real-time voice-enabled D&D"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        print(f"❌ Unexpected error in player_action: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process action: {str(e)}")

@router.get("/ai-players")
async def get_ai_party_members() -> Dict[str, Any]:
    """🤖 Get available AI party members"""
    
    ai_players = get_ai_players()
    
    formatted_players = []
    for player in ai_players:
        formatted_players.append({
            "name": player.name,
            "class": player.player_class.value,
            "personality": player.personality.value,
            "voice_id": player.voice_id,
            "voice_description": player.voice_description,
            "level": player.level,
            "hp": f"{player.hp}/{player.max_hp}",
            "weapons": player.weapons,
            "personality_traits": player.personality_traits,
            "combat_style": player.combat_style,
            "roleplay_style": player.roleplay_style
        })
    
    return {
        "success": True,
        "ai_players": formatted_players,
        "total_companions": len(formatted_players),
        "multiplayer_feature": "AI Companion System",
        "voice_integration": "Each AI has unique voice and personality"
    }

@router.post("/generate-ai-response")
async def generate_ai_response(
    session_id: str,
    ai_player_name: str,
    situation: str,
    generate_voice: bool = True
) -> Dict[str, Any]:
    """🎭 Generate AI player response to situation"""
    
    try:
        # Generate AI response
        ai_response = generate_ai_player_response(
            player_name=ai_player_name,
            situation=situation,
            context=""
        )
        
        # Generate voice if requested
        if generate_voice and ai_response.get("response"):
            voice_result = await create_voice_direct(
                text=ai_response["response"],
                character_type=ai_response.get("voice_id", "dm_narrator")
            )
            
            if voice_result.get("success"):
                ai_response["audio_file"] = voice_result.get("audio_url")
                ai_response["voice_ready"] = True
        
        return {
            "success": True,
            "ai_response": ai_response,
            "voice_generated": generate_voice and ai_response.get("voice_ready", False)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate AI response: {str(e)}")

# === VOICE INTEGRATION ENDPOINTS ===

@router.post("/generate-voice")
async def generate_voice_for_text(request: VoiceGenerationRequest) -> Dict[str, Any]:
    """🎤 Generate voice for specific text and character"""
    
    try:
        voice_result = await create_voice_direct(
            text=request.text,
            character_type=request.voice_id
        )
        
        return {
            "success": voice_result.get("success", False),
            "voice_result": voice_result,
            "session_id": request.session_id,
            "player_name": request.player_name,
            "hackathon_feature": "MiniMax Voice Generation",
            "sponsor": "MiniMax Speech-02-HD"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice generation failed: {str(e)}")

@router.get("/voice-test/{character_type}")
async def test_character_voice(character_type: str) -> Dict[str, Any]:
    """🎭 Test specific character voice"""
    
    test_phrases = {
        "dm_narrator": "Welcome brave adventurers! Your epic quest awaits in the depths of the ancient dungeon!",
        "dwarf_warrior": "By me beard! I'll smash any foe that stands in our way! Let's show 'em what we're made of!",
        "elf_mage": "The arcane energies flow through this place... I sense ancient magic and hidden secrets await us.",
        "human_rogue": "Well, this looks suspiciously like a trap. Good thing I brought my lucky lockpicks and charm!",
        "wise_elder": "Patience, young ones. Wisdom teaches us that careful observation often reveals the safest path forward.",
        "dragon": "Foolish mortals... You dare enter my domain? Your treasures will make fine additions to my hoard!",
        "fairy_companion": "Oh my! This place is simply magical! I can feel the enchantments dancing in the air around us!",
        "orc_villain": "GRAAHHH! You will pay for your interference! Prepare to face the wrath of the Iron Clan!"
    }
    
    test_text = test_phrases.get(character_type, "Hello adventurers! This is a voice test.")
    
    try:
        voice_result = await create_voice_direct(
            text=test_text,
            character_type=character_type
        )
        
        return {
            "success": voice_result.get("success", False),
            "character_type": character_type,
            "test_text": test_text,
            "voice_result": voice_result,
            "voice_test": "Complete"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Voice test failed: {str(e)}")

# === SESSION MANAGEMENT ENDPOINTS ===

@router.get("/active-sessions")
async def get_active_sessions() -> Dict[str, Any]:
    """📋 Get all active multiplayer sessions"""
    
    sessions = []
    for session_id, session in multiplayer_manager.active_sessions.items():
        sessions.append({
            "session_id": session_id,
            "human_player": session.human_player_name,
            "party_size": len(session.ai_players) + 1,
            "current_turn": session.turn_order[session.current_turn_index] if session.turn_order else "Unknown",
            "total_turns": session.total_turns,
            "voice_mode": session.voice_mode,
            "campaign_title": session.campaign_title,
            "created_at": session.created_at.isoformat()
        })
    
    return {
        "success": True,
        "active_sessions": sessions,
        "total_sessions": len(sessions),
        "multiplayer_system": "Active"
    }

@router.post("/session/{session_id}/toggle-voice")
async def toggle_voice_mode(session_id: str) -> Dict[str, Any]:
    """🔊 Toggle voice mode for session"""
    
    session = multiplayer_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.voice_mode = not session.voice_mode
    
    return {
        "success": True,
        "session_id": session_id,
        "voice_mode": session.voice_mode,
        "message": f"Voice mode {'enabled' if session.voice_mode else 'disabled'}"
    }

@router.delete("/session/{session_id}")
async def end_session(session_id: str) -> Dict[str, Any]:
    """🏁 End multiplayer session"""
    
    if session_id in multiplayer_manager.active_sessions:
        session = multiplayer_manager.active_sessions[session_id]
        del multiplayer_manager.active_sessions[session_id]
        
        return {
            "success": True,
            "message": f"Session {session_id} ended successfully",
            "final_stats": {
                "total_turns": session.total_turns,
                "duration": str(session.created_at),
                "party_members": len(session.ai_players) + 1
            }
        }
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@router.get("/debug/sessions")
async def debug_active_sessions() -> Dict[str, Any]:
    """🔍 Debug endpoint to see all active sessions"""
    
    try:
        active_sessions = {}
        for session_id, session in multiplayer_manager.active_sessions.items():
            active_sessions[session_id] = {
                "session_id": session.session_id,
                "human_player": session.human_player_name,
                "party_size": len(session.ai_players) + 1,
                "turn_order": session.turn_order,
                "current_turn_index": session.current_turn_index,
                "current_turn": session.turn_order[session.current_turn_index] if session.turn_order else "Unknown",
                "total_turns": session.total_turns,
                "voice_mode": session.voice_mode,
                "created_at": session.created_at.isoformat(),
                "session_state": session.session_state.value if hasattr(session.session_state, 'value') else str(session.session_state)
            }
        
        return {
            "success": True,
            "total_sessions": len(active_sessions),
            "active_sessions": active_sessions,
            "debug_info": "Use this to check if sessions are being stored correctly"
        }
        
    except Exception as e:
        print(f"❌ Debug sessions error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

# === UTILITY FUNCTIONS ===

async def generate_voice_for_response(
    text: str,
    voice_id: str,
    session_id: str,
    speaker_name: str
) -> None:
    """Background task to generate voice for responses"""
    try:
        voice_result = await create_voice_direct(text=text, character_type=voice_id)
        # Store voice result for retrieval (could be enhanced with caching)
        if voice_result.get("success"):
            print(f"✅ Voice generated for {speaker_name} in session {session_id}")
    except Exception as e:
        print(f"❌ Voice generation failed for {speaker_name}: {str(e)}")

# === DEMO ENDPOINTS ===

@router.post("/demo/quick-session")
async def create_demo_session() -> Dict[str, Any]:
    """🎯 Create quick demo session for hackathon demonstration"""
    
    demo_session = create_multiplayer_session(
        human_player_name="Demo Adventurer",
        voice_mode=True
    )
    
    # Generate sample interaction
    sample_action = process_player_turn(
        session_id=demo_session["session_id"],
        player_name="Demo Adventurer",
        action="investigate",
        dialogue="I want to examine the ancient runes on the cave entrance."
    )
    
    return {
        "success": True,
        "demo_session": demo_session,
        "sample_interaction": sample_action,
        "hackathon_demo": "Complete AI D&D Multiplayer System",
        "sponsor_features": {
            "minimax_voices": "✅ 8 Unique Character Voices",
            "ai_players": "✅ 4 AI Companions with Personalities",
            "voice_mode": "✅ Real-time Voice Acting",
            "multiplayer": "✅ Turn-based Gameplay"
        },
        "prize_target": "$2,750 + Ray-Ban glasses (MiniMax)"
    } 