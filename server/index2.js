const { Server } = require("socket.io");

const io = new Server(8000, {
  cors: true,
});

const emailToSocketIdMap = new Map();
const socketidToEmailMap = new Map();

const rooms = {};

io.on("connection", (socket) => {
  console.log(`Socket Connected: ${socket.id}`);

  // Handle user joining a room
  socket.on("room:join", (data) => {
    let { email, room } = data;
    console.log(`data is: ${email}, ${room}`);

    // Map email to socket id and vice versa
    emailToSocketIdMap.set(email, socket.id);
    socketidToEmailMap.set(socket.id, email);

    room = room.toString().trim();

    // Initialize room if it doesn't exist
    if (!rooms[room]) {
      rooms[room] = [];
    }

    // Check if the room is already full (max 2 users)
    if (rooms[room].length >= 2) {
      // Notify user that the room is full
      io.to(socket.id).emit("room:full", {
        message: "Room is full. You cannot join.",
      });
      return;
    }

    // Add user to the room's email list if not already present
    if (!rooms[room].some((user) => user.email === email)) {
      rooms[room].push({ email, id: socket.id });
    }

    // Join the Socket.IO room
    socket.join(room);

    // handle navigate to room.jsx below
    io.to(socket.id).emit("room:join", { email, room });

    // Get socket ID of user already in the room (excluding the current user)
    const userInRoom = rooms[room].filter((item) => item.email !== email);
    console.log("user in room is", userInRoom);

    const existingUserSocketId = userInRoom[0]?.id;

    console.log("ID of user in room is", existingUserSocketId);

    // Notify users about the joining user
    // Notify all users in the room about the new user
    io.to(room).emit("user:joined", { email, id: socket.id });

    // Notify the joining user about others in the room
    console.log("Emitting room:joined with data:", {
      user: existingUserSocketId,
    });

    io.to(socket.id).emit("room:joined", {
      user: existingUserSocketId,
    });

    console.log(
      "room:joined event emitted to:",
      socket.id,
      "existingUserSocketId :",
      existingUserSocketId
    );

    console.log(
      `User ${email}, ${socket.id} joined room ${room}, ${rooms[room]}`
    );
  });

  // Handle call events
  socket.on("user:call", ({ to, offer }) => {
    console.log("hit", offer);
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    console.log("hit", ans);
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    const email = socketidToEmailMap.get(socket.id);
    if (email) {
      // Remove the socket from the maps
      emailToSocketIdMap.delete(email);
      socketidToEmailMap.delete(socket.id);

      console.log(`User ${email} disconnected. Socket ID: ${socket.id}`);

      let removedRoomId = null;

      for (let roomId in rooms) {
        // Filter out the user with the given email in the current room
        const users = rooms[roomId];
        const updatedUsers = users.filter((user) => user.email !== email);

        // If the user was removed, update the room and store the roomId
        if (updatedUsers.length !== users.length) {
          rooms[roomId] = updatedUsers;
          removedRoomId = roomId;
          break; // Exit the loop once the user is found and removed
        }
      }

      // Make the socket leave the room
      socket.leave(removedRoomId);

      // Notify other users in the room that the user left
      io.to(removedRoomId).emit("user:left", { email, id: socket.id });

      // Loop through each room the user is part of
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          // Ignore the socket's own room ID
          // Remove the user from the room
          if (rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter(
              (user) => user.email !== email
            );
            console.log(`Updated room ${roomId}:`, rooms[roomId]);
          }

          // Make the socket leave the room
          socket.leave(roomId);

          // Notify other users in the room that the user left
          io.to(roomId).emit("user:left", { email, id: socket.id });
        }
      }
    }
  });
});
