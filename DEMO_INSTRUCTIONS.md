# 🎮 NeuroDungeon - Demo Instructions

## 🚀 Quick Start Guide

### 1. **Start the Servers**
```bash
# Backend (Terminal 1)
cd backend
source ../venv/bin/activate
python main.py

# Frontend (Terminal 2) 
cd frontend
npm run dev
```

### 2. **Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000
- **API Docs**: http://127.0.0.1:8000/docs

## 🎭 Demo Scenarios

### **Scenario 1: Voice-Acted D&D Experience**

1. **Open the UI** at http://localhost:3000
2. **Click "🎭 Test Voices"** to test MiniMax integration
3. **Select different character voices** (DM, Dwarf, Elf, Dragon, etc.)
4. **Generate voice samples** to hear the audio quality
5. **Create a character** using the "⚔️ Create Character" button
6. **Start chatting** with the AI DM - all responses include voice acting!

**What to Notice:**
- 🎤 **Real-time voice generation** for all DM responses
- 🎭 **8 different D&D character voices** (Dwarf, Elf, Dragon, etc.)
- 🎵 **Professional audio player** with progress bar and controls
- 🤖 **Intelligent voice selection** based on conversation content
- 🏆 **MiniMax Speech-02** integration for $2,750 prize

### **Scenario 2: Agentic AI Dungeon Master**

1. **Create a character** with any race/class combination
2. **Start a conversation** like: "I want to explore the ancient ruins"
3. **Watch the AI autonomously**:
   - Analyze your play style
   - Make intelligent story decisions
   - Adapt tension levels
   - Create immersive narratives
   - Generate voice-acted responses

**What to Notice:**
- 🧠 **Autonomous decision-making** (not just scripted responses)
- 📊 **Player behavior analysis** and adaptation
- ⚖️ **Dynamic tension management**
- 🎯 **Intelligent goal planning**
- 💭 **Proactive story direction**

### **Scenario 3: Complete D&D Game System**

1. **Use the dice roller** (🎲 Roll Dice button)
2. **Try different dice**: d4, d6, d8, d10, d12, d20, custom notation
3. **Test advantage/disadvantage** mechanics
4. **View character sheet** with full D&D stats
5. **Manage equipment** and gold
6. **Experience cinematic interpretations** of dice rolls

**What to Notice:**
- 🎲 **Professional dice engine** with D&D mechanics
- ⚔️ **Complete character system** (12 classes, 9 races)
- 📊 **Real ability scores** with modifiers
- 🎪 **Dramatic roll interpretations**
- 📋 **Full character sheet** display

## 🏆 Prize-Winning Features

### **MiniMax Integration ($2,750 + Ray-Ban Glasses)**
- **Test Endpoint**: `GET /api/minimax/demo`
- **Voice Creation**: `POST /api/minimax/voice/create`
- **Voice Catalog**: `GET /api/minimax/voices`
- **Live Demo**: Click "🎭 Test Voices" in UI

**Key Features:**
- Official Speech-02 API integration
- 8 D&D character voices
- Real-time audio generation
- Professional audio quality (32kHz, 128kbps)

### **Apify Integration ($1,000 Cash)**
- **Test Endpoint**: `GET /api/apify/demo`
- **Scrape Lore**: `POST /api/apify/scrape/lore`
- **Scrape Monsters**: `POST /api/apify/scrape/monsters`

**Key Features:**
- Multi-source D&D content aggregation
- Wikipedia + Reddit + D&D websites
- Automated campaign enhancement
- Professional web scraping

## 🔧 API Configuration

### **For Full Voice Generation**
Add to environment variables:
```bash
export MINIMAX_API_KEY="your_minimax_api_key"
export MINIMAX_GROUP_ID="your_group_id"
```

### **For Web Scraping**
```bash
export APIFY_API_TOKEN="your_apify_token"
```

### **Note**: System works in fallback mode without keys!

## 🎯 Judging Criteria Demonstration

### **Innovation ⭐⭐⭐⭐⭐**
- **Agentic AI**: Autonomous DM with learning and adaptation
- **Voice Acting**: Real character voices for immersive D&D
- **Multi-modal**: Text + Audio + Visual interface
- **Novel Application**: AI-powered tabletop gaming

### **Technical Quality ⭐⭐⭐⭐⭐**
- **Production Ready**: Error handling, logging, testing
- **Modern Stack**: Next.js 15, FastAPI, TypeScript
- **Clean Code**: Modular, documented, professional
- **API Integration**: Official sponsor APIs correctly implemented

### **Sponsor Integration ⭐⭐⭐⭐⭐**
- **MiniMax**: Official Speech-02 API with D&D voices
- **Apify**: Professional web scraping for content
- **Meaningful Usage**: Real features, not token integration
- **Multiple Sponsors**: Qualified for multiple prizes

### **Demo Impact ⭐⭐⭐⭐⭐**
- **Immediate Value**: Working game you can play
- **Professional Polish**: Beautiful UI and smooth UX
- **Clear Innovation**: Obviously advanced and unique
- **Judge Appeal**: Fun to use and technically impressive

## 🎪 Demo Script for Judges

### **Opening (30 seconds)**
"Welcome to NeuroDungeon - the world's first voice-acted AI Dungeon Master! This system uses MiniMax Speech-02 to generate real character voices, and agentic AI to create intelligent, adaptive storytelling."

### **Voice Demo (60 seconds)**
1. Click "🎭 Test Voices"
2. Select "Dragon" voice
3. Type: "I am an ancient dragon guarding my treasure hoard!"
4. Generate and play audio
5. Switch to "Dwarf Warrior" and repeat with dwarf dialogue

### **Gameplay Demo (90 seconds)**
1. Create a character (any race/class)
2. Start conversation: "I enter the mysterious tavern"
3. Show AI response with voice acting
4. Continue: "I want to talk to the bartender"
5. Show intelligent NPC creation and voice selection

### **Technical Demo (30 seconds)**
1. Show API documentation at /docs
2. Highlight MiniMax integration status
3. Show voice catalog and technical details

### **Closing (30 seconds)**
"This demonstrates meaningful integration of multiple sponsor technologies, creating real value for users while showcasing technical excellence. The system is production-ready and demonstrates the future of AI-powered gaming."

## 💻 Technical Architecture

### **Backend (Python FastAPI)**
```
/backend
├── app/
│   ├── models/          # D&D character & campaign models
│   ├── services/        # AI, MiniMax, Apify integrations  
│   ├── api/             # REST API endpoints
│   └── utils/           # Dice engine, helpers
└── main.py             # FastAPI server
```

### **Frontend (Next.js + TypeScript)**
```
/frontend/src
├── app/
│   └── page.tsx        # Main D&D interface with audio
├── components/         # React components
└── styles/            # Tailwind CSS styling
```

### **Key Technologies**
- **AI**: Claude 3.5 Sonnet for agentic intelligence
- **Audio**: MiniMax Speech-02 for voice generation
- **Web Scraping**: Apify for content automation
- **Frontend**: Next.js 15 + TypeScript + Tailwind
- **Backend**: FastAPI + Python 3.12
- **Real-time**: WebSocket-ready architecture

---

**🏆 Ready to win the hackathon with $4,750+ in prizes! 🏆** 