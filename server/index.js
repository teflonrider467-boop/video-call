// 1
const { Server } = require("socket.io");
const io = new Server(8000, {
  cors: true,
});

// we need to keep a track of which email is in which room
const emailToSocketMap = new Map();
const socketIdToEmailMap = new Map();

// below are basically event listners and the first event listener is for connection
io.on("connection", (socket) => {
  console.log("Socket connected", socket.id); // socket.io basically assigns an id to every connection

  // recieve request from user to join a room
  socket.on("room:join", (data) => {
    // console.log("incoming", data);
    const { email, room } = data;

    // set the maps, that is, store which email is in which room
    emailToSocketMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    // send response to the existing user that someone is joining the room
    io.to(room).emit("user:joined", { email, id: socket.id });

    // make the user join the room
    socket.join(room);

    // send response for room joining request
    io.to(socket.id).emit("room:join", data);
  });

  // recieve request from user to call another user
  socket.on("user:call", ({ to, offer }) => {
    // send response to the socket.id who our user in the room wants to call
    io.to(to).emit("incoming:call", { from: socket.id, offer });
  });

  // recieve request to accept the call
  socket.on("call:accepted", ({ to, ans }) => {
    // send response to the socket.id who our user in the room wants to join
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});
