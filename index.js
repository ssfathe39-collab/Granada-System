// ============================================================
// تحميل dotenv بشكل اختياري
// ============================================================
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
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  SlashCommandBuilder,
  REST,
  Routes,
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
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction],
});

// ============================================================
// CONFIG
// ============================================================

const CONFIG = {
  TOKEN: process.env.TOKEN || process.env.Granada_token,
  GRANADA_VOICE_CHANNEL_ID: "1442200304853582005",
  REMINDER_CHANNEL_ID: "1496200586906042590",
  WELCOME_CHANNEL_ID: "1442200304522104929",
  WELCOME_IMAGE_URL:
    "https://cdn.discordapp.com/attachments/1442200304522104929/1534267076380721355/welcome.png",

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
    APPLY: [
      "1508130937819500635",
      "1497983638200123552",
      "1497964133797199921",
      "1497985358955024514",
      "1496230091812901026",
      "1502735885500682291",
    ],
    GIVEAWAY: [
      "1496228340657557544",
      "1496228628764299494",
      "1508130522377752677",
      "1508130937819500635",
      "1497983638200123552",
      "1497964133797199921",
      "1497984406726512740",
      "1497985358955024514",
      "1496230091812901026",
    ],
  },

  APPLY_QUESTIONS: [
    { id: "q1", label: "الاسم الشخصي", placeholder: "ماهو اسمك...", style: TextInputStyle.Short, required: true },
    { id: "q2", label: "العمر", placeholder: "كم عمرك...", style: TextInputStyle.Short, required: true },
    { id: "q3", label: "الدولة", placeholder: "ماهي دولتك...", style: TextInputStyle.Short, required: true },
    { id: "q4", label: "خبراتك الادارية", placeholder: "اذكر خبرتك...", style: TextInputStyle.Paragraph, required: true },
    { id: "q5", label: "كيف تفيد سيرفر غرناطة", placeholder: "كيف ستفيدنا في غرناطة...", style: TextInputStyle.Paragraph, required: true },
  ],

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

let applyStatus = false;
let userMsgCount = {};
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

// ============================================================
// Permissions
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
  if (target.permissions.has(PermissionFlagsBits.Administrator)) return false;
  if (executor.id === executor.guild.ownerId) return true;
  return executor.roles.highest.position > target.roles.highest.position;
}

// ============================================================
// REGISTER ALL ENGLISH SLASH COMMANDS WITH ARABIC DESCRIPTIONS
// ============================================================

async function registerSlashCommands() {
  const commands = [
    // 1. ban (حظر / باند)
    new SlashCommandBuilder()
      .setName("ban")
      .setDescription("حظر عضو من السيرفر (مؤقت أو دائم)")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("duration").setDescription("المدة مثل (7d, 1h) أو دائم").setRequired(false))
      .addStringOption((opt) => opt.setName("reason").setDescription("سبب الحظر").setRequired(false)),

    // 2. unban (ارجع / فك_حظر)
    new SlashCommandBuilder()
      .setName("unban")
      .setDescription("فك الحظر عن عضو بواسطة ID")
      .addStringOption((opt) => opt.setName("id").setDescription("معرف العضو (ID)").setRequired(true)),

    // 3. kick (طرد)
    new SlashCommandBuilder()
      .setName("kick")
      .setDescription("طرد عضو من السيرفر")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("سبب الطرد").setRequired(false)),

    // 4. timeout (اسكات / تايم)
    new SlashCommandBuilder()
      .setName("timeout")
      .setDescription("إعطاء تايم أوت (إسكات) لعضو")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("duration").setDescription("المدة (مثال: 10m, 1h, 1d)").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("السبب").setRequired(false)),

    // 5. untimeout (تكلم / تحدث)
    new SlashCommandBuilder()
      .setName("untimeout")
      .setDescription("فك التايم أوت (الإسكات) عن عضو")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true)),

    // 6. serverinfo (سيرفر)
    new SlashCommandBuilder()
      .setName("serverinfo")
      .setDescription("معلومات السيرفر الإجمالية"),

    // 7. role (رول)
    new SlashCommandBuilder()
      .setName("role")
      .setDescription("إعطاء رتبة معينة لعضو")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addRoleOption((opt) => opt.setName("role").setDescription("اختر الرتبة").setRequired(true)),

    // 8. removerole (سحب_رول / ازالة_رول)
    new SlashCommandBuilder()
      .setName("removerole")
      .setDescription("سحب/إزالة رتبة من عضو")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addRoleOption((opt) => opt.setName("role").setDescription("اختر الرتبة المراد سحبها").setRequired(true)),

    // 9. lock (قفل / ق)
    new SlashCommandBuilder()
      .setName("lock")
      .setDescription("قفل الكتابة في روم معين")
      .addChannelOption((opt) => opt.setName("channel").setDescription("اختر الروم (اختياري)").setRequired(false)),

    // 10. unlock (فتح / ف)
    new SlashCommandBuilder()
      .setName("unlock")
      .setDescription("فتح الكتابة في روم معين")
      .addChannelOption((opt) => opt.setName("channel").setDescription("اختر الروم (اختياري)").setRequired(false)),

    // 11. warn (تحذير / انذار)
    new SlashCommandBuilder()
      .setName("warn")
      .setDescription("إعطاء تحذير/إنذار لعضو")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("سبب التحذير").setRequired(true)),

    // 12. unwarn (اعفاء)
    new SlashCommandBuilder()
      .setName("unwarn")
      .setDescription("إعفاء عضو وإزالة تحذير بواسطة الكود")
      .addStringOption((opt) => opt.setName("code").setDescription("كود التحذير").setRequired(true)),

    // 13. warnings (تحذيرات)
    new SlashCommandBuilder()
      .setName("warnings")
      .setDescription("عرض قائمة التحذيرات لعضو معين أو لجميع الأعضاء")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو (اختياري)").setRequired(false)),

    // 14. temprole (رول-مؤقت / رول_مؤقت)
    new SlashCommandBuilder()
      .setName("temprole")
      .setDescription("إعطاء رتبة مؤقتة لعضو لمدة محددة")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addRoleOption((opt) => opt.setName("role").setDescription("اختر الرتبة").setRequired(true))
      .addStringOption((opt) => opt.setName("duration").setDescription("المدة (مثال: 1d, 2h)").setRequired(true)),

    // 15. nickname (لقب / اسم)
    new SlashCommandBuilder()
      .setName("nickname")
      .setDescription("تغيير لقب/اسم عضو في السيرفر")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("nick").setDescription("اللقب الجديد").setRequired(true)),

    // 16. leaderboard (تفاعل / توب)
    new SlashCommandBuilder()
      .setName("leaderboard")
      .setDescription("عرض قائمة الأعضاء الأكثر تفاعلاً في السيرفر"),

    // 17. apply (تقديم)
    new SlashCommandBuilder()
      .setName("apply")
      .setDescription("إدارة نظام التقديم للإدارة (فتح/إغلاق/إرسال/قبول/رفض)")
      .addStringOption((opt) =>
        opt
          .setName("action")
          .setDescription("الخيارات")
          .setRequired(true)
          .addChoices(
            { name: "فتح (Open)", value: "open" },
            { name: "إغلاق (Close)", value: "close" },
            { name: "إرسال زر التقديم (Send)", value: "send" },
            { name: "قبول متقدم (Accept)", value: "accept" },
            { name: "رفض متقدم (Reject)", value: "reject" }
          )
      )
      .addUserOption((opt) => opt.setName("user").setDescription("العضو المتقدم (مطلوب عند القبول/الرفض)").setRequired(false))
      .addStringOption((opt) => opt.setName("details").setDescription("الرتبة الممنوحة أو سبب الرفض").setRequired(false)),

    // 18. giveaway (قيفاواي / سحب)
    new SlashCommandBuilder()
      .setName("giveaway")
      .setDescription("إنشاء سحب جديد (Giveaway)")
      .addStringOption((opt) => opt.setName("duration").setDescription("مدّة السحب (مثال: 1h, 1d)").setRequired(true))
      .addStringOption((opt) => opt.setName("prize").setDescription("الجائزة").setRequired(true)),

    // 19. clear (مسح)
    new SlashCommandBuilder()
      .setName("clear")
      .setDescription("مسح عدد معين من الرسائل في الروم")
      .addIntegerOption((opt) =>
        opt.setName("amount").setDescription("عدد الرسائل (1 - 100)").setRequired(true).setMinValue(1).setMaxValue(100)
      ),

    // 20. userinfo
    new SlashCommandBuilder()
      .setName("userinfo")
      .setDescription("عرض معلومات عضو في السيرفر")
      .addUserOption((opt) => opt.setName("user").setDescription("اختر العضو (اختياري)").setRequired(false)),
  ];

  const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);

  try {
    console.log("⏳ جاري تسجيل أوامر السلاش بالإنجليزية مع الوصف العربي...");
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    console.log("✅ تم تسجيل جميع أوامر السلاش العشرين بنجاح!");
  } catch (error) {
    console.error("❌ خطأ أثناء تسجيل أوامر السلاش:", error.message);
  }
}

// ============================================================
// READY
// ============================================================

client.once("ready", async () => {
  console.log("\n======================================");
  console.log(`✅ البوت الرئيسي جاهز: ${client.user.tag}`);
  console.log(`🆔 ID: ${client.user.id}`);
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
  startVoiceBots();
});

// ============================================================
// 🌿 نظام الترحيب
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
// MESSAGE CREATE (الرسائل التلقائية والأوامر الكتابية)
// ============================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  userMsgCount[message.author.id] = (userMsgCount[message.author.id] || 0) + 1;

  // منع روابط Discord
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

  // رد والسلام
  const greetings = [
    "السلام عليكم",
    "السلام عليكم ورحمة الله وبركاته",
    "سلام عليكم",
    "سلام عليكم ورحمة الله وبركاته",
  ];

  if (greetings.includes(message.content.trim())) {
    return message.reply("وعليكم السلام ورحمة الله وبركاته");
  }
});

// ============================================================
// INTERACTION CREATE (Slash Commands Handler)
// ============================================================

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    // 1. /ban
    if (commandName === "ban") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.BAN)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const durationArg = interaction.options.getString("duration");
      const reason = interaction.options.getString("reason") || "بدون سبب";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember && !canModerateTarget(interaction.member, targetMember)) {
        return interaction.reply({ content: "❌ لا يمكنك حظر هذا العضو بسبب رتبته العالية.", ephemeral: true });
      }

      let durationMs = durationArg && durationArg !== "دائم" ? ms(durationArg) : null;

      await interaction.guild.members.ban(targetUser.id, { reason: `${reason} | بواسطة: ${interaction.user.tag}` });

      if (durationMs) {
        tempBans.push({ userId: targetUser.id, guildId: interaction.guild.id, expireAt: Date.now() + durationMs });
        saveData("./tempBans.json", tempBans);
      }

      return interaction.reply({ content: `✅ تم حظر ${targetUser.tag} ${durationMs ? `لمدة ${durationArg}` : "بشكل دائم"} | السبب: ${reason}` });
    }

    // 2. /unban
    if (commandName === "unban") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.UNBAN)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const userId = interaction.options.getString("id");
      await interaction.guild.bans.remove(userId).catch(() => null);
      return interaction.reply({ content: `✅ تم فك الحظر عن العضو (${userId}).` });
    }

    // 3. /kick
    if (commandName === "kick") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.KICK)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "بدون سبب";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود بالسيرفر.", ephemeral: true });
      if (!canModerateTarget(interaction.member, targetMember)) return interaction.reply({ content: "❌ لا يمكنك طرد هذا العضو.", ephemeral: true });

      await targetMember.kick(reason);
      return interaction.reply({ content: `✅ تم طرد العضو ${targetUser.tag} | السبب: ${reason}` });
    }

    // 4. /timeout
    if (commandName === "timeout") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.TIMEOUT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const durationStr = interaction.options.getString("duration");
      const reason = interaction.options.getString("reason") || "بدون سبب";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود بالسيرفر.", ephemeral: true });
      if (!canModerateTarget(interaction.member, targetMember)) return interaction.reply({ content: "❌ لا يمكنك إسكات هذا العضو.", ephemeral: true });

      const durationMs = ms(durationStr);
      if (!durationMs) return interaction.reply({ content: "❌ الصيغة الزمانية غير صحيحة (مثال: 10m, 1h).", ephemeral: true });

      await targetMember.timeout(durationMs, reason);
      return interaction.reply({ content: `✅ تم إعطاء تايم أوت لـ ${targetUser.tag} لمدة ${durationStr}.` });
    }

    // 5. /untimeout
    if (commandName === "untimeout") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.TIMEOUT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود بالسيرفر.", ephemeral: true });

      await targetMember.timeout(null);
      return interaction.reply({ content: `✅ تم فك التايم أوت عن ${targetUser.tag}.` });
    }

    // 6. /serverinfo
    if (commandName === "serverinfo") {
      const embed = new EmbedBuilder()
        .setTitle(`معلومات سيرفر ${interaction.guild.name}`)
        .addFields(
          { name: "عدد الأعضاء", value: `${interaction.guild.memberCount}`, inline: true },
          { name: "تاريخ الإنشاء", value: `<t:${Math.floor(interaction.guild.createdTimestamp / 1000)}:R>`, inline: true }
        )
        .setColor("Blue");

      return interaction.reply({ embeds: [embed] });
    }

    // 7. /role
    if (commandName === "role") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.ROLES_MANAGEMENT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });
      if (!canModerateTarget(interaction.member, targetMember)) return interaction.reply({ content: "❌ لا يمكنك إضافة رتبة لهذا العضو.", ephemeral: true });

      await targetMember.roles.add(role);
      return interaction.reply({ content: `✅ تم إعطاء الرول **${role.name}** لـ ${targetUser.tag}` });
    }

    // 8. /removerole
    if (commandName === "removerole") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.ROLES_MANAGEMENT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });
      if (!canModerateTarget(interaction.member, targetMember)) return interaction.reply({ content: "❌ لا يمكنك إزالة رتبة من هذا العضو.", ephemeral: true });

      await targetMember.roles.remove(role);
      return interaction.reply({ content: `✅ تم إزالة الرول **${role.name}** من ${targetUser.tag}` });
    }

    // 9. /lock
    if (commandName === "lock") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const channel = interaction.options.getChannel("channel") || interaction.channel;
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
      return interaction.reply({ content: `🔒 تم إغلاق الروم ${channel}` });
    }

    // 10. /unlock
    if (commandName === "unlock") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const channel = interaction.options.getChannel("channel") || interaction.channel;
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
      return interaction.reply({ content: `🔓 تم فتح الروم ${channel}` });
    }

    // 11. /warn
    if (commandName === "warn") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.WARNS)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember && !canModerateTarget(interaction.member, targetMember)) {
        return interaction.reply({ content: "❌ لا يمكنك تحذير هذا العضو.", ephemeral: true });
      }

      const warnCode = generateCode();
      if (!warnings[targetUser.id]) warnings[targetUser.id] = [];

      warnings[targetUser.id].push({ code: warnCode, reason, date: new Date().toLocaleDateString() });
      saveData("./warnings.json", warnings);

      const embed = new EmbedBuilder()
        .setTitle("⚠️ تحذير جديد")
        .addFields(
          { name: "العضو", value: `${targetUser.tag}`, inline: true },
          { name: "كود التحذير", value: `\`${warnCode}\``, inline: true },
          { name: "السبب", value: reason }
        )
        .setColor("Red");

      return interaction.reply({ embeds: [embed] });
    }

    // 12. /unwarn
    if (commandName === "unwarn") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.WARNS)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const code = interaction.options.getString("code");
      let found = false;

      for (const userId in warnings) {
        const idx = warnings[userId].findIndex((w) => w.code === code);
        if (idx !== -1) {
          warnings[userId].splice(idx, 1);
          saveData("./warnings.json", warnings);
          found = true;
          break;
        }
      }

      return interaction.reply({ content: found ? `✅ تم إزالة التحذير صاحب الكود \`${code}\`` : "❌ الكود غير صحيح." });
    }

    // 13. /warnings
    if (commandName === "warnings") {
      const targetUser = interaction.options.getUser("user");
      const embed = new EmbedBuilder().setTitle("📋 قائمة التحذيرات").setColor("Yellow");

      if (targetUser) {
        const userWarns = warnings[targetUser.id] || [];
        embed.setDescription(
          userWarns.map((w) => `• **الكود:** \`${w.code}\` | **السبب:** ${w.reason}`).join("\n") || "لا يوجد تحذيرات لهذا العضو."
        );
      } else {
        let list = "";
        for (const id in warnings) {
          if (warnings[id].length > 0) {
            list += `<@${id}>:\n` + warnings[id].map((w) => `└ الكود: \`${w.code}\` - ${w.reason}`).join("\n") + "\n";
          }
        }
        embed.setDescription(list || "لا يوجد تحذيرات مسجلة بالسيرفر.");
      }

      return interaction.reply({ embeds: [embed] });
    }

    // 14. /temprole
    if (commandName === "temprole") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.ROLES_MANAGEMENT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const role = interaction.options.getRole("role");
      const durationStr = interaction.options.getString("duration");
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });
      if (!canModerateTarget(interaction.member, targetMember)) return interaction.reply({ content: "❌ لا يمكنك إعطاء رول لهذا العضو.", ephemeral: true });

      const durationMs = ms(durationStr);
      if (!durationMs) return interaction.reply({ content: "❌ صيغة المدة غير صحيحة.", ephemeral: true });

      await targetMember.roles.add(role);

      tempRoles.push({
        userId: targetUser.id,
        roleId: role.id,
        guildId: interaction.guild.id,
        expireAt: Date.now() + durationMs,
      });

      saveData("./tempRoles.json", tempRoles);
      return interaction.reply({ content: `✅ تم إعطاء ${targetUser.tag} الرول **${role.name}** لمدة ${durationStr}.` });
    }

    // 15. /nickname
    if (commandName === "nickname") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.NICKNAME)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const targetUser = interaction.options.getUser("user");
      const nick = interaction.options.getString("nick");
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });
      if (!canModerateTarget(interaction.member, targetMember)) return interaction.reply({ content: "❌ لا يمكنك تغيير لقب هذا العضو.", ephemeral: true });

      await targetMember.setNickname(nick);
      return interaction.reply({ content: `✅ تم تغيير لقب ${targetUser.tag} إلى **${nick}**.` });
    }

    // 16. /leaderboard
    if (commandName === "leaderboard") {
      const sorted = Object.entries(userMsgCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const embed = new EmbedBuilder()
        .setTitle("🏆 قائمة أعلى 10 متفاعلين بالسيرفر")
        .setDescription(
          sorted.map(([id, count], idx) => `**#${idx + 1}** <@${id}> - \`${count}\` رسالة`).join("\n") || "لا توجد بيانات بعد."
        )
        .setColor("Gold");

      return interaction.reply({ embeds: [embed] });
    }

    // 17. /apply
    if (commandName === "apply") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.APPLY)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const action = interaction.options.getString("action");
      const targetUser = interaction.options.getUser("user");
      const details = interaction.options.getString("details") || "";

      if (action === "open") {
        applyStatus = true;
        return interaction.reply({ content: "✅ تم فتح باب التقديم للإدارة." });
      } else if (action === "close") {
        applyStatus = false;
        return interaction.reply({ content: "🚫 تم إغلاق باب التقديم للإدارة." });
      } else if (action === "send") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("apply_btn").setLabel("تقديم على الإدارة").setStyle(ButtonStyle.Primary)
        );
        await interaction.channel.send({ content: "اضغط على الزر للتقديم:", components: [row] });
        return interaction.reply({ content: "✅ تم إرسال زر التقديم بنجاح.", ephemeral: true });
      } else if (action === "accept" || action === "reject") {
        if (!targetUser) return interaction.reply({ content: "❌ يجب تحديد العضو المتقدم عند القبول أو الرفض.", ephemeral: true });

        const isAccept = action === "accept";
        const embed = new EmbedBuilder()
          .setTitle(isAccept ? "✅ تم قبول متقدم جديد على الإدارة!" : "❌ تم رفض متقدم")
          .setDescription(`العضو: ${targetUser}`)
          .setColor(isAccept ? "Green" : "Red")
          .setTimestamp();

        if (details) embed.addFields({ name: isAccept ? "الرتبة الممنوحة" : "سبب الرفض", value: details });

        await interaction.channel.send({ embeds: [embed] });
        await targetUser.send({ embeds: [embed] }).catch(() => null);
        return interaction.reply({ content: `✅ تم ${isAccept ? "قبول" : "رفض"} المتقدم بنجاح.`, ephemeral: true });
      }
    }

    // 18. /giveaway
    if (commandName === "giveaway") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.GIVEAWAY)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const durationStr = interaction.options.getString("duration");
      const prize = interaction.options.getString("prize");
      const durationMs = ms(durationStr);

      if (!durationMs) return interaction.reply({ content: "❌ صيغة الوقت غير صحيحة (مثال: 1h, 1d).", ephemeral: true });

      const embed = new EmbedBuilder()
        .setTitle("🎉 سحب جديد (Giveaway)")
        .setDescription(`الجائزة: **${prize}**\nالوقت: ${durationStr}`)
        .setColor("Purple");

      await interaction.reply({ content: "🎉 تم بدء السحب بنجاح!", ephemeral: true });

      const msg = await interaction.channel.send({ embeds: [embed] });
      await msg.react("🎉");

      setTimeout(async () => {
        const fetchedMsg = await interaction.channel.messages.fetch(msg.id).catch(() => null);
        if (!fetchedMsg) return;

        const reaction = fetchedMsg.reactions.cache.get("🎉");
        const users = await reaction?.users.fetch();
        const winner = users?.filter((u) => !u.bot).random();

        await interaction.channel.send(
          winner ? `🎉 مبروك الفائز بالجائزة **${prize}**: ${winner}!` : "❌ لم يشارك أحد بالسحب."
        );
      }, durationMs);
    }

    // 19. /clear
    if (commandName === "clear") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) {
        return interaction.reply({ content: "❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.", ephemeral: true });
      }

      const amount = interaction.options.getInteger("amount");
      await interaction.deferReply({ ephemeral: true });

      const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);

      if (!deleted) {
        return interaction.editReply({ content: "❌ حدث خطأ، قد تكون الرسائل قديمة جداً (أكثر من 14 يوم)." });
      }

      return interaction.editReply({ content: `🧹 تم مسح **${deleted.size}** رسالة بنجاح.` });
    }

    // 20. /userinfo
    if (commandName === "userinfo") {
      const targetUser = interaction.options.getUser("user") || interaction.user;
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setTitle(`👤 معلومات عضو في السيرفر`)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: "الاسم", value: `${targetUser.tag}`, inline: true },
          { name: "المعرف (ID)", value: `${targetUser.id}`, inline: true },
          { name: "تاريخ الانضمام للديسكورد", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: false }
        )
        .setColor("Gold");

      if (targetMember) {
        embed.addFields({ name: "تاريخ الانضمام للسيرفر", value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`, inline: false });
      }

      return interaction.reply({ embeds: [embed] });
    }
  }

  // التقديم للإدارة (زر)
  if (interaction.isButton() && interaction.customId === "apply_btn") {
    if (!applyStatus) {
      return interaction.reply({ content: "🚫 التقديم مغلق حالياً.", ephemeral: true });
    }

    const modal = new ModalBuilder().setCustomId("apply_modal").setTitle("تقديم على الإدارة");

    const rows = CONFIG.APPLY_QUESTIONS.map((q) => {
      const input = new TextInputBuilder()
        .setCustomId(q.id)
        .setLabel(q.label)
        .setPlaceholder(q.placeholder)
        .setStyle(q.style)
        .setRequired(q.required);

      return new ActionRowBuilder().addComponents(input);
    });

    modal.addComponents(rows);
    await interaction.showModal(modal);
  }

  // استلام بيانات التقديم
  if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {
    await interaction.reply({ content: "✅ تم إرسال تقديمك بنجاح!", ephemeral: true });

    const answers = CONFIG.APPLY_QUESTIONS.map((q) => {
      return { label: q.label, value: interaction.fields.getTextInputValue(q.id) };
    });

    const embed = new EmbedBuilder()
      .setTitle("📥 تقديم إدارة جديد")
      .setDescription(`المتقدم: ${interaction.user} (ID: \`${interaction.user.id}\`)`)
      .addFields(answers.map((a) => ({ name: a.label, value: a.value })))
      .setColor("Blue")
      .setTimestamp();

    await interaction.channel.send({ embeds: [embed] });
  }
});

// ============================================================
// LOGIN
// ============================================================

client.login(CONFIG.TOKEN);
