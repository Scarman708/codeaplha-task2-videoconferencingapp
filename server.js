const express = require("express");
const app = express();
const server = require("http").Server(app);
app.set('view engine', 'ejs');
app.use(express.static('public'));

const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server, {
  cors: {
    origin: '*',
  }
});

const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);

app.get('/', (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get('/:room', (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, username) => {
    socket.join(roomId);

    // Add a check to ensure that the room exists and has clients before broadcasting
    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size > 1) { // Broadcast only if at least one other client exists
      setTimeout(() => {
        socket.to(roomId).emit("user-connected", userId, username);
      }, 1000);
    } else {
      console.log("No other users in room yet.");
    }

    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", { username, message });
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected");
      socket.to(roomId).emit("user-disconnected", userId);
      socket.leave(roomId);
    });
  });
});

server.listen(process.env.PORT || 3030);
