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

const Room4 = () => {
  const socket = useSocket();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();
  const [isDoctor, setIsDoctor] = useState("");

  const [openChat, setOpenChat] = useState(false);
  const toggleChat = () => {
    setOpenChat((prev) => !prev);
  };

  const [isChatting, setIsChatting] = useState(false);

  const preview = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert(
          "Your browser does not support accessing media devices. Please use a modern browser like Chrome, Edge, or Firefox and ensure the app is served over HTTPS."
        );
        console.error("MediaDevices API is not available.");
        return;
      }
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
    setIsDoctor(data.isDoctor);
    if (data.user) {
      setRemoteSocketId(data.user);
    }
    if(!isDoctor){
      preview();
    }
  }, []);

  useEffect(() => {
    if (myStream) {
      setIsCamera(myStream.getVideoTracks()[0].enabled);
      setIsMic(myStream.getAudioTracks()[0].enabled);
    }
  }, [myStream]);

  const [isCamera, setIsCamera] = useState(true); // use this for changing image
  const toggleCamera = () => {
    if (isCamera) {
      myStream.getVideoTracks().forEach((track) => (track.enabled = isCamera));
      setIsCamera(false);
    } else {
      myStream.getVideoTracks().forEach((track) => (track.enabled = isCamera));
      setIsCamera(true);
    }
  };
  // const toggleCamera = () => {
  //   if (isCamera) {
  //     myStream.getVideoTracks()[0].enabled = false;
  //     setIsCamera(false);
  //   } else {
  //     myStream.getVideoTracks()[0].enabled = true;
  //     setIsCamera(true);
  //   }
  // };

  const [isMic, setIsMic] = useState(true); // use this for changing image
  const toggleMic = () => {
    if (isMic) {
      myStream.getAudioTracks().forEach((track) => (track.enabled = isMic));
      setIsMic(false);
    } else {
      myStream.getAudioTracks().forEach((track) => (track.enabled = isMic));
      setIsMic(true);
    }
  };
  // const toggleMic = () => {
  //   if (isMic) {
  //     myStream.getAudioTracks()[0].enabled = false;
  //     setIsMic(false);
  //   } else {
  //     myStream.getAudioTracks()[0].enabled = true;
  //     setIsMic(true);
  //   }
  // };

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

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      setRemoteSocketId(from);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
      // if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      //   alert("Your browser does not support accessing media devices.");
      //   console.error("MediaDevices API is not available.");
      //   return;
      // }

      // try {
      //   const stream = await navigator.mediaDevices.getUserMedia({
      //     audio: true,
      //     video: true,
      //   });
      //   setMyStream(stream);
      //   console.log(`Incoming Call`, from, offer);
      //   const ans = await peer.getAnswer(offer);
      //   socket.emit("call:accepted", { to: from, ans });
      // } catch (error) {
      //   console.error("Error accessing media devices:", error);
      //   alert(
      //     "Error accessing your camera or microphone. Please check your permissions."
      //   );
      // }
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
    ({ from, ans }) => {
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
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
      console.log("GOT TRACKS!!", remoteStream[0]);
      setRemoteStream(remoteStream[0]);
    });
  }, []);

  useEffect(() => {
    socket.on("room:joined", handleJoining);
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
    <div>
      <div className="fixed top-0 right-1/4 bg-red-600 z-50 mx-auto flex flex-col justify-center items-center">
        <h1 className="text-4xl">Room Page</h1>
        <h4>
          {remoteSocketId ? `Connected ${remoteSocketId}` : "No one in room"}
        </h4>
        <h4>
          Is Doctor: {isDoctor.toString()}
        </h4>
        {/* actual join below */}
        {myStream && remoteSocketId && !(isDoctor === "doctor") &&(
          <button
            onClick={sendStreams}
            className="bg-green-500 text-white rounded-full px-6 py-2"
          >
            Join room(Join Button)(send Stream)
          </button>
        )}
        {/* actual call below */}
        {myStream && remoteSocketId && (isDoctor === "doctor") && (
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
        className={`grid h-dvh py-2 ${
          openChat ? "grid-cols-[42.19%_57.81%]" : "grid-cols-1"
        } `}
      >
        {/* left side(non-video chat) */}
        <div
          className={`flex flex-col justify-between items-start h-full ${
            openChat ? "block" : "hidden"
          }`}
        >
          {/* nav */}
          <div className="flex justify-start items-center gap-5 pb-1 border border-x-0 border-t-0 w-full">
            <p
              className={` underline-offset-4 hover:underline font-medium cursor-pointer ${
                isChatting
                  ? "text-orange-500 underline text-primary-orange"
                  : "text-black"
              }`}
              onClick={() => setIsChatting(true)}
            >
              Chat
            </p>
            <p
              className={` underline-offset-4 hover:underline font-medium cursor-pointer ${
                !isChatting
                  ? "text-orange-500 underline text-primary-orange"
                  : "text-black"
              }`}
              onClick={() => setIsChatting(false)}
            >
              Consultation Notes
            </p>
          </div>

          {/* chatting */}
          <div>
            {/* 
            looking forward to store message with from and sentAt 
            then render them as div
            w-full px-3 py-1
            position-x = right if send from remoteSocketID
            position-y = sort messages based on sentAt

            */}
          </div>

          {/* consultation notes */}

          {/* text-input */}
          <div>
            <input type="text" className="p-3" />
            <button
              onClick={() => {
                console.log("clicked");
                // add data to consultation notes or send chat based on isChatting
              }}
            >
              send
            </button>
          </div>
        </div>

        {/* video */}
        <div className="relative flex flex-col justify-start items-center gap-0 h-full w-full bg-black">
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
          <div className="absolute right-0 w-60 h-60 bottom-10">
            {myStream ? (
              <>
                {/* <h1>My Stream</h1> */}
                <ReactPlayer
                  playing
                  muted
                  height="100%"
                  width="100%"
                  url={myStream}
                />
              </>
            ) : (
              <>
                <div className="bg-black w-full h-full"></div>
              </>
            )}
          </div>

          {/* view of person to call */}
          <div className="w-fit h-full">
            {remoteStream ? (
              <>
                {/* <h1>Remote Stream</h1> */}
                <ReactPlayer
                  playing
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

          {/* controls below */}
          <div
            className="flex justify-center items-center gap-12 py-3 w-full h-[13%]"
            style={{ backgroundColor: "#9DA5B8" }}
          >
            <div
              className="bg-white rounded-full text-black w-[7%] h-[75%] p-3 flex justify-center items-center cursor-pointer"
              onClick={toggleCamera}
            >
              <img
                src={video__controls}
                alt=""
                className={`${isCamera ? "hidden" : "block"}`}
              />
              <img
                src={not__video__controls}
                alt=""
                className={`${isCamera ? "block" : "hidden"}`}
              />
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
              <img
                src={mic__controls}
                alt=""
                className={`${isMic ? "hidden" : "block"}`}
              />
              <img
                src={not__mic__controls}
                alt=""
                className={`${isMic ? "block" : "hidden"}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room4;
