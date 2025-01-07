import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const Lobby = () => {
  const [startTime, setStartTime] = useState("17:20"); // Time in IST
  const [appointmentDate, setAppointmentDate] = useState("2025-01-07"); // Date in IST
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");
  const [role, setRole] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      console.log("data going is", { email, room, role });
      socket.emit("room:join", { email, room, role });
    },
    [email, room, socket, role]
  );

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/room4/${room}`);
    },
    [navigate]
  );

  const handleFullRoom = useCallback(({message}) => {
    alert(message, "Please try another room");
    setRoom("");
  }, []);

  useEffect(() => {
    socket.on("room:join", handleJoinRoom);
    socket.on("room:full", handleFullRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
      socket.off("room:full", handleFullRoom);
    };
  }, [socket, handleJoinRoom, handleFullRoom]);

  // Calculate start and end times in IST
  const startDateTime = new Date(`${appointmentDate}T${startTime}`);
  const endDateTime = new Date(startDateTime);
  endDateTime.setHours(startDateTime.getHours() + 1); // Add 1 hour to start time

  const [currentTime, setCurrentTime] = useState(new Date()); // Automatically in the local timezone (assume IST)
  // Update currentTime every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval); // Cleanup the interval on unmount
  }, []);

  return (
    <div className="flex flex-col justify-start items-center">
      <h1>Lobby</h1>
      <form
        onSubmit={handleSubmitForm}
        className="flex flex-col justify-start items-center"
      >
        <label htmlFor="email" className="mr-2">
          Email ID
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-solid p-2"
        />
        <br />
        <label htmlFor="room" className="mr-2">
          Room Number
        </label>
        <input
          type="text"
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="border border-solid p-2"
        />
        <br />
        <label htmlFor="role" className="mr-2">
          Role
        </label>
        <input
          type="text"
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border border-solid p-2"
        />
        <br />
        {currentTime >= startDateTime && currentTime <= endDateTime ? (
          <button type="submit" className="bg-blue-600 px-6 py-2 text-white rounded-full">
            Start Therapy
          </button>
        ) : (
          <p className="text-red-600">
            You can only join during the appointment time (IST). {currentTime.toLocaleTimeString()}
          </p>
        )}
      </form>
    </div>
  );
};
// const endCall = useCallback(({email, id}) => {
  //   console.log(`${email} left the room.`);
  //     // Update UI to reflect that the user has left
  //     setRemoteSocketId(null);
  //     setRemoteStream(null);
  //     peer.setLocalDescription(null);
  //     peer.peer.removeTrack();
  //     peer.peer.close();
  //     navigateTo("/");
  // } ,[navigateTo]);

export default Lobby;
