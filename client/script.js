const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, "public")));

let doubts = []; // Temporary in-memory storage

io.on("connection", (socket) => {
  console.log("🔌 New client connected");

  socket.on("joinRoom", ({ videoId, username }) => {
    socket.join(videoId);
    socket.username = username;
    socket.videoId = videoId;

    // Send existing doubts for the video
    const currentDoubts = doubts.filter((d) => d.videoId === videoId);
    socket.emit("loadDoubts", currentDoubts);

    const room = io.sockets.adapter.rooms.get(videoId);
    const onlineCount = room ? room.size : 1;

    io.to(videoId).emit("onlineUsers", onlineCount);
    io.to(videoId).emit("notification", `${username} joined the room`);
  });

  socket.on("postDoubt", (data) => {
    const doubt = {
      id: uuidv4(),
      username: data.username,
      videoId: data.videoId,
      text: data.text,
      timestamp: data.timestamp || null,
      codeSnippet: data.codeSnippet || "",
      voiceNote: data.voiceNote || "",
      videoNote: data.videoNote || "",
      solved: false,
      reactions: {},
      createdAt: Date.now(),
    };
    doubts.push(doubt);
    io.to(data.videoId).emit("newDoubt", doubt);
  });

  socket.on("updateDoubtStatus", ({ doubtId, solved }) => {
    const doubt = doubts.find((d) => d.id === doubtId);
    if (doubt) {
      doubt.solved = solved;
      io.to(doubt.videoId).emit("doubtStatusUpdated", { doubtId, solved });
    }
  });

  socket.on("addReaction", ({ doubtId, reaction }) => {
    const doubt = doubts.find((d) => d.id === doubtId);
    if (doubt) {
      if (!doubt.reactions[reaction]) doubt.reactions[reaction] = 0;
      doubt.reactions[reaction]++;
      io.to(doubt.videoId).emit("reactionUpdated", { doubtId, reactions: doubt.reactions });
    }
  });

  socket.on("disconnecting", () => {
    if (socket.videoId && socket.username) {
      const room = io.sockets.adapter.rooms.get(socket.videoId);
      const currentSize = room ? room.size - 1 : 0;
      io.to(socket.videoId).emit("notification", `${socket.username} left the room`);
      io.to(socket.videoId).emit("onlineUsers", currentSize);
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 Client disconnected");
  });
});

// Fallback route (optional)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
