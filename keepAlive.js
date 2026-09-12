const express = require('express');
const server = express();

const PORT = process.env.PORT || 3000;

server.all('/', (req, res) => {
    res.send('Bot is alive!');
});

// تشغيل السيرفر تلقائياً فور استدعاء الملف
server.listen(PORT, () => {
    console.log(`✅ KeepAlive Server Listening on Port ${PORT}`);
});

module.exports = server;