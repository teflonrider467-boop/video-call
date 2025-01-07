import React, { useEffect, useCallback, useState } from "react";
import { useSocket } from "../context/SocketProvider";
// for streaming video and audio
import ReactPlayer from "react-player";

import peer from "../service/peer";

const Room = () => {
  const socket = useSocket();
  // this state is storing the socket id of the user that the who already joined the call wants to call
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();

  const handleUserJoined = useCallback((email, id) => {
    console.log("user joined", email, id);
    // when new user joins we will set the remoteSocketId to socket.id, which we are recieving as id from server
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    //rendering our own stream before calling user
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    // now we will send our own stream to person we want to call, here we will create a folder called service where our webRTC service will be made called peer.js

    // now we will create an offer, which is to be send to the user we are calling
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });

    // now to render our stream we will use react-player
    setMyStream(stream);
  }, []);

  const handleIncomingCall = useCallback(
    async ({ from, offer }) => {
      console.log(`incoming call ${from} ${offer}`);
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);

      // before accepting the call we will turn on the user's stream

      // accepting the call
      const ans = await peer.getAnswer(offer);

      // now we need to send this answer the user who called
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const handleCallAccepted = useCallback(async (from, ans) => {
    // whenever our call gets accepted we need set it in our local description
    peer.setLocalDescription(ans);
    console.log("Call Accepted");
  }, []);

  // whenever a user would try to enter a room, we will also do a broadcast that a new user is joining
  useEffect(() => {
    // handle backend response of a user joining the room
    socket.on("user:joined", handleUserJoined);
    // handle backend response of a user recieving a call
    socket.on("incoming:call", handleIncomingCall);
    // handle backend response of a user accepting a call
    socket.on("call:accepted", handleCallAccepted);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incoming:call", handleIncomingCall);
      socket.off("call:accepted", handleCallAccepted);
    };
  }, [socket, handleUserJoined]);
  return (
    <div className={`${remoteSocketId && "bg-blue-600"}`}>
      <h1 className="text-4xl">Room</h1>
      {remoteSocketId && (
        <button
          className="bg-green-500 text-white rounded-full px-6 py-2"
          onClick={handleCallUser}
        >
          Call
        </button>
      )}
      <h1>My Stream</h1>
      {myStream && (
        <ReactPlayer
          playing
          muted
          height="320px"
          width="320px"
          url={myStream}
        />
      )}
    </div>
  );
};

export default Room;
