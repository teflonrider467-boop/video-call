import { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";
import end__call from "../assets/end__call.svg";
import mic__controls from "../assets/mic__control.svg";
import video__controls from "../assets/video__control.svg";
import not__mic__controls from "../assets/not__audio__control.svg";
import not__video__controls from "../assets/not__video__control.svg";
import open__chat from "../assets/open__chat.svg";
import close__chat from "../assets/close__chat.svg";

const Room4 = ({ isDoctor }) => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  const [openChat, setOpenChat] = useState(true);
  const toggleChat = () => {
    setOpenChat((prev) => !prev);
  };

  const [isChatting, setIsChatting] = useState(false);

  const preview = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert(
        "Error accessing your camera or microphone. Please check your permissions."
      );
    }
  }, []);

  const handleJoining = useCallback((data) => {
    console.log("data is", data);
    if (data.user) {
      setRemoteSocketId(data.user);
    }
  }, []);

  const [isCamera, setIsCamera] = useState(true); // use this for changing image

  const [isMic, setIsMic] = useState(true); // use this for changing image

  const sendStreams = useCallback(() => {
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }
  }, [myStream]);

  const toggleCamera = async () => {
    if (!myStream) {
      console.error("No stream available to toggle the camera");
      return;
    }

    const videoTrack = myStream.getVideoTracks()[0];
    let newStream;

    if (videoTrack && videoTrack.enabled) {
      // Camera is on, replace with a stream without video
      newStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace the video track with no video
      const sender = peerConnection
        .getSenders()
        .find((sender) => sender.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(newVideoTrack); // Will replace with no video track
      }
      console.log("Camera turned off");
    } else {
      // Camera is off, replace with a stream with video
      newStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      // Replace the video track with a video track
      const sender = peerConnection
        .getSenders()
        .find((sender) => sender.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(newVideoTrack); // Will replace with a video track
      }
      console.log("Camera turned on");
    }
  };

  const toggleMic = async () => {
    try {
      if (isMic) {
        // myStream.getAudioTracks().forEach((track) => track.stop());
        setIsMic(false);
        peer.peer
          .getSenders()
          .filter((sender) => sender.track.kind === "audio")
          .forEach((sender) => sender.replaceTrack(null));
        console.log("Microphone turned off.");
      } else {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const newAudioTrack = newStream.getAudioTracks()[0];
        const audioSender = peer.peer
          .getSenders()
          .find((sender) => sender.track.kind === "audio");
        if (audioSender) await audioSender.replaceTrack(newAudioTrack);
        setMyStream(
          (prevStream) =>
            new MediaStream([...prevStream.getVideoTracks(), newAudioTrack])
        );
        setIsMic(true);
        console.log("Microphone turned on.");
      }
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };

  const handleUserJoined = useCallback(({ email, id }) => {
    console.log(`Email ${email} joined room`);
    setRemoteSocketId(id);
  }, []);

  const handleCallUser = useCallback(async () => {
    try {
      const offer = await peer.getOffer();
      socket.emit("user:call", { to: remoteSocketId, offer });
    } catch (error) {
      console.error("Error calling:", error);
    }
  }, [remoteSocketId, socket]);

  const sendMessage = (message) => {
    if (peer.dataChannel) {
      let data = { text: message, self: false };
      peer.dataChannel.send(JSON.stringify(data));
      data.self = true;
      messages.push(data);
    } else {
      console.log("Data channel is not ready yet.");
    }
  };

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!", peer);
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  useEffect(() => {
    peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
    return () => {
      peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
    };
  }, [handleNegoNeeded]);

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    peer.peer.addEventListener("track", async (ev) => {
      console.log("ev is", ev);
      const remoteStream = ev.streams;
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    if (peer.dataChannel) {
      peer.dataChannel.onmessage = (event) => {
        setMessages((prevMessages) => [
          ...prevMessages,
          JSON.parse(event.data),
        ]);
      };
    }
  }, [peer.dataChannel]);

  useEffect(() => {
    socket.on("room:joined", handleJoining);
    preview();
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    // socket.on("user:left", endCall);

    return () => {
      socket.off("room:joined", handleJoining);
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
    };
  }, [
    preview,
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    handleJoining,
  ]);

  return (
    <div className="w-full h-dvh">
      <div className="fixed top-0 right-1/4 bg-red-600 z-50 mx-auto flex flex-col justify-center items-center">
        <h1 className="text-4xl">Room Page</h1>
        <h4>
          {remoteSocketId ? `Connected ${remoteSocketId}` : "No one in room"}
        </h4>
        <h4>Is Doctor: {isDoctor.toString()}</h4>
        {/* actual join below */}
        {myStream && remoteSocketId && isDoctor === "patient" && (
          <button
            onClick={sendStreams}
            className="bg-green-500 text-white rounded-full px-6 py-2"
          >
            Join room(Join Button)(send Stream)
          </button>
        )}
        {/* actual call below */}
        {myStream && remoteSocketId && isDoctor === "doctor" && (
          <button
            onClick={handleCallUser}
            className="bg-green-500 text-white rounded-full px-6 py-2"
          >
            CALL(Join Button)(createOffer)
          </button>
        )}
      </div>

      {/* below is where magic happens */}
      <div
        className={`grid h-full p-1 w-full  ${openChat ? "grid-cols-[42.19%_57.81%]" : "grid-cols-1"
          } `}
      >
        {/* left side(non-video chat) */}
        <div
          className={`flex flex-col justify-between items-start h-full ${openChat ? "block" : "hidden"
            }`}
        >
          {/* nav */}
          <div className="flex justify-start items-center gap-5 pb-1 border border-x-0 border-t-0 w-full">
            <p
              className={` underline-offset-4 hover:underline text-2xl font-medium cursor-pointer ${isChatting
                  ? "text-orange-500 underline text-primary-orange"
                  : "text-black"
                }`}
              onClick={() => setIsChatting(true)}
            >
              Chat
            </p>
            <p
              className={` underline-offset-4 hover:underline text-2xl font-medium cursor-pointer ${!isChatting
                  ? "text-orange-500 underline text-primary-orange"
                  : "text-black"
                }`}
              onClick={() => setIsChatting(false)}
            >
              Consultation Notes
            </p>
          </div>

          {/* chatting */}
          {isChatting && (
            <div className="w-full">
              <ul className="w-full p-2 h-dvh overflow-y-auto">
                {messages.map((msg, index) => (
                  <li
                    key={index}
                    className={`w-full h-fit p-2 flex items-center ${msg.self ? "justify-end" : "justify-start"
                      }`}
                  >
                    <div
                      className={`w-1/2 rounded-t-3xl px-4 py-2 text-left ${msg.self
                          ? "bg-gray-200 rounded-bl-3xl rounded-br-md"
                          : "bg-orange-200 rounded-br-3xl rounded-bl-md"
                        }`}
                    >
                      {msg.text}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* consultation notes */}
          {!isChatting && <div className="w-full"></div>}

          {/* text-input */}
          <div className="flex justify-between items-center gap-3 w-full">
            <input
              type="text"
              value={text}
              placeholder="Type a message..."
              className="py-3.5 px-6 border border-solid border-red-500 rounded-lg grow"
              onChange={(e) => setText(e.target.value)}
            />
            {/* add data to consultation notes or send chat based on isChatting */}
            <button
              onClick={() => {
                isChatting ? sendMessage(text) : setText("");
              }}
              className="px-3 h-full bg-red-500 text-white"
            >
              send
            </button>
          </div>
        </div>

        {/* video */}
        <div className="flex flex-col justify-start items-center gap-0 h-full w-full">
          {/* video streams below */}
          <div className="relative h-full w-full bg-black">
            {/* button to open chat */}
            <div className="absolute top-[5%] left-[2%] bg-white rounded-full p-3">
              <img
                src={close__chat}
                alt=""
                className={`${openChat ? "hidden" : ""}`}
                onClick={toggleChat}
              />
              <img
                src={open__chat}
                alt=""
                className={`${openChat ? "" : "hidden"}`}
                onClick={toggleChat}
              />
            </div>

            {/* preview of personal video */}
            <div className="absolute right-10 w-60 h-60 bottom-0">
              {myStream ? (
                <>
                  {/* <h1>My Stream</h1> */}
                  <ReactPlayer
                    playing
                    playsinline
                    // muted
                    height="100%"
                    width="100%"
                    url={myStream}
                    controls={true}
                  />
                </>
              ) : (
                <>
                  <div className="bg-black w-full h-full"></div>
                </>
              )}
            </div>

            {/* view of person to call */}
            <div className="w-full h-full">
              {remoteStream ? (
                <>
                  {/* <h1>Remote Stream</h1> */}
                  <ReactPlayer
                    playing
                    playsinline
                    height="100%"
                    width="100%"
                    url={remoteStream}
                  />
                </>
              ) : (
                <>
                  <div className="bg-black w-full h-full"></div>
                </>
              )}
            </div>
          </div>

          {/* controls below */}
          <div
            className="flex justify-center items-center gap-12 py-3 w-full h-[13%]"
            style={{ backgroundColor: "#9DA5B8" }}
          >
            <div
              className="bg-white rounded-full text-black w-[7%] h-[75%] p-3 flex justify-center items-center cursor-pointer"
              onClick={toggleCamera}
            >
              {isCamera ? (
                <img src={video__controls} alt="" />
              ) : (
                <img src={not__video__controls} alt="" />
              )}
            </div>
            <div
              className="rounded-[22px] w-[7%] h-[75%] p-3 flex justify-center items-center cursor-pointer"
              style={{ backgroundColor: "#FF0000" }}
            >
              <img src={end__call} alt="" />
            </div>
            <div
              className="bg-white rounded-full text-black w-[7%] h-[75%] p-3 flex justify-center items-center cursor-pointer"
              onClick={toggleMic}
            >
              {isMic ? (
                <img src={mic__controls} alt="" />
              ) : (
                <img src={not__mic__controls} alt="" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room4;
// this comment is by anshul
