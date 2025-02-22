import socket from './socket';

let localStream;
let peerConnection;

const iceConfig = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302"
    }
  ]
};

// Get User Media Stream
export const getMediaStream = async () => {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    console.log("Local Stream:", localStream);
    return localStream;
  } catch (error) {
    console.error("Error accessing media devices:", error);
    throw error;
  }
};

// Create Peer Connection
export const createPeerConnection = (remoteVideoRef) => {
  if (!peerConnection) { // Only create if not already created
    peerConnection = new RTCPeerConnection(iceConfig);

    // Add local stream tracks to the peer connection
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log("Remote Stream Event:", event);
      const [remoteStream] = event.streams;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    // Handle ICE Candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("Sending ICE Candidate:", event.candidate);
        socket.emit("ice-candidate", event.candidate);
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE Connection State:", peerConnection.iceConnectionState);
    };
  }
  return peerConnection;
};

// Create Offer
export const createOffer = async () => {
  if (!peerConnection) {
    console.error("PeerConnection is not initialized. Call createPeerConnection() first.");
    return;
  }

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  console.log("Created Offer:", offer);
  socket.emit("offer", offer);
};

// Create Answer
export const createAnswer = async (offer) => {
  if (!peerConnection) {
    console.error("PeerConnection is not initialized. Call createPeerConnection() first.");
    return;
  }

  await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  console.log("Created Answer:", answer);
  socket.emit("answer", answer);
};

// Set Remote Answer
export const setRemoteAnswer = async (answer) => {
  if (peerConnection) {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
  } else {
    console.error("No peerConnection found while setting remote answer.");
  }
};

// Add ICE Candidate
export const addIceCandidate = async (candidate) => {
  if (peerConnection && candidate) {
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("Added ICE Candidate:", candidate);
    } catch (error) {
      console.error("Error adding received ICE candidate", error);
    }
  }
};
