require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  REST,
  Routes,
  SlashCommandBuilder,
  ActivityType,
} = require("discord.js");

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHAT_API_URL = process.env.CHAT_API_URL;
const CHAT_API_KEY = process.env.CHAT_API_KEY;

const MEMORY_LIMIT = 12; // har user ki kitni baatein yaad rakhein
const MEMORY_TTL_MS = 2 * 60 * 60 * 1000; // 2 ghante baad memory reset

if (!DISCORD_BOT_TOKEN || !CHAT_API_URL || !CHAT_API_KEY) {
  console.error("Missing env vars! DISCORD_BOT_TOKEN, CHAT_API_URL aur CHAT_API_KEY sab chahiye.");
  process.exit(1);
}

// ---- Memory (per user, per server) ----
const memory = new Map(); // key: `${guildId}:${userId}` -> { lastUsed, history: [] }

function getMemory(key) {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() - entry.lastUsed > MEMORY_TTL_MS) {
    memory.delete(key);
    return null;
  }
  return entry;
}

function pushMemory(key, role, content) {
  let entry = getMemory(key) || { lastUsed: Date.now(), history: [] };
  entry.lastUsed = Date.now();
  entry.history.push({ role, content });
  if (entry.history.length > MEMORY_LIMIT) {
    entry.history = entry.history.slice(-MEMORY_LIMIT);
  }
  memory.set(key, entry);
}

// ---- AI call ----
async function askAI(userMessage, history) {
  const body = JSON.stringify({
    message: userMessage,
    conversationHistory: history,
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CHAT_API_KEY}`,
          "Content-Type": "application/json",
        },
        body,
      });

      if (res.status === 429 && attempt < 3) {
        console.warn("Rate limited, retrying in 3s...");
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }

      if (!res.ok) {
        const text = await res.text();
        console.error("AI error:", res.status, text);
        return "Abhi busy hoon, thodi der baad try karo! 🙈";
      }

      const data = await res.json();
      return data.reply || "Samajh nahi aaya, dobara bol! 🤔";
    } catch (err) {
      console.error("AI request failed:", err);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return "Kuch gadbad ho gayi! Dobara try karo! 😬";
    }
  }
}

// ---- Discord client ----
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.once("ready", async () => {
  console.log(`✅ Jodians online as ${client.user.tag}`);
  client.user.setPresence({
    status: "online",
    activities: [{ name: "Roman Urdu baatein 🤖", type: ActivityType.Listening }],
  });

  // Register /ask slash command (global)
  try {
    const rest = new REST().setToken(DISCORD_BOT_TOKEN);
    const commands = [
      new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Jodians se kuch bhi poocho!")
        .addStringOption((opt) =>
          opt.setName("message").setDescription("Apna sawaal likhein").setRequired(true)
        )
        .toJSON(),
    ];
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ /ask command registered");
  } catch (err) {
    console.error("Command registration failed:", err);
  }
});

// ---- Mention / reply handling ----
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  const isMention = msg.mentions.has(client.user);
  const isReplyToBot =
    msg.reference &&
    (await msg.fetchReference().catch(() => null))?.author?.id === client.user.id;

  if (!isMention && !isReplyToBot) return;

  let content = msg.content.replace(/<@!?&?\d+>/g, "").trim();
  if (!content) content = "Salam! Kya haal hai?";

  const memKey = `${msg.guildId || "dm"}:${msg.author.id}`;
  const entry = getMemory(memKey);
  const history = entry ? entry.history : [];

  // Typing indicator chalu rakho jab tak jawab na aaye
  const typing = setInterval(() => {
    if (msg.channel && msg.channel.sendTyping) msg.channel.sendTyping().catch(() => {});
  }, 5000);
  msg.channel.sendTyping().catch(() => {});

  try {
    const reply = await askAI(`${msg.author.username} ne pucha: ${content}`, history);
    pushMemory(memKey, "user", content);
    pushMemory(memKey, "assistant", reply);

    await msg.reply(reply.slice(0, 2000));
  } catch (err) {
    console.error("Message handling error:", err);
    await msg.reply("Kuch gadbad ho gayi! Dobara try karo! 😬").catch(() => {});
  } finally {
    clearInterval(typing);
  }
});

// ---- /ask slash command ----
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "ask") return;

  const userMessage = interaction.options.getString("message") || "Kya haal hai?";
  await interaction.deferReply();

  const memKey = `${interaction.guildId || "dm"}:${interaction.user.id}`;
  const entry = getMemory(memKey);
  const history = entry ? entry.history : [];

  try {
    const reply = await askAI(`${interaction.user.username} ne pucha: ${userMessage}`, history);
    pushMemory(memKey, "user", userMessage);
    pushMemory(memKey, "assistant", reply);

    await interaction.editReply(reply.slice(0, 2000));
  } catch (err) {
    console.error("Interaction error:", err);
    await interaction.editReply("Kuch gadbad ho gayi! Dobara try karo! 😬");
  }
});

client.login(DISCORD_BOT_TOKEN);
