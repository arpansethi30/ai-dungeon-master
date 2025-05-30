#!/usr/bin/env python3
"""
FINAL COMPREHENSIVE TEST: Verify Claude API is working without fallbacks
"""

from dotenv import load_dotenv
load_dotenv()

import os
import asyncio
from anthropic import Anthropic
from datetime import datetime

def test_claude_no_fallbacks():
    """Comprehensive test to ensure Claude is working with NO fallbacks"""
    
    print("🚀 FINAL CLAUDE VERIFICATION TEST")
    print("=" * 60)
    print(f"🕐 Started: {datetime.now()}")
    print()
    
    # 1. API Key Check
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ CRITICAL FAIL: No ANTHROPIC_API_KEY")
        return False
    
    print(f"✅ API Key: {api_key[:8]}...{api_key[-4:]} (masked)")
    
    # 2. Direct API Test
    try:
        client = Anthropic(api_key=api_key)
        
        print("\n🧠 Testing Claude 3.5 Sonnet...")
        response = client.messages.create(
            model="claude-3-5-sonnet-latest",
            max_tokens=150,
            temperature=0.7,
            messages=[{
                "role": "user",
                "content": "You are an AI Dungeon Master. A player says: 'I examine the ancient door for traps.' Respond immersively."
            }]
        )
        
        dm_response = response.content[0].text
        print(f"📨 Claude Response: {dm_response[:200]}...")
        
        if len(dm_response) > 50:
            print("✅ Claude API: WORKING PERFECTLY")
        else:
            print("❌ Claude API: Suspicious short response")
            return False
            
    except Exception as e:
        print(f"❌ Claude API FAILED: {e}")
        return False
    
    # 3. Test Agentic AI System
    try:
        print("\n🤖 Testing Agentic AI System...")
        from app.services.agentic_ai import agentic_dm
        
        if agentic_dm.anthropic is None:
            print("❌ CRITICAL: Agentic AI is in fallback mode!")
            return False
        
        print("✅ Agentic AI: Active Claude connection confirmed")
        
        # Test the full agentic pipeline
        print("\n🎯 Testing Full Agentic Pipeline...")
        
        async def test_agentic_pipeline():
            result = await agentic_dm.process_player_input(
                "I want to explore the mysterious cave.",
                character=None,
                campaign=None
            )
            return result
        
        # Run async test
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        agentic_result = loop.run_until_complete(test_agentic_pipeline())
        loop.close()
        
        if agentic_result and "response" in agentic_result:
            print(f"📨 Agentic Response Preview: {agentic_result['response'][:100]}...")
            print("✅ Full Agentic Pipeline: WORKING")
        else:
            print("❌ Agentic Pipeline: Failed")
            return False
        
    except Exception as e:
        print(f"❌ Agentic AI Test Failed: {e}")
        return False
    
    # 4. Verify No Fallbacks
    print("\n🚫 VERIFYING NO FALLBACKS...")
    
    fallback_indicators = [
        "using fallback",
        "limited mode", 
        "mock response",
        "AI will operate in limited mode"
    ]
    
    response_text = dm_response.lower()
    agentic_text = agentic_result.get('response', '').lower()
    
    fallback_detected = False
    for indicator in fallback_indicators:
        if indicator in response_text or indicator in agentic_text:
            print(f"❌ FALLBACK DETECTED: {indicator}")
            fallback_detected = True
    
    if not fallback_detected:
        print("✅ NO FALLBACKS: Confirmed pure Claude responses")
    
    # 5. Final Results
    print("\n" + "=" * 60)
    print("🏆 FINAL RESULTS")
    print("=" * 60)
    
    success = not fallback_detected
    
    if success:
        print("🎉 SUCCESS! Claude is working perfectly with NO fallbacks!")
        print("🧠 Your AI Dungeon Master is running on full Claude power")
        print("🚀 Agentic AI capabilities: FULLY ENABLED")
        print("⚡ Ready for production use!")
    else:
        print("❌ ISSUES DETECTED: Fix fallbacks before proceeding")
    
    return success

if __name__ == "__main__":
    success = test_claude_no_fallbacks()
    print(f"\n🏁 Test {'PASSED' if success else 'FAILED'}")
    exit(0 if success else 1) 