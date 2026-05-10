# Upwork Proposal Bot

Monitors Upwork for relevant jobs, AI-screens them, writes personalized
proposals, and sends them to your Telegram for one-click copy-paste.

## How it works

```
Poll Upwork RSS / API
→ Deduplicate (SQLite)
→ Budget filter
→ Claude Haiku pre-screen (fit score ≥ 6 ?)
→ Claude Sonnet proposal generation
→ Save markdown + Telegram alert
→ You review and copy-paste into Upwork
```

## AI Model Strategy

| Model | Role | Cost per job |
|---|---|---|
| claude-haiku-4-5-20251001 | Fast qualifier | ~$0.001 |
| claude-sonnet-4-6 | Proposal writer | ~$0.03–0.05 |

Only jobs that pass Haiku screening get sent to Sonnet —
keeping costs low while maintaining proposal quality.

## Setup

```bash
# 1. Clone
git clone https://github.com/yuvraj-xyz/upwork-proposal-bot
cd upwork-proposal-bot

# 2. Install
npm install

# 3. Configure — either run interactive setup:
npm run setup

# Or manually copy and fill .env:
cp .env.example .env
# Edit .env with your keys

# 4. Configure your freelancer profile
cp config.example.json config.json
# Edit config.json with your name, tagline, keywords, and portfolio URLs

# 5. Run
npm start
```

## API Keys Needed

| Key | Required | Get it at |
|---|---|---|
| ANTHROPIC_API_KEY | ✅ Yes | console.anthropic.com |
| TELEGRAM_BOT_TOKEN | ✅ Yes | @BotFather on Telegram |
| TELEGRAM_CHAT_ID | ✅ Yes | @userinfobot on Telegram |
| UPWORK_CLIENT_ID/SECRET | ✅ Yes | upwork.com/developer/portal |
| UPWORK_ACCESS/REFRESH_TOKEN | ✅ Yes | Generated after OAuth flow |

**Note:** While awaiting Upwork API OAuth approval, the bot runs on
RSS feeds (limited data but functional).

## Tech Stack

- TypeScript + Node.js
- Anthropic Claude (Haiku + Sonnet)
- SQLite (deduplication)
- Telegram Bot API
- Upwork RSS / OAuth API

## Current Status

- ✅ Core pipeline built and working
- ✅ RSS feed mode active
- ✅ Upwork OAuth approval needed for full API access

## Built by

Yuvraj
