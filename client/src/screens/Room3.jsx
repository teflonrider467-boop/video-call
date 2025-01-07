import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const Room2 = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  // States for controlling playback and mute
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [remoteMuted, setRemoteMuted] = useState(false);

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      const offer = await peer.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer });
      setMyStream(stream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Error accessing your camera or microphone.");
    }
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: isMuted,
          video: isPlaying,
        });
        setMyStream(stream);

        const answer = await peer.getAnswer(offer);
        socket.emit("call:accepted", { to: from, answer });
      } catch (error) {
        console.error("Error during incoming call:", error);
        alert("An error occurred while handling the incoming call.");
      }
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const handleCallAccepted = useCallback(
    async ({ from, answer }) => {
      try {
        await peer.setLocalDescription(answer);
        sendStreams();
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    },
    [sendStreams]
  );

  useEffect(() => {
    peer.peer.addEventListener("track", (ev) => {
      const remoteStream = ev.streams[0];
      setRemoteStream(remoteStream);
    });

    return () => {
      peer.peer.removeEventListener("track", () => {});
    };
  }, []);

  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
    };
  }, [socket, handleUserJoined, handleIncommingCall, handleCallAccepted]);

  return (
    <div>
      <h1 className="text-4xl">Room Page</h1>
      <h4>{remoteSocketId ? "Connected" : "No one in room"}</h4>
      {myStream && (
        <button
          onClick={sendStreams}
          className="bg-green-500 text-white rounded-full px-6 py-2"
        >
          Send Stream
        </button>
      )}
      {remoteSocketId && (
        <button
          onClick={handleCallUser}
          className="bg-green-500 text-white rounded-full px-6 py-2"
        >
          CALL
        </button>
      )}
      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
            muted={isMuted}
            height="100px"
            width="200px"
            url={myStream}
          />
          <button
            onClick={() => setIsPlaying((prev) => !prev)}
            className="bg-blue-500 text-white rounded-full px-4 py-2 m-2"
          >
            {isPlaying ? "Pause My Stream" : "Play My Stream"}
          </button>
          <button
            onClick={() => setIsMuted((prev) => !prev)}
            className="bg-blue-500 text-white rounded-full px-4 py-2 m-2"
          >
            {isMuted ? "Unmute Myself" : "Mute Myself"}
          </button>
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
            muted={remoteMuted}
            height="100px"
            width="200px"
            url={remoteStream}
          />
          <button
            onClick={() => setRemoteMuted((prev) => !prev)}
            className="bg-red-500 text-white rounded-full px-4 py-2 m-2"
          >
            {remoteMuted ? "Unmute Remote Audio" : "Mute Remote Audio"}
          </button>
        </>
      )}
    </div>
  );
};

export default Room2;
