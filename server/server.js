const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from client folder
app.use(express.static(path.join(__dirname, "../client")));

io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("joinRoom", (videoId) => {
    socket.join(videoId);
    console.log(`User joined room: ${videoId}`);
  });

  socket.on("chatMessage", ({ videoId, msg }) => {
    io.to(videoId).emit("message", msg);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
