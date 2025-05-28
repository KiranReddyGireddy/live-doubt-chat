const socket = io();
let videoId = "";

function loadVideo() {
  const link = document.getElementById("youtubeLink").value;
  const match = link.match(/(?:v=|\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match) {
    videoId = match[1];
    document.getElementById("youtubePlayer").src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    socket.emit("joinRoom", videoId);
    document.getElementById("chatBox").innerHTML = ""; // Clear previous chat
  } else {
    alert("Invalid YouTube link.");
  }
}

function sendMessage() {
  const msg = document.getElementById("msgInput").value;
  if (msg.trim()) {
    socket.emit("chatMessage", { videoId, msg });
    document.getElementById("msgInput").value = "";
  }
}

socket.on("message", (msg) => {
  const chatBox = document.getElementById("chatBox");
  const div = document.createElement("div");
  div.textContent = msg;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});
