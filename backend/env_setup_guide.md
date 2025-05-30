# 🚀 Chronicles of AI - Environment Setup Guide

## 🏆 HACKATHON SPONSOR API KEYS (Prize Opportunities)

### 🧠 ANTHROPIC CLAUDE (REQUIRED)
**Prize**: Core hackathon requirement
**How to get**:
1. Go to https://console.anthropic.com/
2. Sign up/login
3. Create API key
4. Add to `.env`: `ANTHROPIC_API_KEY=your_key_here`

### 🎤 MiniMax Audio - $2,750 CASH PRIZE
**Prize**: $2,750 cash for best text-to-speech/voice cloning
**How to get**:
1. Go to https://www.minimaxi.com/
2. Register for API access
3. Get your API key and Group ID
4. Add to `.env`:
```
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
```

### 🔐 Auth0 - RAY-BAN META SMART GLASSES
**Prize**: Ray-Ban Meta Smart Glasses
**How to get**:
1. Go to https://auth0.com/
2. Create free account
3. Create new application
4. Get domain, client ID, client secret
5. Add to `.env`:
```
AUTH0_DOMAIN=your_domain.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=your_api_audience
```

### 🌐 Browserbase - RAY-BAN META SMART GLASSES
**Prize**: Ray-Ban Meta Smart Glasses
**How to get**:
1. Go to https://browserbase.com/
2. Sign up for beta access
3. Create project and get API key
4. Add to `.env`:
```
BROWSERBASE_API_KEY=your_browserbase_key
BROWSERBASE_PROJECT_ID=your_project_id
```

### 🔍 Linkup - 10,000 API CALLS
**Prize**: 10,000 API calls
**How to get**:
1. Go to https://linkup.com/
2. Register for API access
3. Get API key
4. Add to `.env`:
```
LINKUP_API_KEY=your_linkup_key
```

### 🕷️ Apify - $1,000 CASH + CREDITS
**Prize**: $1,000 cash + credits
**How to get**:
1. Go to https://apify.com/
2. Create account
3. Go to Settings > Integrations > API tokens
4. Create new token
5. Add to `.env`:
```
APIFY_API_TOKEN=your_apify_token
```

### 🧠 Senso.ai - $1,000 CREDITS
**Prize**: $1,000 credits
**How to get**:
1. Go to https://senso.ai/
2. Sign up for beta
3. Get API key and workspace ID
4. Add to `.env`:
```
SENSO_API_KEY=your_senso_key
SENSO_WORKSPACE_ID=your_workspace_id
```

## 📁 CREATE YOUR .env FILE

Create `backend/.env` file:

```bash
# Copy this into backend/.env
# ================================================================
# CHRONICLES OF AI - AGENTIC D&D SYSTEM
# ================================================================

# CORE AI (REQUIRED)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# HACKATHON SPONSOR APIs
MINIMAX_API_KEY=your_minimax_api_key_here
MINIMAX_GROUP_ID=your_minimax_group_id_here
AUTH0_DOMAIN=your_domain.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
AUTH0_AUDIENCE=your_auth0_audience
BROWSERBASE_API_KEY=your_browserbase_key
BROWSERBASE_PROJECT_ID=your_browserbase_project_id
LINKUP_API_KEY=your_linkup_key
APIFY_API_TOKEN=your_apify_token
SENSO_API_KEY=your_senso_key
SENSO_WORKSPACE_ID=your_senso_workspace_id

# APPLICATION SETTINGS
SECRET_KEY=your_super_secret_jwt_key_here
ENVIRONMENT=development
DEBUG=True
DATABASE_URL=sqlite:///./chronicles_of_ai.db
FRONTEND_URL=http://localhost:3000
```

## 🚀 PRIORITY ORDER FOR HACKATHON

### IMMEDIATE (Get these first):
1. **ANTHROPIC_API_KEY** - Your AI agent won't work without this
2. **MINIMAX_API_KEY** - Highest cash prize ($2,750)
3. **AUTH0 credentials** - Ray-Ban glasses + authentication

### HIGH PRIORITY:
4. **APIFY_API_TOKEN** - $1,000 cash prize
5. **SENSO_API_KEY** - $1,000 credits
6. **LINKUP_API_KEY** - 10,000 API calls

### WHEN TIME PERMITS:
7. **BROWSERBASE_API_KEY** - Ray-Ban glasses but more complex integration

## 🎯 TOTAL PRIZE VALUE: ~$15,000+

**Cash Prizes**: $3,750
**Ray-Ban Glasses**: ~$300 x 2 = $600  
**API Credits**: ~$11,000+ value

## ⚡ QUICK START

1. **Start with Anthropic**: Get your AI working immediately
2. **Add MiniMax**: Voice-acted NPCs = biggest cash prize
3. **Integrate Auth0**: Multi-player authentication
4. **Add remaining APIs**: Maximize prize potential

Your agentic AI system is already built - now just connect the APIs! 🚀 