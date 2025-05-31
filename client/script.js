const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let doubts = []; // Store doubts in memory for demo, ideally use DB

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("joinRoom", ({ videoId, username }) => {
    socket.join(videoId);
    socket.username = username;
    socket.videoId = videoId;

    // Send current doubts for this video
    const currentDoubts = doubts.filter((d) => d.videoId === videoId);
    socket.emit("loadDoubts", currentDoubts);

    io.to(videoId).emit("onlineUsers", io.sockets.adapter.rooms.get(videoId)?.size || 1);
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
      io.to(socket.videoId).emit("notification", `${socket.username} left the room`);
      io.to(socket.videoId).emit("onlineUsers", io.sockets.adapter.rooms.get(socket.videoId)?.size - 1 || 0);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
