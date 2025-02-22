// src/utils/webRTC.d.ts
export function getMediaStream(): Promise<MediaStream>;
// src/utils/webRTC.d.ts
export function createPeerConnection(remoteVideoRef: React.RefObject<HTMLVideoElement | null>): RTCPeerConnection;

export function createOffer(): Promise<void>;
export function createAnswer(offer: RTCSessionDescriptionInit): Promise<void>;
export function setRemoteAnswer(answer: RTCSessionDescriptionInit): void;
export function addIceCandidate(candidate: RTCIceCandidateInit): void;
