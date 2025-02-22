import { useRef, useEffect, useState } from 'react';
import socket from '../utils/socket.js';
import * as webRTC from '../utils/webRTC.js';

const {
  getMediaStream,
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteAnswer,
  addIceCandidate
} = webRTC;

const VideoPlayer = () => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Connecting...");

  useEffect(() => {
    const setupMedia = async () => {
      const stream = await getMediaStream();
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = createPeerConnection(remoteVideoRef);
      setPeerConnection(pc);

      // Update connection status
      pc.oniceconnectionstatechange = () => {
        setConnectionStatus(pc.iceConnectionState);
      };
    };

    setupMedia();

    socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
      await createAnswer(offer);
    });

    socket.on("answer", (answer: RTCSessionDescriptionInit) => {
      setRemoteAnswer(answer);
    });

    socket.on("ice-candidate", (candidate: RTCIceCandidateInit) => {
      addIceCandidate(candidate);
    });

    return () => {
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  // Mute/Unmute Microphone
  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Toggle Video On/Off
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOn(!isVideoOn);
    }
  };

  // Start Call
  const startCall = () => {
    if (peerConnection) {
      createOffer();
    }
  };

  // End Call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    setConnectionStatus("Call Ended");
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800">Audio Video Communication</h1>

      <div className="text-gray-600">{`Status: ${connectionStatus}`}</div>

      <div className="flex gap-4">
        {/* Local Video */}
        <div className="relative w-1/3 rounded-lg shadow-lg">
          <span className="absolute top-2 left-2 text-white bg-black bg-opacity-50 rounded px-2">
            You
          </span>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded-lg" />
        </div>

        {/* Remote Video */}
        <div className="relative w-1/3 rounded-lg shadow-lg">
          <span className="absolute top-2 left-2 text-white bg-black bg-opacity-50 rounded px-2">
            Remote
          </span>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg" />
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        {/* Mute/Unmute Button */}
        <button 
          onClick={toggleMute}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>

        {/* Toggle Video Button */}
        <button 
          onClick={toggleVideo}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
        >
          {isVideoOn ? "Turn Video Off" : "Turn Video On"}
        </button>

        {/* Start Call Button */}
        <button 
          onClick={startCall}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          Start Call
        </button>

        {/* End Call Button */}
        <button 
          onClick={endCall}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
        >
          End Call
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
