// ============================================================
// تحميل dotenv بشكل اختياري
// إذا كانت موجودة سيقرأ ملف .env محليًا.
// إذا لم تكن مثبتة، البوت يكمل عادي ويستخدم Environment Variables.
// ============================================================
try {
  require("dotenv").config();
  console.log("✅ تم تحميل متغيرات .env إن وجدت.");
} catch (error) {
  console.log(
    "ℹ️ dotenv غير مثبتة — سيتم استخدام Environment Variables / Replit Secrets.",
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

  // ============================================================
  // 🌿 إعدادات نظام الترحيب
  // ============================================================
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
    {
      id: "q1",
      label: "الاسم الشخصي",
      placeholder: "ماهو اسمك...",
      style: TextInputStyle.Short,
      required: true,
    },

    {
      id: "q2",
      label: "العمر",
      placeholder: "كم عمرك...",
      style: TextInputStyle.Short,
      required: true,
    },

    {
      id: "q3",
      label: "الدولة",
      placeholder: "ماهي دولتك...",
      style: TextInputStyle.Short,
      required: true,
    },

    {
      id: "q4",
      label: "خبراتك الادارية",
      placeholder: "اذكر خبرتك...",
      style: TextInputStyle.Paragraph,
      required: true,
    },

    {
      id: "q5",
      label: "كيف تفيد سيرفر غرناطة",
      placeholder: "كيف ستفيدنا في غرناطة...",
      style: TextInputStyle.Paragraph,
      required: true,
    },
  ],

  VOICE_BOTS: [
    {
      token: process.env.VOICE_BOT_1_TOKEN,
      channelId: "1442200304853582006",
      nickname: "قرطبة",
    },

    {
      token: process.env.VOICE_BOT_2_TOKEN,
      channelId: "1459647452151021746",
      nickname: "العامرية",
    },

    {
      token: process.env.VOICE_BOT_3_TOKEN,
      channelId: "1459647526331486465",
      nickname: "طريف",
    },

    {
      token: process.env.VOICE_BOT_4_TOKEN,
      channelId: "1459648205472927775",
      nickname: "قادش",
    },
  ],
};

// ============================================================
// التأكد من وجود التوكن
// ============================================================

if (!CONFIG.TOKEN) {
  console.error("");
  console.error("❌❌❌ خطأ: لم يتم العثور على TOKEN ❌❌❌");
  console.error("");
  console.error("تأكد أن عندك Secret باسم: TOKEN أو Granada_token");
  console.error("");
  process.exit(1);
}

// ============================================================
// البيانات
// ============================================================

let warnings = loadData("./warnings.json", {});
let tempRoles = loadData("./tempRoles.json", []);
let tempBans = loadData("./tempBans.json", []);

let applyStatus = false;
let userMsgCount = {};
let linkViolations = {};

// ============================================================
// Functions - Data & Helpers
// ============================================================

function loadData(path, fallback = {}) {
  try {
    if (fs.existsSync(path)) {
      return JSON.parse(fs.readFileSync(path, "utf8"));
    }
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
// Voice Channel Handler (ربط البوتات بالروم الصوتي)
// ============================================================

async function connectVoiceBot(botConfig, isMainBot = false, customClient = null) {
  const activeClient = customClient || client;
  try {
    const channel = await activeClient.channels.fetch(botConfig.channelId).catch(() => null);
    if (!channel) {
      console.log(`⚠️ لم يتم العثور على الروم الصوتي ${botConfig.channelId} للـ ${botConfig.nickname}`);
      return;
    }

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: false,
    });

    // إضافة مستمع أخطاء للاتصال الصوتي لتفادي انهيار البوت (Socket Closed Error)
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
// READY
// ============================================================

client.once("ready", async () => {
  console.log("");
  console.log("======================================");
  console.log(`✅ البوت الرئيسي جاهز: ${client.user.tag}`);
  console.log(`🆔 ID: ${client.user.id}`);
  console.log(`🌐 السيرفرات: ${client.guilds.cache.size}`);
  console.log("======================================");
  console.log("");

  // الاتصال بروم غرناطة
  await connectVoiceBot(
    {
      channelId: CONFIG.GRANADA_VOICE_CHANNEL_ID,
      nickname: "غرناطة",
    },
    true,
    client,
  );

  // التذكير كل ساعتين
  setInterval(
    () => {
      const channel = client.channels.cache.get(CONFIG.REMINDER_CHANNEL_ID);
      if (channel) {
        channel
          .send(
            `قولوا معي:
سُبْحَانَ اللهِ
وَالْحَمْدُ لِلّٰهِ
وَلَا إِلٰهَ إِلَّا اللهُ وَاللهُ أَكْبَرُ
وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللهِ الْعَلِيِّ الْعَظِيمِ
وَاللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ
كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلتانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللهِ وَبِحَمْدِهِ، سُبْحَانَ اللهِ الْعَظِيمِ. 🌿❤️`,
          )
          .catch(() => null);
      }
    },
    2 * 60 * 60 * 1000,
  );

  checkTempRoles();
  checkTempBans();
  startVoiceBots();
});

// ============================================================
// 🌿 نظام الترحيب بالأعضاء الجدد
// ============================================================

client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(CONFIG.WELCOME_CHANNEL_ID);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xc9a227)
    .setImage(CONFIG.WELCOME_IMAGE_URL)
    .setDescription(
      `🔥👋🏻 ياهلا والله بيك ${member}\n❤️ نورت السيرفر\n\n📋 اقرأ القوانين\n💬 استمتع معنا في الشات\n\n✨ نتمنى لك وقت ممتع`,
    );

  channel
    .send({
      content: `${member}`,
      embeds: [embed],
    })
    .catch(() => null);
});

// ============================================================
// الأوامر
// ============================================================

const validCommands = [
  "حظر",
  "باند",
  "ارجع",
  "فك_حظر",
  "طرد",
  "اسكات",
  "تايم",
  "تكلم",
  "تحدث",
  "سيرفر",
  "رول",
  "سحب_رول",
  "ازالة_رول",
  "قفل",
  "ق",
  "فتح",
  "ف",
  "تحذير",
  "انذار",
  "اعفاء",
  "تحذيرات",
  "رول-مؤقت",
  "لقب",
  "تفاعل",
  "تقديم",
  "قيفاواي",
  "سحب",
];

// ============================================================
// MESSAGE CREATE
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
      const member = await message.guild.members
        .fetch(userId)
        .catch(() => null);

      if (member && canModerateTarget(message.guild.members.me, member)) {
        await member
          .timeout(10 * 60 * 1000, "تكرار إرسال روابط ديسكورد")
          .catch(() => null);

        message.channel
          .send(
            `⚠️ تم إعطاء <@${userId}> تايم أوت لمدة 10 دقائق بسبب تكرار إرسال الروابط.`,
          )
          .catch(() => null);
      }

      linkViolations[userId] = 0;
    } else {
      message.channel
        .send(`يمنع إرسال روابط ديسكورد في سيرفر غرناطة نتمنى ألا تتكرر . 🌿`)
        .then((m) => setTimeout(() => m.delete().catch(() => null), 5000))
        .catch(() => null);
    }
    return;
  }

  // السلام
  const greetings = [
    "السلام عليكم",
    "السلام عليكم ورحمة الله وبركاته",
    "سلام عليكم",
    "سلام عليكم ورحمة الله وبركاته",
  ];

  if (greetings.includes(message.content.trim())) {
    return message.reply("وعليكم السلام ورحمة الله وبركاته");
  }

  // تحليل الأمر
  const args = message.content.trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (!validCommands.includes(command)) return;

  try {
    // 1. الباند / الحظر
    if (["حظر", "باند"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.BAN)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target =
        message.mentions.members.first() ||
        (await message.guild.members.fetch(args[0]).catch(() => null));

      if (!target) {
        return message.reply(
          'الاستخدام: باند @user [المدة] [السبب]\nمثال: باند @user 7d مخالفة القوانين\nاكتب "دائم" أو اتركها فارغة للحظر الدائم',
        );
      }

      if (!canModerateTarget(message.member, target)) {
        return message.reply(
          "❌ لا يمكنك حظر هذا العضو بسبب تفوق رتبته أو صلاحياته.",
        );
      }

      const durationArg = args[1];
      const reason = args.slice(2).join(" ") || "بدون سبب";

      let durationMs =
        durationArg && durationArg !== "دائم" ? ms(durationArg) : null;

      if (durationArg && durationArg !== "دائم" && !durationMs) {
        return message.reply(
          "❌ صيغة المدة غير صحيحة. مثال: `7d` أو `12h` أو `30m`.",
        );
      }

      await target.ban({
        reason: `${reason} | بواسطة: ${message.author.tag}`,
      });

      if (durationMs) {
        tempBans.push({
          userId: target.id,
          guildId: message.guild.id,
          expireAt: Date.now() + durationMs,
        });

        saveData("./tempBans.json", tempBans);
      }

      await message.reply(
        `✅ تم حظر ${target.user.tag} ${
          durationMs ? `لمدة ${durationArg}` : "بشكل دائم"
        } | السبب: ${reason}`,
      );
    }

    // 2. فك الحظر
    if (["ارجع", "فك_حظر"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.UNBAN)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const userId = args[0];
      if (!userId) return message.reply("الاستخدام: فك_حظر ID");

      await message.guild.bans.remove(userId);
      await message.reply("✅ تم فك الحظر عن العضو.");
    }

    // 3. الطرد
    if (command === "طرد") {
      if (!hasPermission(message.member, CONFIG.ROLES.KICK)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target =
        message.mentions.members.first() ||
        (await message.guild.members.fetch(args[0]).catch(() => null));

      if (!target) return message.reply("الاستخدام: طرد @user السبب");

      if (!canModerateTarget(message.member, target)) {
        return message.reply("❌ لا يمكنك طرد هذا العضو.");
      }

      const reason = args.slice(1).join(" ") || "بدون سبب";
      await target.kick(reason);
      await message.reply(`✅ تم طرد ${target.user.tag}.`);
    }

    // 4. التايم أوت
    if (["اسكات", "تايم"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target =
        message.mentions.members.first() ||
        (await message.guild.members.fetch(args[0]).catch(() => null));

      const time = args[1];

      if (!target || !time) {
        return message.reply("الاستخدام: اسكات @user المدة السبب");
      }

      if (!canModerateTarget(message.member, target)) {
        return message.reply("❌ لا يمكنك إعطاء تايم أوت لهذا العضو.");
      }

      const duration = ms(time);
      if (!duration) {
        return message.reply("❌ صيغة الوقت غير صحيحة (مثال: 10m, 1h, 1d)");
      }

      await target.timeout(duration, args.slice(2).join(" ") || "بدون سبب");
      await message.reply(
        `✅ تم إعطاء تايم أوت لـ ${target.user.tag} لمدة ${time}.`,
      );
    }

    // 5. فك التايم أوت
    if (["تكلم", "تحدث"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target =
        message.mentions.members.first() ||
        (await message.guild.members.fetch(args[0]).catch(() => null));

      if (!target) return message.reply("الاستخدام: تكلم @user");

      await target.timeout(null);
      await message.reply(`✅ تم فك التايم أوت عن ${target.user.tag}.`);
    }

    // 6. معلومات السيرفر
    if (command === "سيرفر") {
      const embed = new EmbedBuilder()
        .setTitle(`معلومات سيرفر ${message.guild.name}`)
        .addFields(
          {
            name: "عدد الأعضاء",
            value: `${message.guild.memberCount}`,
            inline: true,
          },
          {
            name: "تاريخ الإنشاء",
            value: `<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
        )
        .setColor("Blue");

      await message.channel.send({ embeds: [embed] });
    }

    // 7. إدارة الرتب
    if (command === "رول") {
      if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target = message.mentions.members.first();
      const role = message.mentions.roles.first();

      if (!target || !role) return message.reply("الاستخدام: رول @user @role");

      if (!canModerateTarget(message.member, target)) {
        return message.reply("❌ لا يمكنك تعديل رتب هذا العضو.");
      }

      await target.roles.add(role);
      await message.reply(`✅ تم إعطاء الرول ${role.name} لـ ${target.user.tag}`);
    }

    if (["سحب_رول", "ازالة_رول"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target = message.mentions.members.first();
      const role = message.mentions.roles.first();

      if (!target || !role) return message.reply("الاستخدام: سحب_رول @user @role");

      if (!canModerateTarget(message.member, target)) {
        return message.reply("❌ لا يمكنك تعديل رتب هذا العضو.");
      }

      await target.roles.remove(role);
      await message.reply(`✅ تم إزالة الرول ${role.name} من ${target.user.tag}`);
    }

    // 8. قفل وفتح الرومات
    if (["قفل", "ق"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const channel = message.mentions.channels.first() || message.channel;
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: false,
      });

      await message.reply(`🔒 تم إغلاق الروم ${channel}`);
    }

    if (["فتح", "ف"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.CHANNEL_MANAGEMENT)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const channel = message.mentions.channels.first() || message.channel;
      await channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: true,
      });

      await message.reply(`🔓 تم فتح الروم ${channel}`);
    }

    // 9. التحذيرات
    if (["تحذير", "انذار"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.WARNS)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target = message.mentions.members.first();
      const reason = args.slice(1).join(" ");

      if (!target || !reason) return message.reply("الاستخدام: تحذير @user السبب");

      if (!canModerateTarget(message.member, target)) {
        return message.reply("❌ لا يمكنك تحذير عضو رتبته أعلى منك أو تساويك.");
      }

      const warnCode = generateCode();
      if (!warnings[target.id]) warnings[target.id] = [];

      warnings[target.id].push({
        code: warnCode,
        reason,
        date: new Date().toLocaleDateString(),
      });

      saveData("./warnings.json", warnings);

      const embed = new EmbedBuilder()
        .setTitle("⚠️ تحذير جديد")
        .addFields(
          { name: "العضو", value: `${target.user.tag}`, inline: true },
          { name: "كود التحذير", value: `\`${warnCode}\``, inline: true },
          { name: "السبب", value: reason },
        )
        .setColor("Red");

      await message.channel.send({ embeds: [embed] });
    }

    if (command === "اعفاء") {
      if (!hasPermission(message.member, CONFIG.ROLES.WARNS)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const code = args[0];
      if (!code) return message.reply("يرجى كتابة كود التحذير.");

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

      await message.reply(
        found ? `✅ تم إزالة التحذير صاحب الكود ${code}` : "❌ الكود غير صحيح.",
      );
    }

    if (command === "تحذيرات") {
      const target = message.mentions.members.first();
      const embed = new EmbedBuilder()
        .setTitle("📋 قائمة التحذيرات")
        .setColor("Yellow");

      if (target) {
        const userWarns = warnings[target.id] || [];
        embed.setDescription(
          userWarns
            .map((w) => `• **الكود:** \`${w.code}\` | **السبب:** ${w.reason}`)
            .join("\n") || "لا يوجد تحذيرات.",
        );
      } else {
        let list = "";
        for (const id in warnings) {
          if (warnings[id].length > 0) {
            list +=
              `<@${id}>:\n` +
              warnings[id]
                .map((w) => `└ الكود: \`${w.code}\` - ${w.reason}`)
                .join("\n") +
              "\n";
          }
        }
        embed.setDescription(list || "لا يوجد تحذيرات مسجلة بالسيرفر.");
      }

      await message.channel.send({ embeds: [embed] });
    }

    // 10. رول مؤقت
    if (command === "رول-مؤقت") {
      if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target = message.mentions.members.first();
      const role = message.mentions.roles.first();
      const time = args[2];

      if (!target || !role || !time) {
        return message.reply("الاستخدام: رول-مؤقت @user @role المدة");
      }

      if (!canModerateTarget(message.member, target)) {
        return message.reply("❌ لا يمكنك إعطاء رول لهذا العضو.");
      }

      const duration = ms(time);
      if (!duration) return message.reply("❌ صيغة المدة غير صحيحة.");

      await target.roles.add(role);

      tempRoles.push({
        userId: target.id,
        roleId: role.id,
        guildId: message.guild.id,
        expireAt: Date.now() + duration,
      });

      saveData("./tempRoles.json", tempRoles);
      await message.reply("✅ تم إعطاء الرول المؤقت بنجاح.");
    }

    // 11. تغيير اللقب
    if (command === "لقب") {
      if (!hasPermission(message.member, CONFIG.ROLES.NICKNAME)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const target = message.mentions.members.first();
      const nick = args.slice(1).join(" ");

      if (!target || !nick) return message.reply("الاستخدام: لقب @user الاسم");

      if (!canModerateTarget(message.member, target)) {
        return message.reply("❌ لا يمكنك تغيير لقب هذا العضو.");
      }

      await target.setNickname(nick);
      await message.reply("✅ تم تغيير الاسم المستعار بنجاح.");
    }

    // 12. التفاعل
    if (command === "تفاعل") {
      const sorted = Object.entries(userMsgCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      const embed = new EmbedBuilder()
        .setTitle("🏆 قائمة أعلى 10 متفاعلين بالسيرفر")
        .setDescription(
          sorted
            .map(
              ([id, count], idx) =>
                `**#${idx + 1}** <@${id}> - \`${count}\` رسالة`,
            )
            .join("\n") || "لا توجد بيانات بعد.",
        )
        .setColor("Gold");

      await message.channel.send({ embeds: [embed] });
    }

    // 13. التقديم
    if (command === "تقديم") {
      if (!hasPermission(message.member, CONFIG.ROLES.APPLY)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const sub = args[0];

      if (sub === "فتح") {
        applyStatus = true;
        await message.reply("✅ تم فتح باب التقديم للإدارة.");
      } else if (sub === "إغلاق") {
        applyStatus = false;
        await message.reply("🚫 تم إغلاق باب التقديم للإدارة.");
      } else if (sub === "إرسال") {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("apply_btn")
            .setLabel("تقديم على الإدارة")
            .setStyle(ButtonStyle.Primary),
        );

        await message.channel.send({
          content: "اضغط على الزر للتقديم:",
          components: [row],
        });
      } else if (sub === "قبول" || sub === "رفض") {
        const accepted = sub === "قبول";
        const target =
          message.mentions.members.first() ||
          (await message.guild.members.fetch(args[1]).catch(() => null));

        if (!target) {
          return message.reply(
            `الاستخدام: تقديم ${sub} @user ${
              accepted ? "[الرتبة الممنوحة]" : "[سبب الرفض]"
            }`,
          );
        }

        const extra = args.slice(2).join(" ");

        const embed = new EmbedBuilder()
          .setTitle(
            accepted ? "✅ تم قبول متقدم جديد على الإدارة!" : "❌ تم رفض متقدم",
          )
          .setDescription(`العضو: ${target}`)
          .setColor(accepted ? "Green" : "Red")
          .setTimestamp();

        if (extra) {
          embed.addFields({
            name: accepted ? "الرتبة الممنوحة" : "سبب الرفض",
            value: extra,
          });
        }

        await message.channel.send({ embeds: [embed] });
        await target.send({ embeds: [embed] }).catch(() => null);
      } else {
        await message.reply(
          "الاستخدام: تقديم فتح | تقديم إغلاق | تقديم إرسال | تقديم قبول @user [الرتبة] | تقديم رفض @user [السبب]",
        );
      }
    }

    // 14. Giveaway
    if (["قيفاواي", "سحب"].includes(command)) {
      if (!hasPermission(message.member, CONFIG.ROLES.GIVEAWAY)) {
        return message.reply("❌ ليس لديك الصلاحيات لاستخدام هذا الأمر.");
      }

      const time = args[0];
      const prize = args.slice(1).join(" ");

      if (!time || !prize || !ms(time)) {
        return message.reply("الاستخدام: سحب [المدة مثل 1h] [الجائزة]");
      }

      const embed = new EmbedBuilder()
        .setTitle("🎉 سحب جديد (Giveaway)")
        .setDescription(`الجائزة: **${prize}**\nالوقت: ${time}`)
        .setColor("Purple");

      const msg = await message.channel.send({ embeds: [embed] });
      await msg.react("🎉");

      setTimeout(async () => {
        const fetchedMsg = await message.channel.messages
          .fetch(msg.id)
          .catch(() => null);

        if (!fetchedMsg) return;

        const reaction = fetchedMsg.reactions.cache.get("🎉");
        const users = await reaction?.users.fetch();
        const winner = users?.filter((u) => !u.bot).random();

        await message.channel.send(
          winner
            ? `🎉 مبروك الفائز بالجائزة **${prize}**: ${winner}!`
            : "❌ لم يشارك أحد بالسحب.",
        );
      }, ms(time));
    }
  } catch (err) {
    console.error(`خطأ أثناء تنفيذ الأمر ${command}:`, err);
    await message
      .reply(
        "❌ حدث خطأ أثناء تنفيذ الأمر، يرجى التأكد من صلاحيات البوت ورتبته.",
      )
      .catch(() => null);
  }
});

// ============================================================
// التقديمات - Buttons / Modals
// ============================================================

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton() && interaction.customId === "apply_btn") {
    if (!applyStatus) {
      return interaction.reply({
        content: "🚫 التقديم مغلق حالياً.",
        ephemeral: true,
      });
    }

    const modal = new ModalBuilder()
      .setCustomId("apply_modal")
      .setTitle("استمارة التقديم للإدارة");

    const rows = [];
    for (const q of CONFIG.APPLY_QUESTIONS) {
      const input = new TextInputBuilder()
        .setCustomId(q.id)
        .setLabel(q.label)
        .setPlaceholder(q.placeholder)
        .setStyle(q.style)
        .setRequired(q.required);

      rows.push(new ActionRowBuilder().addComponents(input));
    }

    modal.addComponents(rows);
    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "apply_modal") {
    await interaction.deferReply({ ephemeral: true });

    const embed = new EmbedBuilder()
      .setTitle("📩 تقديم إدارة جديد")
      .setColor("Green")
      .setThumbnail(interaction.user.displayAvatarURL())
      .setTimestamp()
      .addFields({ name: "المتقدم", value: `${interaction.user} (${interaction.user.id})` });

    for (const q of CONFIG.APPLY_QUESTIONS) {
      const value = interaction.fields.getTextInputValue(q.id);
      embed.addFields({ name: q.label, value: value || "لا يوجد إجابة" });
    }

    await interaction.channel.send({ embeds: [embed] });
    await interaction.editReply({ content: "✅ تم إرسال تقديمك بنجاح، بالتوفيق!" });
  }
});

// ============================================================
// تسجيل الدخول
// ============================================================

client.login(CONFIG.TOKEN);