#!/usr/bin/env python3
"""Test which Claude models are available in our API account"""

from dotenv import load_dotenv
load_dotenv()

import os
from anthropic import Anthropic

def test_available_models():
    """Test which Claude models we have access to"""
    
    client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    
    models_to_test = [
        'claude-sonnet-4-20250514',
        'claude-opus-4-20250514', 
        'claude-3-7-sonnet-20250219',
        'claude-3-5-sonnet-20241022',
        'claude-3-5-sonnet-latest',
        'claude-3-5-sonnet-20240620',
        'claude-3-opus-20240229'
    ]
    
    print("🧪 TESTING AVAILABLE CLAUDE MODELS")
    print("=" * 50)
    
    available_models = []
    
    for model in models_to_test:
        try:
            print(f'🔍 Testing {model}...')
            response = client.messages.create(
                model=model,
                max_tokens=50,
                messages=[{'role': 'user', 'content': 'What model are you? Be specific.'}]
            )
            model_response = response.content[0].text
            print(f'✅ AVAILABLE: {model}')
            print(f'   Response: {model_response[:100]}...')
            available_models.append(model)
        except Exception as e:
            print(f'❌ NOT AVAILABLE: {model}')
            print(f'   Error: {str(e)[:100]}...')
        print()
    
    print("=" * 50)
    print("📊 SUMMARY")
    print("=" * 50)
    print(f"Available models: {len(available_models)}")
    for model in available_models:
        print(f"✅ {model}")
    
    if not available_models:
        print("❌ No models available!")
    
    return available_models

if __name__ == "__main__":
    available = test_available_models() 