#!/usr/bin/env python3
"""
Test script to verify Claude 4 (Anthropic API) is working without fallbacks
"""

import os
import sys
from anthropic import Anthropic
from datetime import datetime

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("🔧 Loaded environment variables from .env file")
except ImportError:
    print("⚠️ python-dotenv not available, relying on system environment")

def test_claude4_connection():
    """Test Claude 4 API connection and ensure no fallbacks"""
    
    print("🧪 TESTING CLAUDE 4 API CONNECTION")
    print("=" * 50)
    
    # 1. Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    print(f"📋 API Key Status: {'✅ Found' if api_key else '❌ Missing'}")
    
    if not api_key:
        print("❌ FAIL: No ANTHROPIC_API_KEY found in environment")
        print("💡 Solution: Set your API key with: export ANTHROPIC_API_KEY=your_key_here")
        return False
    
    if api_key == "your_anthropic_api_key_here":
        print("❌ FAIL: API key is still placeholder value")
        print("💡 Solution: Replace with your real Anthropic API key")
        return False
    
    print(f"📋 API Key: {api_key[:8]}...{api_key[-4:]} (masked)")
    
    # 2. Test API connection
    try:
        print("\n🔗 Testing API Connection...")
        client = Anthropic(api_key=api_key)
        
        # 3. Test Claude 4 model specifically
        print("🧠 Testing Claude 4 Model...")
        response = client.messages.create(
            model="claude-sonnet-4-20250514",  # Claude 4 Sonnet (correct model name)
            max_tokens=100,
            temperature=0.3,
            messages=[{
                "role": "user", 
                "content": "Respond with exactly: 'Claude 4 is working perfectly! No fallbacks needed.'"
            }]
        )
        
        response_text = response.content[0].text
        print(f"📨 Claude 4 Response: {response_text}")
        
        # 4. Verify it's actually Claude 4 (not a fallback)
        if "Claude 4 is working perfectly" in response_text:
            print("✅ SUCCESS: Claude 4 is working correctly!")
            print("✅ NO FALLBACKS: API is responding as expected")
            
            # 5. Test advanced reasoning
            print("\n🧠 Testing Advanced Reasoning...")
            reasoning_response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=200,
                temperature=0.7,
                messages=[{
                    "role": "user",
                    "content": "You are an AI Dungeon Master. Analyze this player action: 'I carefully examine the ancient rune-covered door for traps.' Provide a detailed, immersive response."
                }]
            )
            
            reasoning_text = reasoning_response.content[0].text
            print(f"🎯 Advanced Response Preview: {reasoning_text[:150]}...")
            
            if len(reasoning_text) > 50:
                print("✅ ADVANCED REASONING: Working correctly")
                return True
            else:
                print("⚠️ WARNING: Response seems too short")
                return False
        else:
            print("❌ FAIL: Unexpected response from API")
            return False
            
    except Exception as e:
        print(f"❌ FAIL: API Error - {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("1. Check your API key is valid")
        print("2. Verify internet connection")
        print("3. Check if you have API credits")
        print("4. Try: pip install anthropic --upgrade")
        return False

def test_no_fallbacks():
    """Ensure the system doesn't fall back to mock responses"""
    
    print("\n🚫 TESTING NO FALLBACKS")
    print("=" * 30)
    
    # Import and test the agentic AI
    try:
        from app.services.agentic_ai import agentic_dm
        
        # Check if Claude is initialized
        if agentic_dm.anthropic is None:
            print("❌ FAIL: Agentic AI is using fallback mode")
            print("💡 This means your API key isn't working")
            return False
        else:
            print("✅ SUCCESS: Agentic AI has active Claude connection")
            return True
            
    except Exception as e:
        print(f"❌ FAIL: Could not import agentic AI - {str(e)}")
        return False

def main():
    """Main test function"""
    
    print(f"🕐 Test started at: {datetime.now()}")
    print(f"🐍 Python version: {sys.version}")
    
    # Run tests
    claude_test = test_claude4_connection()
    fallback_test = test_no_fallbacks()
    
    print("\n" + "=" * 50)
    print("📊 FINAL RESULTS")
    print("=" * 50)
    print(f"Claude 4 API: {'✅ WORKING' if claude_test else '❌ FAILED'}")
    print(f"No Fallbacks: {'✅ CONFIRMED' if fallback_test else '❌ USING FALLBACKS'}")
    
    if claude_test and fallback_test:
        print("\n🎉 ALL TESTS PASSED!")
        print("🚀 Your AI Dungeon Master is running on full Claude 4 power!")
        print("🧠 Agentic AI capabilities: ENABLED")
        return True
    else:
        print("\n❌ TESTS FAILED!")
        print("🔧 Fix the issues above before continuing")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 