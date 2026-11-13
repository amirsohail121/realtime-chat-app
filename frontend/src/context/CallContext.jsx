// src/context/CallContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { socket } from "../socket/socket";
import { fetchIceServers } from "../api/call";
import { AuthContext } from "./AuthContext";

const CallContext = createContext();

export const CallProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  const [callStatus, setCallStatus] = useState("idle"); // idle | ringing-outgoing | ringing-incoming | in-call
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCallData, setIncomingCallData] = useState(null);

  const peerConnection = useRef(null);

  // Caller side: start a new call
  const startCall = async (toUserId, callType = "video") => {
    const iceServers = await fetchIceServers();
    peerConnection.current = new RTCPeerConnection({ iceServers });

    // NEW: whenever our browser discovers a possible network path,
    // send it to the other person immediately — this can fire many times.
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice_candidate", { to: toUserId, candidate: event.candidate });
      }
    };

    // NEW: when the other side's audio/video actually arrives,
    // this fires — that's how we get the remote video feed to display.
    peerConnection.current.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: callType === "video",
      audio: true,
    });
    setLocalStream(stream);

    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.emit("call_offer", {
      to: toUserId,
      offer,
      callType,
      from: user._id,
    });

    setCallStatus("ringing-outgoing");
  };

  // Listen for signaling events coming through the server
  useEffect(() => {
    socket.on("incoming_call", ({ from, offer, callType }) => {
      setIncomingCallData({ from, offer, callType });
      setCallStatus("ringing-incoming");
    });

    socket.on("call_answered", async ({ answer }) => {
      await peerConnection.current.setRemoteDescription(answer);
      setCallStatus("in-call");
    });

    socket.on("ice_candidate", ({ candidate }) => {
      peerConnection.current?.addIceCandidate(candidate);
    });

    return () => {
      socket.off("incoming_call");
      socket.off("call_answered");
      socket.off("ice_candidate");
    };
  }, []);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        localStream,
        remoteStream,
        incomingCallData,
        startCall,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);