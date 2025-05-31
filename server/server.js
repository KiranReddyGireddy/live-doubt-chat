const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const usersPerRoom = {}; // { roomId: { socketId: username } }
const doubtsPerRoom = {}; // { roomId: [doubtObjects] }

io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("joinRoom", ({ videoId, username }) => {
    socket.join(videoId);

    if (!usersPerRoom[videoId]) usersPerRoom[videoId] = {};
    usersPerRoom[videoId][socket.id] = username;

    if (!doubtsPerRoom[videoId]) doubtsPerRoom[videoId] = [];

    io.to(videoId).emit("notification", `${username} joined the room`);
    io.to(videoId).emit("onlineUsers", Object.keys(usersPerRoom[videoId]).length);

    // Send existing doubts to this user
    socket.emit("loadDoubts", doubtsPerRoom[videoId]);
  });

  socket.on("chatMessage", ({ videoId, username, message }) => {
    io.to(videoId).emit("message", { username, message });
  });

  socket.on("newDoubt", (doubt) => {
    const { videoId } = doubt;
    if (!doubtsPerRoom[videoId]) doubtsPerRoom[videoId] = [];
    doubtsPerRoom[videoId].push(doubt);

    io.to(videoId).emit("newDoubt", doubt);
  });

  socket.on("updateDoubtStatus", ({ videoId, doubtId, solved }) => {
    if (!doubtsPerRoom[videoId]) return;
    let doubt = doubtsPerRoom[videoId].find(d => d.id === doubtId);
    if (doubt) {
      doubt.solved = solved;
      io.to(videoId).emit("doubtStatusUpdated", { doubtId, solved });
    }
  });

  socket.on("addReaction", ({ videoId, doubtId, reaction }) => {
    if (!doubtsPerRoom[videoId]) return;
    let doubt = doubtsPerRoom[videoId].find(d => d.id === doubtId);
    if (doubt) {
      if (!doubt.reactions) doubt.reactions = {};
      doubt.reactions[reaction] = (doubt.reactions[reaction] || 0) + 1;
      io.to(videoId).emit("reactionUpdated", { doubtId, reactions: doubt.reactions });
    }
  });

  socket.on("disconnect", () => {
    for (const roomId in usersPerRoom) {
      if (usersPerRoom[roomId][socket.id]) {
        const username = usersPerRoom[roomId][socket.id];
        delete usersPerRoom[roomId][socket.id];
        io.to(roomId).emit("notification", `${username} left the room`);
        io.to(roomId).emit("onlineUsers", Object.keys(usersPerRoom[roomId]).length);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
