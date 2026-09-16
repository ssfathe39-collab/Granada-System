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
  PREFIX: "!", // البادئة للأوامر الكتابية
  TOKEN: process.env.TOKEN || process.env.Granada_token,
  GRANADA_VOICE_CHANNEL_ID: "1442200304853582005",
  REMINDER_CHANNEL_ID: "1442605140405256383",
  WELCOME_CHANNEL_ID: "1442200304522104929",
  WELCOME_IMAGE_URL:
    "https://cdn.discordapp.com/attachments/1442200304522104929/1534267076380721355/welcome.png",

  JAIL_ROLE_ID: "1508130937819500635", // رتبة السجن (يرجى التأكد من الـ ID أو تعديله)

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
      "1497985358955024514",
      "1497983638200123552",
      "1508130937819500635",
      "1508130522377752677",
      "1496228628764299494",
      "1497980636831420597",
      "1496228439840002099",
      "1500537635125329920",
      "1497981205184774144",
      "1497984837766610974",
      "1500537380115841154",
      "1496228699815542805",
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
// Permissions & Utility
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
// REGISTER SLASH COMMANDS
// ============================================================

async function registerSlashCommands() {
  const commands = [
    new SlashCommandBuilder().setName("ban").setDescription("حظر عضو من السيرفر")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("duration").setDescription("المدة (7d, 1h)"))
      .addStringOption((opt) => opt.setName("reason").setDescription("السبب")),
    new SlashCommandBuilder().setName("unban").setDescription("فك الحظر")
      .addStringOption((opt) => opt.setName("id").setDescription("معرف العضو (ID)").setRequired(true)),
    new SlashCommandBuilder().setName("kick").setDescription("طرد عضو")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("السبب")),
    new SlashCommandBuilder().setName("timeout").setDescription("إعطاء تايم أوت")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("duration").setDescription("المدة").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("السبب")),
    new SlashCommandBuilder().setName("untimeout").setDescription("فك التايم أوت")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true)),
    new SlashCommandBuilder().setName("serverinfo").setDescription("معلومات السيرفر"),
    new SlashCommandBuilder().setName("role").setDescription("إعطاء رتبة")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addRoleOption((opt) => opt.setName("role").setDescription("الرتبة").setRequired(true)),
    new SlashCommandBuilder().setName("removerole").setDescription("سحب رتبة")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addRoleOption((opt) => opt.setName("role").setDescription("الرتبة").setRequired(true)),
    new SlashCommandBuilder().setName("lock").setDescription("قفل الروم")
      .addChannelOption((opt) => opt.setName("channel").setDescription("الروم")),
    new SlashCommandBuilder().setName("unlock").setDescription("فتح الروم")
      .addChannelOption((opt) => opt.setName("channel").setDescription("الروم")),
    new SlashCommandBuilder().setName("warn").setDescription("إعطاء تحذير")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("السبب").setRequired(true)),
    new SlashCommandBuilder().setName("unwarn").setDescription("إزالة تحذير")
      .addStringOption((opt) => opt.setName("code").setDescription("كود التحذير أو ID العضو").setRequired(true)),
    new SlashCommandBuilder().setName("warnings").setDescription("عرض التحذيرات")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو")),
    new SlashCommandBuilder().setName("temprole").setDescription("رول مؤقت")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addRoleOption((opt) => opt.setName("role").setDescription("الرتبة").setRequired(true))
      .addStringOption((opt) => opt.setName("duration").setDescription("المدة").setRequired(true)),
    new SlashCommandBuilder().setName("nickname").setDescription("تغيير اسم مستعار")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("nick").setDescription("الاسم الجديد").setRequired(true)),
    new SlashCommandBuilder().setName("leaderboard").setDescription("أفضل 10 متفاعلين في السيرفر"),
    new SlashCommandBuilder().setName("jail").setDescription("سجن عضو")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true))
      .addStringOption((opt) => opt.setName("reason").setDescription("السبب")),
    new SlashCommandBuilder().setName("unjail").setDescription("فك سجن عضو")
      .addUserOption((opt) => opt.setName("user").setDescription("العضو").setRequired(true)),
  ];

  const rest = new REST({ version: "10" }).setToken(CONFIG.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("🎉 تم تسجيل أوامر السلاش بنجاح!");
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
// MESSAGE CREATE (الأوامر الكتابية والرسائل التلقائية)
// ============================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;

  // احتساب تفاعل العضو
  userMsgCount[message.author.id] = (userMsgCount[message.author.id] || 0) + 1;
  saveData("./userMsgCount.json", userMsgCount);

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

  // الرد على السلام
  const greetings = ["السلام عليكم", "السلام عليكم ورحمة الله وبركاته", "سلام عليكم", "سلام عليكم ورحمة الله وبركاته"];
  if (greetings.includes(message.content.trim())) {
    return message.reply("وعليكم السلام ورحمة الله وبركاته");
  }

  // معالجة الأوامر الكتابية
  if (!message.content.startsWith(CONFIG.PREFIX)) return;

  const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // 1. أمر باند
  if (command === "ban") {
    if (!hasPermission(message.member, CONFIG.ROLES.BAN)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى منشن العضو أو كتابة المعرف الخاص به بشكل صحيح.");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك حظر هذا العضو.");

    const durationArg = args[1];
    const reason = args.slice(2).join(" ") || "بدون سبب";
    let durationMs = durationArg ? ms(durationArg) : null;

    await message.guild.members.ban(target.id, { reason: `${reason} | بواسطة: ${message.author.tag}` });
    if (durationMs) {
      tempBans.push({ userId: target.id, guildId: message.guild.id, expireAt: Date.now() + durationMs });
      saveData("./tempBans.json", tempBans);
    }
    return message.reply(`✅ تم حظر ${target.user.tag} ${durationMs ? `لمدة ${durationArg}` : "بشكل دائم"} | السبب: ${reason}`);
  }

  // 2. أمر فك الباند
  if (command === "unban") {
    if (!hasPermission(message.member, CONFIG.ROLES.UNBAN)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const userId = args[0];
    if (!userId) return message.reply("❌ يرجى كتابة معرف العضو المحظور (ID).");

    await message.guild.bans.remove(userId).catch(() => null);
    return message.reply(`✅ تم فك الحظر عن العضو (${userId}).`);
  }

  // 3. أمر طرد
  if (command === "kick") {
    if (!hasPermission(message.member, CONFIG.ROLES.KICK)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى تحديد العضو بشكل صحيح.");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك طرد هذا العضو.");

    const reason = args.slice(1).join(" ") || "بدون سبب";
    await target.kick(reason);
    return message.reply(`✅ تم طرد العضو ${target.user.tag} | السبب: ${reason}`);
  }

  // 4. أمر تايم أوت
  if (command === "timeout") {
    if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى تحديد العضو بشكل صحيح.");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك إسكات هذا العضو.");

    const durationMs = ms(args[1]);
    if (!durationMs) return message.reply("❌ صيغة الوقت غير صحيحة (مثال: 10m, 1h).");

    const reason = args.slice(2).join(" ") || "بدون سبب";
    await target.timeout(durationMs, reason);
    return message.reply(`✅ تم إعطاء تايم أوت لـ ${target.user.tag} لمدة ${args[1]}.`);
  }

  // 5. أمر فك تايم أوت
  if (command === "untimeout") {
    if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى تحديد العضو.");

    await target.timeout(null);
    return message.reply(`✅ تم فك التايم أوت عن ${target.user.tag}.`);
  }

  // 6. أمر معلومات عن السيرفر
  if (command === "serverinfo") {
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
  if (command === "role") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply("❌ يرجى كتابة الأمر بالشكل التالي: `!role @user @role`");

    await target.roles.add(role);
    return message.reply(`✅ تم إعطاء الرول **${role.name}** لـ ${target.user.tag}`);
  }

  // 8. أمر ازالة رول
  if (command === "removerole") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply("❌ يرجى كتابة الأمر بالشكل التالي: `!removerole @user @role`");

    await target.roles.remove(role);
    return message.reply(`✅ تم إزالة الرول **${role.name}** من ${target.user.tag}`);
  }

  // 9. أمر فتح روم
  if (command === "unlock" || command === "فتح") {
    if (!hasPermission(message.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
    return message.reply(`🔓 تم فتح الروم ${channel}`);
  }

  // 10. أمر اغلاق روم
  if (command === "lock" || command === "قفل") {
    if (!hasPermission(message.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const channel = message.mentions.channels.first() || message.channel;
    await channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
    return message.reply(`🔒 تم إغلاق الروم ${channel}`);
  }

  // 11. أمر تحذير
  if (command === "warn") {
    if (!hasPermission(message.member, CONFIG.ROLES.WARNS)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const reason = args.slice(1).join(" ");
    if (!target || !reason) return message.reply("❌ يرجى المنشن/المعرف وكتابة سبب التحذير.");

    const warnCode = generateCode();
    if (!warnings[target.id]) warnings[target.id] = [];
    warnings[target.id].push({ code: warnCode, reason, date: new Date().toLocaleDateString() });
    saveData("./warnings.json", warnings);

    return message.reply(`⚠️ تم تحذير ${target.user.tag} | الكود: \`${warnCode}\` | السبب: ${reason}`);
  }

  // 12. أمر ازالة تحذير
  if (command === "unwarn") {
    if (!hasPermission(message.member, CONFIG.ROLES.WARNS)) return message.reply("❌ ليس لديك صلاحية.");
    const query = args[0];
    if (!query) return message.reply("❌ يرجى كتابة كود التحذير أو منشن/معرف العضو.");

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
    return message.reply("❌ لم يتم العثور على تحذيرات بهذا الكود أو العضو.");
  }

  // 13. الحصول على قائمة التحذيرات
  if (command === "warnings") {
    const target = message.mentions.users.first() || (args[0] ? await client.users.fetch(args[0]).catch(() => null) : null);
    const embed = new EmbedBuilder().setTitle("📋 قائمة التحذيرات").setColor("Orange");

    if (target) {
      const list = warnings[target.id] || [];
      if (!list.length) return message.reply("✅ لا يوجد تحذيرات لهذا العضو.");
      embed.setDescription(list.map((w) => `• الكود: \`${w.code}\` | السبب: ${w.reason} | التاريخ: ${w.date}`).join("\n"));
    } else {
      let total = "";
      for (const uid in warnings) {
        if (warnings[uid].length > 0) {
          total += `<@${uid}>: ${warnings[uid].length} تحذير(ات)\n`;
        }
      }
      embed.setDescription(total || "لا يوجد تحذيرات في السيرفر.");
    }
    return message.reply({ embeds: [embed] });
  }

  // 14. أمر رول مؤقت
  if (command === "temprole") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    const durationMs = ms(args[2]);

    if (!target || !role || !durationMs) return message.reply("❌ الاستخدام الصحيح: `!temprole @user @role 1d`");

    await target.roles.add(role);
    tempRoles.push({ userId: target.id, guildId: message.guild.id, roleId: role.id, expireAt: Date.now() + durationMs });
    saveData("./tempRoles.json", tempRoles);

    return message.reply(`✅ تم إعطاء ${target.user.tag} الرول **${role.name}** لمدة ${args[2]}`);
  }

  // 15. أمر اسم مستعار
  if (command === "nickname" || command === "nick") {
    if (!hasPermission(message.member, CONFIG.ROLES.NICKNAME)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const newNick = args.slice(1).join(" ");

    if (!target || !newNick) return message.reply("❌ الاستخدام: `!nickname @user الاسم_الجديد`");
    await target.setNickname(newNick);
    return message.reply(`✅ تم تغيير اسم ${target.user.tag} المستعار إلى **${newNick}**`);
  }

  // 16. لوحة الصدارة - أفضل 10 متفاعلين
  if (command === "leaderboard" || command === "تفاعل") {
    const sorted = Object.entries(userMsgCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    if (!sorted.length) return message.reply("لا توجد بيانات تفاعل بعد.");

    const embed = new EmbedBuilder()
      .setTitle("🏆 قائمة أفضل 10 متفاعلين في السيرفر")
      .setColor("Gold");

    let desc = "";
    sorted.forEach(([id, count], idx) => {
      desc += `**#${idx + 1}** | <@${id}> — **${count}** رسالة\n`;
    });
    embed.setDescription(desc);

    return message.reply({ embeds: [embed] });
  }

  // 17. أمر السجن (Jail)
  if (command === "jail") {
    if (!hasPermission(message.member, CONFIG.ROLES.JAIL)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى منشن العضو أو إضافة ID الخاص به.");

    const reason = args.slice(1).join(" ") || "بدون سبب";
    const userRoles = target.roles.cache.filter((r) => r.id !== message.guild.id).map((r) => r.id);

    jailedUsers[target.id] = userRoles;
    saveData("./jailedUsers.json", jailedUsers);

    await target.roles.set([CONFIG.JAIL_ROLE_ID]).catch(() => null);
    return message.reply(`🔒 تم سجن العضو ${target.user.tag} | السبب: ${reason}`);
  }

  // 18. أمر فك السجن (Unjail)
  if (command === "unjail") {
    if (!hasPermission(message.member, CONFIG.ROLES.JAIL)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى منشن العضو أو إضافة ID الخاص به.");

    const oldRoles = jailedUsers[target.id] || [];
    await target.roles.set(oldRoles).catch(() => null);
    delete jailedUsers[target.id];
    saveData("./jailedUsers.json", jailedUsers);

    return message.reply(`🔓 تم فك سجن العضو ${target.user.tag} وإعادة رتبة الأصليّة.`);
  }
});

// ============================================================
// INTERACTION CREATE (معالجة Slash Commands)
// ============================================================

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;

    if (commandName === "ban") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.BAN)) return interaction.reply({ content: "❌ لا تملك صلاحية.", ephemeral: true });
      const targetUser = interaction.options.getUser("user");
      const durationArg = interaction.options.getString("duration");
      const reason = interaction.options.getString("reason") || "بدون سبب";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (targetMember && !canModerateTarget(interaction.member, targetMember)) return interaction.reply({ content: "❌ لا يمكنك حظره.", ephemeral: true });
      let durationMs = durationArg ? ms(durationArg) : null;

      await interaction.guild.members.ban(targetUser.id, { reason });
      if (durationMs) {
        tempBans.push({ userId: targetUser.id, guildId: interaction.guild.id, expireAt: Date.now() + durationMs });
        saveData("./tempBans.json", tempBans);
      }
      return interaction.reply({ content: `✅ تم حظر ${targetUser.tag} | السبب: ${reason}` });
    }

    if (commandName === "leaderboard") {
      const sorted = Object.entries(userMsgCount).sort(([, a], [, b]) => b - a).slice(0, 10);
      const embed = new EmbedBuilder().setTitle("🏆 قائمة أفضل 10 متفاعلين في السيرفر").setColor("Gold");
      let desc = "";
      sorted.forEach(([id, count], idx) => { desc += `**#${idx + 1}** | <@${id}> — **${count}** رسالة\n`; });
      embed.setDescription(desc || "لا يوجد تفاعل مسجل.");
      return interaction.reply({ embeds: [embed] });
    }

    if (commandName === "jail") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.JAIL)) return interaction.reply({ content: "❌ لا تملك صلاحية.", ephemeral: true });
      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "بدون سبب";
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });

      jailedUsers[targetUser.id] = targetMember.roles.cache.filter((r) => r.id !== interaction.guild.id).map((r) => r.id);
      saveData("./jailedUsers.json", jailedUsers);

      await targetMember.roles.set([CONFIG.JAIL_ROLE_ID]).catch(() => null);
      return interaction.reply({ content: `🔒 تم سجن العضو ${targetUser.tag} | السبب: ${reason}` });
    }

    if (commandName === "unjail") {
      if (!hasPermission(interaction.member, CONFIG.ROLES.JAIL)) return interaction.reply({ content: "❌ لا تملك صلاحية.", ephemeral: true });
      const targetUser = interaction.options.getUser("user");
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!targetMember) return interaction.reply({ content: "❌ العضو غير موجود.", ephemeral: true });

      const oldRoles = jailedUsers[targetUser.id] || [];
      await targetMember.roles.set(oldRoles).catch(() => null);
      delete jailedUsers[targetUser.id];
      saveData("./jailedUsers.json", jailedUsers);

      return interaction.reply({ content: `🔓 تم فك سجن العضو ${targetUser.tag}.` });
    }
  }
});

// ============================================================
// LOGIN
// ============================================================

client.login(CONFIG.TOKEN);
