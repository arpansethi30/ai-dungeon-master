#!/bin/bash

# AI Dungeon Master - Environment Setup Script
# Run this script to set up your environment variables

echo "🎮 Chronicles of AI - Environment Setup"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    exit 1
fi

echo ""
echo "📝 Setting up environment variables..."
echo ""

# Create .env file
cat > .env << 'EOF'
# AI DUNGEON MASTER - HACKATHON CONFIGURATION

# MANDATORY: Anthropic Claude (Required for hackathon)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 🏆 MiniMax Audio Integration ($2,750 cash prize + Ray-Ban glasses)
# GET YOUR API KEYS: https://www.minimax.chat/ or https://platform.minimaxi.com/
MINIMAX_API_KEY=your_actual_minimax_api_key
MINIMAX_GROUP_ID=your_actual_group_id
MINIMAX_API_HOST=https://api.minimaxi.chat
MINIMAX_MCP_BASE_PATH=/tmp/dnd_audio

# 🏆 Apify Integration ($1,000 cash prize)
APIFY_API_TOKEN=your_apify_api_token_here

# Application Settings
DEBUG=True
HOST=127.0.0.1
PORT=8000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=sqlite:///./dungeon_master.db
SECRET_KEY=hackathon_secret_key_2024
LOG_LEVEL=INFO
EOF

echo "✅ Created .env file with template"
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Edit the .env file and replace the placeholder values:"
echo "   - MINIMAX_API_KEY=your_actual_api_key"
echo "   - MINIMAX_GROUP_ID=your_actual_group_id"
echo ""
echo "2. Get your MiniMax API keys from:"
echo "   https://www.minimax.chat/"
echo "   or https://platform.minimaxi.com/"
echo ""
echo "3. Then restart the server:"
echo "   python main.py"
echo ""
echo "🎯 Prize target: $2,750 + Ray-Ban glasses from MiniMax!"
echo ""

# Make audio directory
mkdir -p /tmp/dnd_audio
echo "✅ Created audio directory: /tmp/dnd_audio"

echo ""
echo "🚀 Setup complete! Now edit .env with your actual API keys." 