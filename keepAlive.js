const express = require('express');
const server = express();

// Render يحدد البورت تلقائياً عبر process.env.PORT، وإذا لم يجد يتم استخدام 3000
const PORT = process.env.PORT || 3000;

server.all('/', (req, res) => {
    res.send('Bot is alive!');
});

function keepAliveServer() {
    server.listen(PORT, () => {
        console.log(`Server is Ready on port ${PORT}!`);
    });
}

module.exports = keepAliveServer;
