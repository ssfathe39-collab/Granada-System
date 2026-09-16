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
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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

  JAIL_ROLE_ID: "1513691033815220334", // ID رول المسجون

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

  if (winners.length > 0) {
    channel.send(`🎉 مبارك ${winnerText}! لقد فزتم بـ **${gw.prize}**!`).catch(() => null);
  } else {
    channel.send(`⚠️ انتهى القيف أواي على **${gw.prize}** ولكن لم يشارك أحد.`).catch(() => null);
  }
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
  console.log("\n======================================");
  console.log(`✅ البوت الرئيسي جاهز: ${client.user.tag}`);
  console.log("======================================\n");

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
// أزرار القيف أواي
// ============================================================

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId === "join_giveaway") {
    const gw = giveaways[interaction.message.id];
    if (!gw || gw.ended) {
      return interaction.reply({ content: "❌ انتهى هذا القيف أواي بالفعل.", flags: 64 });
    }

    if (!gw.entries) gw.entries = [];

    const userIndex = gw.entries.indexOf(interaction.user.id);
    if (userIndex !== -1) {
      gw.entries.splice(userIndex, 1);
      saveData("./giveaways.json", giveaways);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("join_giveaway").setLabel(`🎉 اشتراك (${gw.entries.length})`).setStyle(ButtonStyle.Primary)
      );
      await interaction.message.edit({ components: [row] }).catch(() => null);

      return interaction.reply({ content: "❌ تم إلغاء مشاركتك في القيف أواي.", flags: 64 });
    } else {
      gw.entries.push(interaction.user.id);
      saveData("./giveaways.json", giveaways);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("join_giveaway").setLabel(`🎉 اشتراك (${gw.entries.length})`).setStyle(ButtonStyle.Primary)
      );
      await interaction.message.edit({ components: [row] }).catch(() => null);

      return interaction.reply({ content: "✅ تم تسجيل مشاركتك في القيف أواي بنجاح! بالتوفيق!", flags: 64 });
    }
  }
});

// ============================================================
// MESSAGE CREATE
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
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى منشن العضو أو معرف العضو المعاقب.");

    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك حظر هذا العضو.");

    const durationArg = args[1];
    const reason = args.slice(2).join(" ") || args.slice(1).join(" ") || "بدون سبب";
    let durationMs = durationArg ? ms(durationArg) : null;

    await message.guild.members.ban(target.id, { reason: `${reason} | بواسطة: ${message.author.tag}` });
    if (durationMs) {
      tempBans.push({ userId: target.id, guildId: message.guild.id, expireAt: Date.now() + durationMs });
      saveData("./tempBans.json", tempBans);
    }
    return message.reply(`✅ تم حظر ${target.user.tag} ${durationMs ? `لمدة ${durationArg}` : "بشكل دائم"} | السبب: ${reason}`);
  }

  // 2. أمر فك الباند
  if (command === "ارجع") {
    if (!hasPermission(message.member, CONFIG.ROLES.UNBAN)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const userId = args[0];
    if (!userId) return message.reply("❌ يرجى كتابة يوزر أو معرف العضو المحظور.");

    await message.guild.bans.remove(userId).catch(() => null);
    return message.reply(`✅ تم فك الحظر عن العضو (${userId}).`);
  }

  // 3. أمر طرد
  if (command === "طرد") {
    if (!hasPermission(message.member, CONFIG.ROLES.KICK)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى منشن أو معرف العضو المحظور.");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك طرد هذا العضو.");

    const reason = args.slice(1).join(" ") || "بدون سبب";
    await target.kick(reason);
    return message.reply(`✅ تم طرد العضو ${target.user.tag} | السبب: ${reason}`);
  }

  // 4. أمر تايم اوت
  if (command === "تايم_اوت" || command === "تايم-اوت" || command === "اسكات") {
    if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى منشن أو معرف العضو.");
    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك إسكات هذا العضو.");

    const durationMs = ms(args[1]);
    if (!durationMs) return message.reply("❌ يرجى تحديد المدة بشكل صحيح (مثل 10m, 1h).");

    const reason = args.slice(2).join(" ") || "بدون سبب";
    await target.timeout(durationMs, reason);
    return message.reply(`✅ تم إعطاء تايم أوت لـ ${target.user.tag} لمدة ${args[1]}.`);
  }

  // 5. أمر فك تايم اوت
  if (command === "تحدث" || command === "احكي" || command === "تكلم") {
    if (!hasPermission(message.member, CONFIG.ROLES.TIMEOUT)) return message.reply("❌ ليس لديك صلاحية لاستخدام هذا الأمر.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ يرجى منشن أو معرف العضو.");

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
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply("❌ طريقة الاستخدام: `رول [يوزر/معرف العضو] [الرول]`");

    await target.roles.add(role);
    return message.reply(`✅ تم إعطاء الرول **${role.name}** لـ ${target.user.tag}`);
  }

  // 8. أمر ازالة رول
  if (rawContent.startsWith("سحب رول") || command === "سحب_رول") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
    if (!target || !role) return message.reply("❌ طريقة الاستخدام: `سحب رول [يوزر/معرف العضو] [الرول]`");

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
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const reason = args.slice(1).join(" ");
    if (!target || !reason) return message.reply("❌ طريقة الاستخدام: `تحذير [يوزر/معرف العضو] [السبب]`");

    const warnCode = generateCode();
    if (!warnings[target.id]) warnings[target.id] = [];
    warnings[target.id].push({ code: warnCode, reason, date: new Date().toLocaleDateString() });
    saveData("./warnings.json", warnings);

    return message.reply(`⚠️ تم تحذير ${target.user.tag} | الكود: \`${warnCode}\` | السبب: ${reason}`);
  }

  // 12. أمر اعفاء
  if (command === "اعفاء" || command === "عفو") {
    if (!hasPermission(message.member, CONFIG.ROLES.WARNS)) return message.reply("❌ ليس لديك صلاحية.");
    const query = args[0];
    if (!query) return message.reply("❌ طريقة الاستخدام: `اعفاء [منشن العضو / معرف العضو / كود التحذير]`");

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
    const embed = new EmbedBuilder().setTitle("📋 قائمة التحذيرات").setColor("Orange");

    if (target) {
      const list = warnings[target.id] || [];
      if (!list.length) return message.reply("✅ لا يوجد تحذيرات مسجلة لهذا العضو.");
      embed.setDescription(list.map((w) => `• الكود: \`${w.code}\` | السبب: ${w.reason} | التاريخ: ${w.date}`).join("\n"));
    } else {
      let total = "";
      for (const uid in warnings) {
        if (warnings[uid].length > 0) {
          total += `<@${uid}>: ${warnings[uid].length} تحذير(ات)\n`;
        }
      }
      embed.setDescription(total || "لا توجد تحذيرات مسجلة في السيرفر.");
    }
    return message.reply({ embeds: [embed] });
  }

  // 14. أمر رول مؤقت
  if (rawContent.startsWith("رول مؤقت") || command === "رول_مؤقت") {
    if (!hasPermission(message.member, CONFIG.ROLES.ROLES_MANAGEMENT)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const durationMs = ms(args[1]);
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);

    if (!target || !role || !durationMs) return message.reply("❌ طريقة الاستخدام: `رول مؤقت [يوزر/معرف العضو] [المدة] [الرول]`");

    await target.roles.add(role);
    tempRoles.push({ userId: target.id, guildId: message.guild.id, roleId: role.id, expireAt: Date.now() + durationMs });
    saveData("./tempRoles.json", tempRoles);

    return message.reply(`✅ تم إعطاء ${target.user.tag} الرول **${role.name}** لمدة ${args[1]}`);
  }

  // 15. أمر لقب
  if (command === "لقب" || command === "اسم") {
    if (!hasPermission(message.member, CONFIG.ROLES.NICKNAME)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    const newNick = args.slice(1).join(" ");

    if (!target || !newNick) return message.reply("❌ طريقة الاستخدام: `لقب [يوزر/معرف العضو] [الاسم المستعار]`");
    await target.setNickname(newNick);
    return message.reply(`✅ تم تغيير الاسم المستعار لـ ${target.user.tag} إلى **${newNick}**`);
  }

  // 16. أمر تفاعل
  if (command === "تفاعل" || command === "المتفاعلين" || command === "التفاعل") {
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

  // 17. أمر سجن (المصحح والمطور)
  if (command === "سجن") {
    if (!hasPermission(message.member, CONFIG.ROLES.JAIL)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ طريقة الاستخدام: `سجن [يوزر/معرف العضو] [السبب]`");

    if (!canModerateTarget(message.member, target)) return message.reply("❌ لا يمكنك سجن هذا العضو.");

    const reason = args.slice(1).join(" ") || "بدون سبب";
    
    // تصفية وحفظ رتب العضو التي يستطيع البوت إدارتها
    const assignableRoles = target.roles.cache.filter((r) => r.id !== message.guild.id && !r.managed);
    const userRoleIds = assignableRoles.map((r) => r.id);

    jailedUsers[target.id] = userRoleIds;
    saveData("./jailedUsers.json", jailedUsers);

    try {
      if (userRoleIds.length > 0) {
        await target.roles.remove(userRoleIds).catch((e) => console.error("❌ فشل سحب بعض الرتب:", e.message));
      }
      await target.roles.add(CONFIG.JAIL_ROLE_ID);
      return message.reply(`🔒 تم سجن العضو ${target.user.tag} بنجاح | السبب: ${reason}`);
    } catch (err) {
      console.error("❌ خطأ أثناء السجن:", err);
      return message.reply("⚠️ حدث خطأ أثناء تنفيذ السجن. يرجى التأكد من أن رتبة البوت أعلى من رتبة العضو المراد سجنه.");
    }
  }

  // 18. أمر إفراج (المصحح والمطور)
  if (command === "افراج" || rawContent.startsWith("فك سجن") || command === "فك_سجن") {
    if (!hasPermission(message.member, CONFIG.ROLES.JAIL)) return message.reply("❌ ليس لديك صلاحية.");
    const target = message.mentions.members.first() || await message.guild.members.fetch(args[0]).catch(() => null);
    if (!target) return message.reply("❌ طريقة الاستخدام: `افراج [يوزر/معرف العضو]`");

    const oldRoles = jailedUsers[target.id] || [];

    try {
      // 1. إزالة رول السجن أولاً
      await target.roles.remove(CONFIG.JAIL_ROLE_ID).catch(() => null);

      // 2. إرجاع الرتب المخبأة
      if (oldRoles.length > 0) {
        await target.roles.add(oldRoles).catch((e) => console.error("❌ فشل إرجاع بعض الرتب عند الإفراج:", e.message));
      }

      // 3. مسح البيانات المنسوبة للعضو
      delete jailedUsers[target.id];
      saveData("./jailedUsers.json", jailedUsers);

      return message.reply(`🔓 تم الإفراج عن ${target.user.tag} وإعادة (${oldRoles.length}) رول له بنجاح.`);
    } catch (err) {
      console.error("❌ خطأ أثناء الإفراج:", err);
      return message.reply("❌ حدث خطأ أثناء فك السجن، يرجى التأكد من صلاحية البوت ورتبته بالسيرفر.");
    }
  }

  // 19. أمر قيفاواي
  if (command === "قيفاواي" || command === "سحب") {
    if (!hasPermission(message.member, CONFIG.ROLES.GIVEAWAY)) return message.reply("❌ ليس لديك صلاحية لاستخدام أمر السحب.");

    const durationStr = args[0];
    const winnersCount = parseInt(args[1]);
    const prize = args.slice(2).join(" ");

    if (!durationStr || isNaN(winnersCount) || !prize) {
      return message.reply("❌ طريقة الاستخدام: `قيفاواي [المدة] [عدد الفائزين] [الجائزة]`\n💡 مثال: `قيفاواي 1h 2 نيترو قيمنق`");
    }

    const durationMs = ms(durationStr);
    if (!durationMs) return message.reply("❌ صيغة الوقت غير صحيحة. مثال: `10m`, `1h`, `1d`");

    const endAt = Date.now() + durationMs;

    const embed = new EmbedBuilder()
      .setTitle(`🎉 **قـيـف أواي: ${prize}** 🎉`)
      .setDescription(`اضغط على الزر بالأسفل للإشتراك!\n\n👑 **عدد الفائزين:** ${winnersCount}\n⏰ **ينتهي:** <t:${Math.floor(endAt / 1000)}:R>\n👤 **بواسطة:** ${message.author}`)
      .setColor("Purple")
      .setTimestamp(endAt);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("join_giveaway").setLabel("🎉 اشتراك (0)").setStyle(ButtonStyle.Primary)
    );

    await message.delete().catch(() => null);
    const gwMsg = await message.channel.send({ embeds: [embed], components: [row] });

    giveaways[gwMsg.id] = {
      channelId: message.channel.id,
      prize: prize,
      winnersCount: winnersCount,
      endAt: endAt,
      ended: false,
      entries: [],
    };

    saveData("./giveaways.json", giveaways);
  }
});

// ============================================================
// LOGIN
// ============================================================

client.login(CONFIG.TOKEN);
