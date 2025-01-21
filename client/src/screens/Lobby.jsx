import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const Lobby = ({setIsDoctor, isDoctor}) => {
  const [startTime, setStartTime] = useState("18:30"); // Time in IST
  const [appointmentDate, setAppointmentDate] = useState("2025-01-10"); // Date in IST
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();

  const handleSubmitForm = useCallback(
    (e) => {
      e.preventDefault();
      console.log("data going is", { email, room });
      socket.emit("room:join", { email, room });
    },
    [email, room, socket]
  );

  const checkMedia = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "Your browser does not support accessing media devices. Please use a modern browser like Chrome, Edge, or Firefox and ensure the app is served over HTTPS."
      );
      console.error("MediaDevices API is not available.");
      return;
    }
  };

  checkMedia();

  const handleJoinRoom = useCallback(
    (data) => {
      const { room } = data;
      navigate(`/room5/${room}`);
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
          value={isDoctor}
          onChange={(e) => setIsDoctor(e.target.value)}
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

// if (myStream) {
    //   // Stop the current video tracks
    //   myStream.getVideoTracks().forEach((track) => track.stop());
  
    //   // If the camera is on, turn it off by getting a new stream without video
    //   if (isCamera) {
    //     setIsCamera(false);
    //     const stream = await navigator.mediaDevices.getUserMedia({ audio: isMic, video: false });
    //     setMyStream(stream);
  
    //     // Replace the current tracks in the peer connection
    //     const senders = peer.peer.getSenders().filter((sender) => sender.track.kind === "video");
    //     senders.forEach((sender) => peer.peer.removeTrack(sender));
  
    //     stream.getTracks().forEach((track) => {
    //       peer.peer.addTrack(track, stream);
    //     });
    //   } else {
    //     // If the camera is off, turn it on by getting a new stream with video
    //     setIsCamera(true);
    //     const stream = await navigator.mediaDevices.getUserMedia({ audio: isMic, video: true });
    //     setMyStream(stream);
  
    //     // Replace the current tracks in the peer connection
    //     const senders = peer.peer.getSenders().filter((sender) => sender.track.kind === "video");
    //     senders.forEach((sender) => peer.peer.removeTrack(sender));
  
    //     stream.getTracks().forEach((track) => {
    //       peer.peer.addTrack(track, stream);
    //     });
    //   }

        // stop myStream track
    // peer.peer.removeTrack();
    
    // getUserMedia again pass isCamera for video
    // const stream = await navigator.mediaDevices.getUserMedia({
    //   audio: isMic,
    //   video: isCamera,
    // });
    //setMyStream(stream);
    
    // sendStream
    //sendStreams();

      // useEffect(() => {
  //   if (myStream) {
  //     myStream.getVideoTracks().forEach((track) => (track.enabled = isCamera));
  //     myStream.getAudioTracks().forEach((track) => (track.enabled = isMic));
  //     // myStream.getVideoTracks()[0].enabled = isCamera;
  //     // myStream.getAudioTracks()[0].enabled = isMic;
  //     // setIsCamera(videoTracks.length > 0 ? videoTracks[0].enabled : false);
  //     // const audioTracks = myStream.getAudioTracks();
  //     // setIsMic(audioTracks.length > 0 ? audioTracks[0].enabled : false);
  //   }
  // }, [isCamera, isMic, myStream]);

  // try {
        // if (isMic) {
          // Turn off mic: stop all audio tracks in the current stream
          // myStream.getAudioTracks().forEach((track) => track.stop());
          // setIsMic(false);
          // console.log("Mic turned off.");
        // } else {
          // Turn on mic: get a new audio track and add it to the stream
          // const newStream = await navigator.mediaDevices.getUserMedia({
            // audio: true,
            // video: false,
          // });
    
          // const newAudioTrack = newStream.getAudioTracks()[0];
          // setIsMic(true);
          // console.log("Mic turned on.");
    
          // Replace the old audio track in the peer connection
          // myStream.addTrack(newAudioTrack);
    
          // Update `myStream` to include the new audio track
          // setMyStream((prevStream) => {
            // const updatedStream = new MediaStream([
              // ...prevStream.getVideoTracks(),
              // newAudioTrack,
            // ]);
            // return updatedStream;
          // });
    
          // Notify peers about the updated stream
          // const senders = peer.peer.getSenders();
          // const audioSender = senders.find((sender) => sender.track.kind === "audio");
          // if (audioSender) {
            // audioSender.replaceTrack(newAudioTrack);
          // }
        // }
      // } catch (error) {
        // console.error("Error toggling mic:", error);
      // }
      
      // stop myStream track
      // peer.peer.removeTrack();
      
      // getUserMedia again pass isCamera for video
      // const stream = await navigator.mediaDevices.getUserMedia({
        // audio: isMic,
        // video: isCamera,
      // });
      // setMyStream(stream);
      
      // sendStream
      // sendStreams();

      // from line 126

        //   if(isCamera){
        //     console.log("stopping video");
        //     setIsCamera(false);
        //     myStream.getVideoTracks().forEach((track) => (track.enabled = false));
        //     myStream.getVideoTracks()[0].enabled = false;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = false;
        //     // const stream = await navigator.mediaDevices.getUserMedia({ audio: isMic, video: false });
        //     // const videoTrack = await stream.getVideoTracks();
        //     // peer.replaceTrack(videoTrack);
        //     // setMyStream(stream);
        //     console.log("is camera", isCamera);
        //   }else{
        //     console.log("starting video");
        //     setIsCamera(true);
        //     myStream.getVideoTracks().forEach((track) => (track.enabled = true));
        //     myStream.getVideoTracks()[0].enabled = true;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = true;
        //     // const stream = await navigator.mediaDevices.getUserMedia({ audio: isMic, video: true });
        //     // setMyStream(stream);
        //     console.log("is camera", isCamera);
        //   }
      
        //   // console.log("is camera", isCamera, myStream.getVideoTracks()[0].enabled);
        //   // myStream.getVideoTracks().forEach((track) => console.log("track enabled", track.enabled));
      
        //   if(myStream.getVideoTracks()[0].enabled){
        //     setIsCamera(false);
        //     myStream.getVideoTracks().forEach((track) => (track.enabled = false));
        //     myStream.getVideoTracks()[0].enabled = false;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = false;
        //     console.log("is camera", isCamera);
        //   }else{
        //     setIsCamera(true);
        //     myStream.getVideoTracks().forEach((track) => (track.enabled = true));
        //     myStream.getVideoTracks()[0].enabled = true;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = true;
        //     console.log("is camera", isCamera);
        //   }
        
        //     // Update the ReactPlayer
        //     console.log("Camera toggled. Current state:", isCamera);
        //   }
        
        // const toggleMic = async () => {
        //   if(isMic){
        //     setIsMic(false);
        //     myStream.getAudioTracks().forEach((track) => (track.enabled = false));
        //     myStream.getAudioTracks()[0].enabled = false;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = false;
        //     // const stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: isCamera });
        //     // setMyStream(stream);
        //   }else{
        //     setIsMic(true);
        //     myStream.getAudioTracks().forEach((track) => (track.enabled = true));
        //     myStream.getAudioTracks()[0].enabled = true;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = true;
        //     // const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: isCamera });
        //     // setMyStream(stream);
        //   }
        //   // console.log("is mic", isMic, myStream.getAudioTracks()[0].enabled);
        //   // myStream.getAudioTracks().forEach((track) => console.log("track enabled", track.enabled));
      
        //   if(myStream.getAudioTracks()[0].enabled){
        //     setIsMic(false);
        //     myStream.getAudioTracks().forEach((track) => (track.enabled = false));
        //     myStream.getAudioTracks()[0].enabled = false;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = false;
        //   }else{
        //     setIsMic(true);
        //     myStream.getAudioTracks().forEach((track) => (track.enabled = true));
        //     myStream.getAudioTracks()[0].enabled = true;
        //     myStream.getTracks().find((track) => track.kind === "audio").enabled = true;
        //   }
        // };