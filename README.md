# Jodians Discord Bot 🤖

Roman Urdu AI bot — mention karo ya reply karo, hamesha online (green dot), yaad-dasht ke saath.

## Kya kya karta hai
- ✅ **@Jodians** mention karo → jawab deta hai (bina /ask ke)
- ✅ Bot ke jawab pe **reply** karo → conversation continue karta hai
- ✅ **/ask message:...** slash command bhi chalta hai
- ✅ Har user ki **memory** (last 12 messages, 2 ghante tak)
- ✅ 24/7 online + green dot 🟢
- ✅ Typing indicator jab AI soch raha ho

## Setup (Railway pe) — step by step

### Step 1: Discord Developer Portal settings check karo
1. https://discord.com/developers/applications → apni app kholo
2. **Bot** page pe jao → neeche **"Message Content Intent"** ko **ON** karo (zaroori hai!)
3. Bot token copy karo ("Reset Token" dabao agar naya chahiye)

### Step 2: Railway pe deploy karo
1. https://railway.com pe jao → GitHub se login karo
2. **"New Project"** → **"Deploy from GitHub repo"**
3. Is bot ka code GitHub pe ek naya repo mein upload karo (files: `index.js`, `package.json`, `.env.example` — `.env` upload mat karna)
4. Railway project kholo → **"Variables"** tab → yeh 3 variables add karo:
   - `DISCORD_BOT_TOKEN` = apna bot token
   - `CHAT_API_URL` = `https://ixfsgeigcwracirmrqxc.supabase.co/functions/v1/discord-chat`
   - `CHAT_API_KEY` = `.env.example` mein jo key likhi hai wahi
5. **"Settings"** → Root Directory blank chhor do → Railway khud deploy kar dega

### Step 3: Bot ko server mein dalo
1. Discord Developer Portal → **OAuth2** → **URL Generator**
2. Scopes: `bot` + `applications.commands`
3. Permissions: `Send Messages`, `Read Message History`, `Read Messages/View Channels`
4. URL copy karo → browser mein kholo → apne server mein add karo

### Step 4: Test karo 🎉
- Server mein `@Jodians salam` likho → bot typing dikhayega aur jawab dega
- Us jawab pe reply karo → yaad rakhega conversation
- Green dot 🟢 bot ke dp pe dikhega

## Local test (optional)
```bash
npm install
cp .env.example .env   # .env mein apna token dalo
npm start
```

## Notes
- Railway free tier pe thodi si credit milti hai; khatam hone ke baad chhota sa plan lena padega ($5/month) taake bot 24/7 chalta rahe
- Bot AI ke liye Lovable ke backend ko call karta hai — koi extra AI key nahi chahiye
- Agar bot offline dikhe to Railway dashboard pe logs check karo
