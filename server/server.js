const express = require('express');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const app = express();

const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files from client
app.use(express.static(path.join(__dirname, '../client')));

// Serve index.html on root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Your existing socket.io logic here...
io.on('connection', (socket) => {
  console.log('New user connected');
  // ... handle events
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
