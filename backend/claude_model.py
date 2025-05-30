import anthropic
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the API key from environment variable
api_key = os.getenv("ANTHROPIC_API_KEY")

if not api_key:
    print("❌ Error: ANTHROPIC_API_KEY not found in environment variables")
    print("Please check your .env file and make sure ANTHROPIC_API_KEY is set")
    exit(1)

# Initialize the client with the API key
client = anthropic.Anthropic(api_key=api_key)

# List available models
try:
    print("🤖 Available Claude Models:")
    print("=" * 40)
    
    models = client.models.list(limit=20)
    
    for model in models.data:
        print(f"📋 Model ID: {model.id}")
        print(f"   Display Name: {model.display_name}")
        print(f"   Type: {model.type}")
        print(f"   Created: {model.created_at}")
        print("-" * 30)
        
except Exception as e:
    print(f"❌ Error listing models: {e}")