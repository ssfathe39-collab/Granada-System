try {
  require("dotenv").config();
  console.log("✅ تم تحميل متغيرات .env إن وجدت.");
} catch (error) {
  console.log(
    "ℹ️ dotenv غير مثبتة — سيتم استخدام Environment Variables / Replit Secrets."
  );
}

const keepAlive = require("./keepAlive");

const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  enterState,
} = require("@discordjs/voice");

const ms = require("ms");
const fs = require("fs");

// ============================================================
// Discord Client
// ============================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// ============================================================
// CONFIG
// ============================================================

const CONFIG = {
  TOKEN: process.env.TOKEN || process.env.Granada_token,
  GRANADA_VOICE_CHANNEL_ID: "1442200304853582005",
  REMINDER_CHANNEL_ID: "1442605140405256383",
  WELCOME_CHANNEL_ID: "1442200304522104929",
  WELCOME_IMAGE_URL:
    "https://cdn.discordapp.com/attachments/1442200304522104929/1534267076380721355/welcome.png",

  JAIL_ROLE_ID: "1513691033815220334",

  ROLES: {
    BAN: [
      "1496228340657557544",
      "1496228628764299494",
      "1508130522377752677",
      "1508130937819500635",
      "1497983638200123552",
      "1497985358955024514",
      "1496230091812901026",
    ],
    UNBAN: [
      "1496228340657557544",
      "1496228628764299494",
      "1508130522377752677",
      "1508130937819500635",
      "1497983638200123552",
      "1497985358955024514",
      "1496230091812901026",
    ],
    KICK: [
      "1496228340657557544",
      "1496228628764299494",
      "1508130522377752677",
      "1508130937819500635",
      "1497983638200123552",
      "1497985358955024514",
      "1496230091812901026",
    ],
    TIMEOUT: [
      "1497982922110664855",
      "1508120185666670752",
      "1497983403251728616",
      "1497984406726512740",
      "1497985358955024514",
    ],
    ROLES_MANAGEMENT: [
      "1508130937819500635",
      "1497983638200123552",
      "1497964133797199921",
      "1497985358955024514",
      "1496230091812901026",
    ],
    CHANNEL_MANAGEMENT: [
      "1508130937819500635",
      "1497983638200123552",
      "1497964133797199921",
      "1497985358955024514",
      "1496230091812901026",
    ],
    WARNS: [
      "1497982922110664855",
      "1508120185666670752",
      "1497983403251728616",
      "1497984406726512740",
      "1508130937819500635",
      "1497983638200123552",
      "1497985358955024514",
      "1496230091812901026",
    ],
    NICKNAME: [
      "1500537635125329920",
      "1496228439840002099",
      "1497980636831420597",
      "1497984406726512740",
      "1496228340657557544",
      "1496228628764299494",
      "1508130522377752677",
      "1508130937819500635",
      "1497983638200123552",
      "1497964133797199921",
      "1497985358955024514",
    ],
    JAIL: [
      "1508130937819500635",
      "1497983638200123552",
      "1497964133797199921",
      "1497985358955024514",
      "1496230091812901026",
    ],
    GIVEAWAY: [
      "1508130937819500635",
      "1497983638200123552",
      "1497964133797199921",
      "1497985358955024514",
      "1496230091812901026",
    ],
  },

  VOICE_BOTS: [
    { token: process.env.VOICE_BOT_1_TOKEN, channelId: "1442200304853582006", nickname: "قرطبة" },
    { token: process.env.VOICE_BOT_2_TOKEN, channelId: "1459647452151021746", nickname: "العامرية" },
    { token: process.env.VOICE_BOT_3_TOKEN, channelId: "1459647526331486465", nickname: "طريف" },
    { token: process.env.VOICE_BOT_4_TOKEN, channelId: "1459648205472927775", nickname: "قادش" },
  ],
};

if (!CONFIG.TOKEN) {
  console.error("\n❌❌❌ خطأ: لم يتم العثور على TOKEN ❌❌❌\n");
  process.exit(1);
}

// ============================================================
// البيانات المساعدة
// ============================================================

let warnings = loadData("./warnings.json", {});
let tempRoles = loadData("./tempRoles.json", []);
let tempBans = loadData("./tempBans.json", []);
let jailedUsers = loadData("./jailedUsers.json", {});
let userMsgCount = loadData("./userMsgCount.json", {});
let giveaways = loadData("./giveaways.json", {});
let linkViolations = {};

function loadData(path, fallback = {}) {
  try {
    if (fs.existsSync(path)) return JSON.parse(fs.readFileSync(path, "utf8"));
  } catch (error) {
    console.error(`❌ خطأ في قراءة الملف ${path}:`, error.message);
  }
  return fallback;
}

function saveData(path, data) {
  try {
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error(`❌ خطأ في حفظ الملف ${path}:`, error.message);
  }
}

function generateCode() {
  return Math.random().toString(36).substring(2, 7).toUpperCase();
}

// ============================================================
// Voice Channel Handler
// ============================================================

async function connectVoiceBot(botConfig, isMainBot = false, customClient = null) {
  const activeClient = customClient || client;
  try {
    const channel = await activeClient.channels.fetch(botConfig.channelId).catch(() => null);
    if (!channel) return;

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });

    connection.on("error", (error) => {
      console.error(`⚠️ خطأ في الاتصال الصوتي لـ [${botConfig.nickname}]:`, error.message);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          enterState(connection, VoiceConnectionStatus.Signalling, 5_000),
          enterState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (error) {
        connection.destroy();
        setTimeout(() => connectVoiceBot(botConfig, isMainBot, activeClient), 10000);
      }
    });

    console.log(`🔊 [${botConfig.nickname}] متصل بنجاح في روم الصوت: ${channel.name}`);
  } catch (error) {
    console.error(`❌ خطأ أثناء الاتصال بالصوت لـ [${botConfig.nickname}]:`, error.message);
  }
}

function startVoiceBots() {
  CONFIG.VOICE_BOTS.forEach((botData) => {
    if (!botData.token) return;

    const subClient = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
    });

    subClient.once("ready", async () => {
      console.log(`🤖 بوت الصوت الفرعي جاهز: ${subClient.user.tag} (${botData.nickname})`);
      await connectVoiceBot(botData, false, subClient);
    });

    subClient.login(botData.token).catch((err) => {
      console.error(`❌ فشل تسجيل دخول البوت الفرعي (${botData.nickname}):`, err.message);
    });
  });
}

function checkTempRoles() {
  setInterval(async () => {
    const now = Date.now();
    for (let i = tempRoles.length - 1; i >= 0; i--) {
      const item = tempRoles[i];
      if (now >= item.expireAt) {
        try {
          const guild = client.guilds.cache.get(item.guildId);
          if (guild) {
            const member = await guild.members.fetch(item.userId).catch(() => null);
            if (member) await member.roles.remove(item.roleId).catch(() => null);
          }
        } catch (e) {
          console.error("خطأ أثناء سحب الرول المؤقت:", e.message);
        }
        tempRoles.splice(i, 1);
        saveData("./tempRoles.json", tempRoles);
      }
    }
  }, 30000);
}

function checkTempBans() {
  setInterval(async () => {
    const now = Date.now();
    for (let i = tempBans.length - 1; i >= 0; i--) {
      const item = tempBans[i];
      if (now >= item.expireAt) {
        try {
          const guild = client.guilds.cache.get(item.guildId);
          if (guild) {
            await guild.bans.remove(item.userId).catch(() => null);
          }
        } catch (e) {
          console.error("خطأ أثناء فك الحظر المؤقت:", e.message);
        }
        tempBans.splice(i, 1);
        saveData("./tempBans.json", tempBans);
      }
    }
  }, 30000);
}

async function endGiveaway(messageId) {
  const gw = giveaways[messageId];
  if (!gw || gw.ended) return;

  gw.ended = true;
  saveData("./giveaways.json", giveaways);

  const channel = await client.channels.fetch(gw.channelId).catch(() => null);
  if (!channel) return;

  const msg = await channel.messages.fetch(messageId).catch(() => null);
  if (!msg) return;

  const entries = gw.entries || [];
  let winners = [];

  if (entries.length > 0) {
    const shuffled = [...entries].sort(() => 0.5 - Math.random());
    winners = shuffled.slice(0, Math.min(gw.winnersCount, entries.length));
  }

  const winnerText = winners.length > 0 ? winners.map((id) => `<@${id}>`).join(", ") : "لا يوجد مشاركين كافيين.";

  const endEmbed = new EmbedBuilder()
    .setTitle("🎉 انـتـهـى الـقـيـف أواي! 🎉")
    .setDescription(`**🎁 الجائزة:** ${gw.prize}\n**👑 الفائزون:** ${winnerText}\n**👥 عدد المشاركين:** ${entries.length}`)
    .setColor("Gold")
    .setTimestamp();

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("gw_ended").setLabel("🎉 انتهى القيف أواي").setStyle(ButtonStyle.Secondary).setDisabled(true)
  );

  await msg.edit({ embeds: [endEmbed], components: [disabledRow] }).catch(() => null);

  const winnerAnnounceEmbed = new EmbedBuilder()
    .setTitle("🎊 نتيجة القيف أواي 🎊")
    .setColor("Gold")
    .setDescription(
      winners.length > 0
        ? `🎉 ألف مبروك للربح معنا!\n\n👑 **الفائزون:** ${winnerText}\n🎁 **الجائزة:** ${gw.prize}`
        : `⚠️ انتهى القيف أواي على **${gw.prize}** ولكن لم يشارك أحد.`
    );

  channel.send({ embeds: [winnerAnnounceEmbed] }).catch(() => null);
}

function checkGiveaways() {
  setInterval(() => {
    const now = Date.now();
    for (const msgId in giveaways) {
      if (!giveaways[msgId].ended && now >= giveaways[msgId].endAt) {
        endGiveaway(msgId);
      }
    }
  }, 10000);
}

// ============================================================
// Permissions & Hierarchy Check
// ============================================================

function hasPermission(member, allowedRoles) {
  if (!member) return false;
  if (member.guild.ownerId === member.id) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  return member.roles.cache.some((role) => allowedRoles.includes(role.id));
}

function canModerateTarget(executor, target) {
  if (!target) return true;
  if (target.id === executor.guild.ownerId) return false;
  if (executor.id === executor.guild.ownerId) return true;
  if (target.id === executor.id) return false;
  
  return executor.roles.highest.position > target.roles.highest.position;
}

// ============================================================
// Slash Commands Registration
// ============================================================

async function registerSlashCommands() {
  const commands = [
    new SlashCommandBuilder().setName("lock").setDescription("قفل الروم الحالي").addChannelOption(o => o.setName("channel").setDescription("الروم المراد قفله")),
    new SlashCommandBuilder().setName("unlock").setDescription("فتح الروم الحالي").addChannelOption(o => o.setName("channel").setDescription("الروم المراد فتحه")),
    new SlashCommandBuilder().setName("ban").setDescription("حظر عضو من السيرفر").addUserOption(o => o.setName("target").setDescription("العضو المراد حظره").setRequired(true)).addStringOption(o => o.setName("duration").setDescription("المدة مثل 1d, 1h (اختياري)")).addStringOption(o => o.setName("reason").setDescription("سبب الحظر")),
    new SlashCommandBuilder().setName("unban").setDescription("فك الحظر عن عضو").addStringOption(o => o.setName("userid").setDescription("آيدي العضو").setRequired(true)),
    new SlashCommandBuilder().setName("kick").setDescription("طرد عضو من السيرفر").addUserOption(o => o.setName("target").setDescription("العضو المراد طرده").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("السبب")),
    new SlashCommandBuilder().setName("timeout").setDescription("إسكات عضو مؤقتاً").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)).addStringOption(o => o.setName("duration").setDescription("المدة مثل 10m, 1h").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("السبب")),
    new SlashCommandBuilder().setName("untimeout").setDescription("إزالة الإسكات عن عضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)),
    new SlashCommandBuilder().setName("serverinfo").setDescription("عرض معلومات السيرفر"),
    new SlashCommandBuilder().setName("role").setDescription("إعطاء رول لعضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("الرول").setRequired(true)),
    new SlashCommandBuilder().setName("removerole").setDescription("سحب رول من عضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("الرول").setRequired(true)),
    new SlashCommandBuilder().setName("warn").setDescription("تحذير عضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("السبب").setRequired(true)),
    new SlashCommandBuilder().setName("unwarn").setDescription("إعفاء من تحذير").addStringOption(o => o.setName("query").setDescription("آيدي العضو أو كود التحذير").setRequired(true)),
    new SlashCommandBuilder().setName("warns").setDescription("عرض التحذيرات").addUserOption(o => o.setName("target").setDescription("العضو (اختياري)")),
    new SlashCommandBuilder().setName("temprole").setDescription("إعطاء رول مؤقت لعضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)).addStringOption(o => o.setName("duration").setDescription("المدة مثل 1d").setRequired(true)).addRoleOption(o => o.setName("role").setDescription("الرول").setRequired(true)),
    new SlashCommandBuilder().setName("nickname").setDescription("تغيير لقب عضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)).addStringOption(o => o.setName("name").setDescription("اللقب الجديد").setRequired(true)),
    new SlashCommandBuilder().setName("top").setDescription("عرض أفضل المتفاعلين"),
    new SlashCommandBuilder().setName("jail").setDescription("سجن عضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)).addStringOption(o => o.setName("reason").setDescription("السبب")),
    new SlashCommandBuilder().setName("unjail").setDescription("فك سجن عضو").addUserOption(o => o.setName("target").setDescription("العضو").setRequired(true)),
    new SlashCommandBuilder().setName("clear").setDescription("مسح الرسائل من الروم").addIntegerOption(o => o.setName("amount").setDescription("عدد الرسائل (1 - 100)").setRequired(true)),
  ];

  const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);
  try {
    console.log("🔄 جاري تسجيل كافة أوامر السلاش...");
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("✅ تم تسجيل أوامر السلاش بنجاح.");
  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل أوامر السلاش:", error);
  }
}

// ============================================================
// READY
// ============================================================

client.once("ready", async () => {
  console.log("\n======================================");
  console.log(`✅ البوت الرئيسي جاهز: ${client.user.tag}`);
  console.log("======================================\n");

  await registerSlashCommands();
  await connectVoiceBot({ channelId: CONFIG.GRANADA_VOICE_CHANNEL_ID, nickname: "غرناطة" }, true, client);

  setInterval(() => {
    const channel = client.channels.cache.get(CONFIG.REMINDER_CHANNEL_ID);
    if (channel) {
      channel.send(
        `قولوا معي:\nسُبْحَانَ اللهِ\nوَالْحَمْدُ لِلّٰهِ\nوَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ\nوَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمِ\nوَاللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ\nكَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلتانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللهِ وَبِحَمْدِهِ، سُبْحَانَ اللهِ الْعَظِيمِ. 🌿❤️`
      ).catch(() => null);
    }
  }, 5 * 60 * 60 * 1000);

  checkTempRoles();
  checkTempBans();
  checkGiveaways();
  startVoiceBots();
});

// ============================================================
// نظام الترحيب
// ============================================================

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xc9a227)
    .setImage(CONFIG.WELCOME_IMAGE_URL)
    .setDescription(`🔥👋🏻 ياهلا والله بيك ${member}\n❤️ نورت السيرفر\n\n📋 اقرأ القوانين\n💬 استمتع معنا في الشات\n\n✨ نتمنى لك وقت ممتع`);

  channel.send({ content: `${member}`, embeds: [embed] }).catch(() => null);
});

// ============================================================
// Interaction Create (Slash Commands & Buttons)
// ============================================================

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    if (interaction.customId === "join_giveaway") {
      const gw = giveaways[interaction.message.id];
      if (!gw || gw.ended) return interaction.reply({ content: "❌ انتهى هذا القيف أواي بالفعل.", flags: 64 });
      if (!gw.entries) gw.entries = [];

      const userIndex = gw.entries.indexOf(interaction.user.id);
      if (userIndex !== -1) {
        gw.entries.splice(userIndex, 1);
        saveData("./giveaways.json", giveaways);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("join_giveaway").setLabel(`🎉 اشتراك (${gw.entries.length})`).setStyle(ButtonStyle.Primary));
        await interaction.message.edit({ components: [row] }).catch(() => null);
        return interaction.reply({ content: "❌ تم إلغاء مشاركتك في القيف أواي.", flags: 64 });
      } else {
        gw.entries.push(interaction.user.id);
        saveData("./giveaways.json", giveaways);
        const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("join_giveaway").setLabel(`🎉 اشتراك (${gw.entries.length})`).setStyle(ButtonStyle.Primary));
        await interaction.message.edit({ components: [row] }).catch(() => null);
        return interaction.reply({ content: "✅ تم تسجيل مشاركتك بنجاح!", flags: 64 });
      }
    }
  }

  if (interaction.isChatInputCommand()) {
    await interaction.deferReply({ flags: 64 }).catch(() => null);
    const { commandName, options, member, guild, channel } = interaction;

    // Lock
    if (commandName === "lock") {
      if (!hasPermission(member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const targetChan = options.getChannel("channel") || channel;
      await targetChan.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false });
      return interaction.editReply({ content: `🔒 تم إغلاق الروم ${targetChan}` });
    }

    // Unlock
    if (commandName === "unlock") {
      if (!hasPermission(member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const targetChan = options.getChannel("channel") || channel;
      await targetChan.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: true });
      return interaction.editReply({ content: `🔓 تم فتح الروم ${targetChan}` });
    }

    // Ban
    if (commandName === "ban") {
      if (!hasPermission(member, CONFIG.ROLES.BAN)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      if (!target || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك حظر هذا العضو." });
      const duration = options.getString("duration");
      const reason = options.getString("reason") || "بدون سبب";
      let durationMs = duration ? ms(duration) : null;
      await guild.members.ban(target.id, { reason });
      if (durationMs) {
        tempBans.push({ userId: target.id, guildId: guild.id, expireAt: Date.now() + durationMs });
        saveData("./tempBans.json", tempBans);
      }
      return interaction.editReply({ content: `✅ تم حظر ${target.user.tag}` });
    }

    // Unban
    if (commandName === "unban") {
      if (!hasPermission(member, CONFIG.ROLES.UNBAN)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const userId = options.getString("userid");
      await guild.bans.remove(userId).catch(() => null);
      return interaction.editReply({ content: `✅ تم فك الحظر عن (${userId}).` });
    }

    // Kick
    if (commandName === "kick") {
      if (!hasPermission(member, CONFIG.ROLES.KICK)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      if (!target || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك طرد هذا العضو." });
      await target.kick(options.getString("reason") || "بدون سبب");
      return interaction.editReply({ content: `✅ تم طرد ${target.user.tag}` });
    }

    // Timeout
    if (commandName === "timeout") {
      if (!hasPermission(member, CONFIG.ROLES.TIMEOUT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      const durationMs = ms(options.getString("duration") || "");
      if (!target || !durationMs || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ خطأ في الإدخال أو الصلاحيات." });
      await target.timeout(durationMs, options.getString("reason") || "بدون سبب");
      return interaction.editReply({ content: `✅ تم إعطاء تايم أوت لـ ${target.user.tag}` });
    }

    // Untimeout
    if (commandName === "untimeout") {
      if (!hasPermission(member, CONFIG.ROLES.TIMEOUT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      if (!target || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك التعديل على هذا العضو." });
      await target.timeout(null);
      return interaction.editReply({ content: `✅ تم فك التايم أوت عن ${target.user.tag}` });
    }

    // Server Info
    if (commandName === "serverinfo") {
      const embed = new EmbedBuilder().setTitle(`معلومات سيرفر ${guild.name}`).addFields({ name: "عدد الأعضاء", value: `${guild.memberCount}`, inline: true }).setColor("Blue");
      return interaction.editReply({ embeds: [embed] });
    }

    // Role
    if (commandName === "role") {
      if (!hasPermission(member, CONFIG.ROLES.ROLES_MANAGEMENT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      const role = options.getRole("role");
      if (!target || !role || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك التعديل." });
      await target.roles.add(role);
      return interaction.editReply({ content: `✅ تم إعطاء الرول ${role.name}` });
    }

    // Remove Role
    if (commandName === "removerole") {
      if (!hasPermission(member, CONFIG.ROLES.ROLES_MANAGEMENT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      const role = options.getRole("role");
      if (!target || !role || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك التعديل." });
      await target.roles.remove(role);
      return interaction.editReply({ content: `✅ تم إزالة الرول ${role.name}` });
    }

    // Warn
    if (commandName === "warn") {
      if (!hasPermission(member, CONFIG.ROLES.WARNS)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      const reason = options.getString("reason");
      if (!target || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك تحذيره." });
      const warnCode = generateCode();
      if (!warnings[target.id]) warnings[target.id] = [];
      warnings[target.id].push({ code: warnCode, reason, date: new Date().toLocaleDateString() });
      saveData("./warnings.json", warnings);
      return interaction.editReply({ content: `⚠️ تم تحذير ${target.user.tag} بالسبب: ${reason} (الكود: \`${warnCode}\`)` });
    }

    // Unwarn
    if (commandName === "unwarn") {
      if (!hasPermission(member, CONFIG.ROLES.WARNS)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const query = options.getString("query");
      if (warnings[query]) {
        delete warnings[query];
        saveData("./warnings.json", warnings);
        return interaction.editReply({ content: "✅ تم مسح جميع التحذيرات." });
      }
      for (const uid in warnings) {
        const idx = warnings[uid].findIndex(w => w.code === query);
        if (idx !== -1) {
          warnings[uid].splice(idx, 1);
          saveData("./warnings.json", warnings);
          return interaction.editReply({ content: `✅ تم إزالة التحذير بالكود \`${query}\`.` });
        }
      }
      return interaction.editReply({ content: "❌ لم يتم العثور على التحذير." });
    }

    // Warns
    if (commandName === "warns") {
      const targetUser = options.getUser("target");
      if (targetUser) {
        const list = warnings[targetUser.id] || [];
        return interaction.editReply({ content: list.length ? list.map(w => `كود: ${w.code} \vert{} السبب: ${w.reason}`).join("\n") : "✨ لا يوجد تحذيرات." });
      } else {
        return interaction.editReply({ content: `إجمالي سجلات السيرفر: ${Object.keys(warnings).length} عضو محذر.` });
      }
    }

    // TempRole
    if (commandName === "temprole") {
      if (!hasPermission(member, CONFIG.ROLES.ROLES_MANAGEMENT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      const durationMs = ms(options.getString("duration") || "");
      const role = options.getRole("role");
      if (!target || !durationMs || !role) return interaction.editReply({ content: "❌ بيانات غير صحيحة." });
      await target.roles.add(role);
      tempRoles.push({ userId: target.id, guildId: guild.id, roleId: role.id, expireAt: Date.now() + durationMs });
      saveData("./tempRoles.json", tempRoles);
      return interaction.editReply({ content: `✅ تم إعطاء ${role.name} مؤقتاً.` });
    }

    // Nickname
    if (commandName === "nickname") {
      if (!hasPermission(member, CONFIG.ROLES.NICKNAME)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      const name = options.getString("name");
      if (!target || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك تغيير اسمه." });
      await target.setNickname(name);
      return interaction.editReply({ content: `✅ تم تغيير اللقب إلى: ${name}` });
    }

    // Top
    if (commandName === "top") {
      const sorted = Object.entries(userMsgCount).sort(([, a], [, b]) => b - a).slice(0, 10);
      let desc = sorted.map(([id, count], idx) => `#${idx + 1} | <@${id}> —${count} رسالة`).join("\n");
      return interaction.editReply({ content: desc || "لا توجد بيانات." });
    }

    // Jail
    if (commandName === "jail") {
      if (!hasPermission(member, CONFIG.ROLES.JAIL)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      if (!target || !canModerateTarget(member, target)) return interaction.editReply({ content: "❌ لا يمكنك سجنه." });
      jailedUsers[target.id] = target.roles.cache.map(r => r.id);
      saveData("./jailedUsers.json", jailedUsers);
      await target.roles.set([CONFIG.JAIL_ROLE_ID]).catch(() => null);
      return interaction.editReply({ content: `🔒 تم سجن ${target.user.tag}` });
    }

    // Unjail
    if (commandName === "unjail") {
      if (!hasPermission(member, CONFIG.ROLES.JAIL)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const target = options.getMember("target");
      if (!target) return interaction.editReply({ content: "❌ العضو غير موجود." });
      const oldRoles = jailedUsers[target.id] || [];
      delete jailedUsers[target.id];
      saveData("./jailedUsers.json", jailedUsers);
      await target.roles.set(oldRoles).catch(() => null);
      return interaction.editReply({ content: `🔓 تم فك سجن ${target.user.tag}` });
    }

    // Clear
    if (commandName === "clear") {
      if (!hasPermission(member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return interaction.editReply({ content: "❌ ليس لديك صلاحية." });
      const amount = options.getInteger("amount");
      if (amount < 1 || amount > 100) return interaction.editReply({ content: "❌ حدد عدداً بين 1 و 100." });
      const deleted = await channel.bulkDelete(amount, true).catch(() => null);
      if (!deleted) return interaction.editReply({ content: "❌ تعذر مسح الرسائل قديمة الطراز (أكثر من 14 يوم)." });
      return interaction.editReply({ content: `🧹 تم مسح **${deleted.size}** رسالة.` });
    }
  }
});

// ============================================================
// MESSAGE CREATE (الأوامر النصية العادية)
// ============================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  userMsgCount[message.author.id] = (userMsgCount[message.author.id] || 0) + 1;
  saveData("./userMsgCount.json", userMsgCount);

  const discordLinkRegex = /(discord\.gg|discord\.com\/invite)\/[a-zA-Z0-9]+/gi;
  if (discordLinkRegex.test(message.content)) {
    await message.delete().catch(() => null);
    const userId = message.author.id;
    linkViolations[userId] = (linkViolations[userId] || 0) + 1;

    if (linkViolations[userId] >= 2) {
      const member = await message.guild.members.fetch(userId).catch(() => null);
      if (member && canModerateTarget(message.guild.members.me, member)) {
        await member.timeout(10 * 60 * 1000, "تكرار إرسال روابط ديسكورد").catch(() => null);
        message.channel.send(`⚠️ تم إعطاء <@${userId}> تايم أوت لمدة 10 دقائق بسبب تكرار إرسال الروابط.`).catch(() => null);
      }
      linkViolations[userId] = 0;
    } else {
      message.channel.send(`يمنع إرسال روابط ديسكورد في سيرفر غرناطة نتمنى ألا تتكرر . 🌿`)
        .then((m) => setTimeout(() => m.delete().catch(() => null), 5000))
        .catch(() => null);
    }
    return;
  }

  const greetings = ["السلام عليكم", "السلام عليكم ورحمة الله وبركاته", "سلام عليكم", "سلام عليكم ورحمة الله وبركاته"];
  if (greetings.includes(message.content.trim())) {
    return message.reply("وعليكم السلام ورحمة الله وبركاته");
  }

  const rawContent = message.content.trim();
  const args = rawContent.split(/ +/);
  const command = args.shift().toLowerCase();

  // 1. أمر باند
  if (command === "باند" || command === "حظر") {
    if (!hasPermission(message.member, CONFIG.ROLES.BAN)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("❌ طريقة الاستخدام: `باند [منشن العضو / الآيدي] [المدة اختياري] [السبب اختياري]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك حظر عضو رتبته أعلى منك أو مساوية لك.");

    const durationArg = args[1];
    const reason = args.slice(2).join(" ") || args.slice(1).join(" ") || "بدون سبب";
    let durationMs = durationArg ? ms(durationArg) : null;

    await message.guild.members.ban(target.id, { reason: `${reason} \vert{} بواسطة: ${message.author.tag}` });
    if (durationMs) {
      tempBans.push({ userId: target.id, guildId: message.guild.id, expireAt: Date.now() + durationMs });
      saveData("./tempBans.json", tempBans);
    }
    return message.reply(`✅ تم حظر ${target.user.tag}${durationMs ? `لمدة ${durationArg}` : "بشكل دائم"} | السبب: ${reason}`);
  }

  // 2. أمر فك الباند
  if (command === "ارجع") {
    if (!hasPermission(message.member, CONFIG.ROLES.UNBAN)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const userId = args[0];
    if (!userId) return message.reply("❌ طريقة الاستخدام: `ارجع [آيدي العضو]`");

    await message.guild.bans.remove(userId).catch(() => null);
    return message.reply(`✅ تم فك الحظر عن العضو (${userId}).`);
  }

  // 3. أمر طرد
  if (command === "طرد") {
    if (!hasPermission(message.member, CONFIG.ROLES.KICK)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("❌ طريقة الاستخدام: `طرد [منشن العضو / الآيدي] [السبب]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك طرد عضو رتبته أعلى منك أو مساوية لك.");

    const reason = args.slice(1).join(" ") || "بدون سبب";
    await target.kick(reason);
    return message.reply(`✅ تم طرد العضو ${target.user.tag} \vert{} السبب: ${reason}`);
  }

  // 4. أمر تايم اوت
  if (command === "تايم" || command === "اسكات") {
    if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("❌ طريقة الاستخدام الصحيحة: `تايم [منشن العضو/الآيدي] [المدة مثل 10m أو 1h] [السبب اختياري]`");

    const durationMs = args[1] ? ms(args[1]) : null;
    if (!durationMs) return message.reply("❌ يرجى تحديد المدة بشكل صحيح (مثال: `تايم @member 10m`).");

    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك إسكات عضو رتبته أعلى منك أو مساوية لك.");

    const reason = args.slice(2).join(" ") || "بدون سبب";
    await target.timeout(durationMs, reason);
    return message.reply(`✅ تم إعطاء تايم أوت لـ ${target.user.tag} لمدة ${args[1]}.`);
  }

  // 5. أمر فك تايم اوت
  if (command === "تحدث" || command === "احكي" || command === "تكلم") {
    if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("❌ طريقة الاستخدام: `تحدث [منشن العضو / الآيدي]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك تعديل حالة عضو رتبته أعلى منك أو مساوية لك.");

    await target.timeout(null);
    return message.reply(`✅ تم فك التايم أوت عن ${target.user.tag}.`);
  }

  // 6. أمر معلومات السيرفر
  if (command === "السيرفر" || command === "معلومات") {
    const embed = new EmbedBuilder()
      .setTitle(`معلومات سيرفر ${message.guild.name}`)
      .addFields(
        { name: "عدد الأعضاء", value: `${message.guild.memberCount}`, inline: true },
        { name: "تاريخ الإنشاء", value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setColor("Blue");
    return message.reply({ embeds: [embed] });
  }

  // 7. أمر اعطاء رول
  if (command === "رول") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply("❌ طريقة الاستخدام: `رول [منشن العضو/الآيدي] [منشن الرول/الآيدي]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك تعديل رتب عضو أعلى منك أو مساوي لك.");

    await target.roles.add(role);
    return message.reply(`✅ تم إعطاء الرول **${role.name}** لـ ${target.user.tag}`);
  }

  // 8. أمر ازالة رول
  if (rawContent.startsWith("سحب رول") || command === "سحب_رول") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply("❌ طريقة الاستخدام: `سحب رول [منشن العضو/الآيدي] [منشن الرول/الآيدي]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك تعديل رتب عضو أعلى منك أو مساوي لك.");

    await target.roles.remove(role);
    return message.reply(`✅ تم إزالة الرول **${role.name}** من ${target.user.tag}`);
  }

  // 9. أمر فتح روم
  if (command === "فتح" || command === "ف") {
    if (!hasPermission(message.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    return message.reply(`🔓 تم فتح الروم ${channel}`);
  }

  // 10. أمر اغلاق روم
  if (command === "قفل" || command === "ق") {
    if (!hasPermission(message.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    return message.reply(`🔒 تم إغلاق الروم ${channel}`);
  }

  // 11. أمر تحذير
  if (command === "تحذير" || command === "انذار") {
    if (!hasPermission(message.member, CONFIG.ROLES.WARNS)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const reason = args.slice(1).join(" ");
    if (!target || !reason) return message.reply("❌ طريقة الاستخدام: `تحذير [منشن العضو/الآيدي] [السبب]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك تحذير عضو رتبته أعلى منك أو مساوية لك.");

    const warnCode = generateCode();
    if (!warnings[target.id]) warnings[target.id] = [];
    warnings[target.id].push({ code: warnCode, reason, date: new Date().toLocaleDateString() });
    saveData("./warnings.json", warnings);

    const warnEmbed = new EmbedBuilder()
      .setTitle("⚠️ إشـعـار تـحـذيـر جديد")
      .setColor("DarkRed")
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "👤 العضو المحذر", value: `${target} (${target.user.tag})`, inline: true },
        { name: "🛡️ الإداري المنفذ", value: `${message.author}`, inline: true },
        { name: "🔑 كود التحذير", value: `\`${warnCode}\``, inline: true },
        { name: "📝 السبب", value: reason, inline: false }
      )
      .setTimestamp();

    return message.reply({ embeds: [warnEmbed] });
  }

  // 12. أمر اعفاء
  if (command === "اعفاء" || command === "عفو") {
    if (!hasPermission(message.member, CONFIG.ROLES.WARNS)) return message.reply("❌ ليس لديك صلاحية.");
    const query = args[0];
    if (!query) return message.reply("❌ طريقة الاستخدام: `اعفاء [منشن العضو / الآيدي / كود التحذير]`");

    const targetUser = message.mentions.users.first() || await client.users.fetch(query).catch(() => null);

    if (targetUser && warnings[targetUser.id]) {
      delete warnings[targetUser.id];
      saveData("./warnings.json", warnings);
      return message.reply(`✅ تم إزالة كافة تحذيرات العضو ${targetUser.tag}`);
    } else {
      for (const userId in warnings) {
        const idx = warnings[userId].findIndex((w) => w.code === query);
        if (idx !== -1) {
          warnings[userId].splice(idx, 1);
          saveData("./warnings.json", warnings);
          return message.reply(`✅ تم إزالة التحذير بالكود \`${query}\`.`);
        }
      }
    }
    return message.reply("❌ لم يتم العثور على تحذيرات لهذا العضو أو الكود.");
  }

  // 13. أمر تحذيرات
  if (command === "تحذيرات" || command === "التحذيرات") {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    
    if (target) {
      const list = warnings[target.id] || [];
      const embed = new EmbedBuilder().setTitle(`📋 سجل تحذيرات العضو`).setColor(list.length > 0 ? "Orange" : "Green");
      if (list.length === 0) embed.setDescription("✨ **لا توجد أي تحذيرات مسجلة لهذا العضو.**");
      else embed.setDescription(list.map((w) => `<@${target.id}> السبب : ${w.reason} كود التحذير ${w.code}`).join("\n\n"));
      return message.reply({ embeds: [embed] });
    } else {
      const embed = new EmbedBuilder().setTitle("📋 سجل تحذيرات السيرفر").setColor("DarkOrange");
      let warnList = [];
      for (const uid in warnings) {
        if (warnings[uid] && warnings[uid].length > 0) {
          warnings[uid].forEach((w) => warnList.push(`<@${uid}> السبب : ${w.reason} كود التحذير ${w.code}`));
        }
      }
      embed.setDescription(warnList.length > 0 ? warnList.join("\n\n") : "✨ **لا توجد تحذيرات مسجلة في السيرفر حالياً.**");
      return message.reply({ embeds: [embed] });
    }
  }

  // 14. أمر رول مؤقت
  if (rawContent.startsWith("رول مؤقت") || command === "رول_مؤقت") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const durationMs = ms(args[1]);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

    if (!target || !role || !durationMs) return message.reply("❌ طريقة الاستخدام: `رول مؤقت [منشن العضو/الآيدي] [المدة] [الرول]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك التعديل.");

    await target.roles.add(role);
    tempRoles.push({ userId: target.id, guildId: message.guild.id, roleId: role.id, expireAt: Date.now() + durationMs });
    saveData("./tempRoles.json", tempRoles);
    return message.reply(`✅ تم إعطاء ${target.user.tag} الرول **${role.name}** لمدة ${args[1]}`);
  }

  // 15. أمر لقب
  if (command === "لقب" || command === "اسم") {
    if (!hasPermission(message.member, CONFIG.ROLES.NICKNAME)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    const newNick = args.slice(1).join(" ");
    if (!target || !newNick) return message.reply("❌ طريقة الاستخدام: `لقب [منشن العضو/الآيدي] [الاسم]`");
    await target.setNickname(newNick);
    return message.reply(`✅ تم تغيير الاسم لـ ${target.user.tag} إلى **${newNick}**`);
  }

  // 16. أمر تفاعل
  if (command === "تفاعل" || command === "المتفاعلين") {
    const sorted = Object.entries(userMsgCount).sort(([, a], [, b]) => b - a).slice(0, 10);
    if (!sorted.length) return message.reply("لا توجد بيانات تفاعل بعد.");
    const embed = new EmbedBuilder().setTitle("🏆 قائمة أفضل 10 متفاعلين في السيرفر").setColor("Gold");
    let desc = sorted.map(([id, count], idx) => `**#${idx + 1}** | <@${id}> — **${count}** رسالة`).join("\n");
    embed.setDescription(desc);
    return message.reply({ embeds: [embed] });
  }

  // 17. أمر سجن
  if (command === "سجن") {
    if (!hasPermission(message.member, CONFIG.ROLES.JAIL)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("❌ طريقة الاستخدام: `سجن [منشن العضو / الآيدي]`");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك سجنه.");

    jailedUsers[target.id] = target.roles.cache.map((r) => r.id);
    saveData("./jailedUsers.json", jailedUsers);

    await target.roles.set([CONFIG.JAIL_ROLE_ID]).catch(() => null);
    return message.reply(`🔒 تم سجن العضو ${target.user.tag} بنجاح.`);
  }

  // 18. أمر فك سجن
  if (command === "إفراج" || command === "افراج" || command === "فك_سجن") {
    if (!hasPermission(message.member, CONFIG.ROLES.JAIL)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || (args[0] ? await message.guild.members.fetch(args[0]).catch(() => null) : null);
    if (!target) return message.reply("❌ طريقة الاستخدام: `افراج [منشن العضو / الآيدي]`");

    const savedRoles = jailedUsers[target.id] || [];
    delete jailedUsers[target.id];
    saveData("./jailedUsers.json", jailedUsers);

    await target.roles.set(savedRoles).catch(() => null);
    return message.reply(`🔓 تم فك سجن العضو ${target.user.tag} وإعادة رتبه.`);
  }

  // 19. أمر مسح
  if (command === "مسح") {
    if (!hasPermission(message.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    let amount = parseInt(args[0]) || 100;
    if (amount < 1 || amount > 100) return message.reply("❌ يرجى تحديد عدد رسائل بين 1 و 100.");

    await message.delete().catch(() => null);
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
    if (!deleted) return message.channel.send("❌ لا يمكن مسح الرسائل التي مر عليها أكثر من 14 يوماً.");
    
    return message.channel.send(`🧹 تم مسح **${deleted.size}** رسالة.`).then((m) => setTimeout(() => m.delete().catch(() => null), 5000));
  }
});

// ============================================================
// LOGIN
// ============================================================

client.login(CONFIG.TOKEN).catch((err) => {
  console.error("❌ فشل تسجيل دخول البوت الرئيسي:", err.message);
});
