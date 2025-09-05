// Video consultation page
import React from 'react';
import {useEffect, useState, useRef} from 'react';
import Peer from 'peerjs';
import io from 'socket.io-client';
import endCallIcon from '../../img/endcall.png';
import medicalIcon from '../../img/medical-report-white.png'
import useTokenCheck from '../../helper/tokenCheck';
import {Link, useLocation} from 'react-router-dom';

const Call = ({match}) => {
  // User auth
  useTokenCheck(); // ***** Don't forget
  const location = useLocation();
  const {type, user} = location.state || { type: 'unknown', user: null };
  console.log("User type:", type);
  console.log("User info:", user);
  console.log("User ID:", user?.id);

  // State for video call
  const [socket, setSocket] = useState(null); 
  const [stream, setStream] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");
  const [peerConnection, setPeerConnection] = useState(null);
  const [peerId, setPeerId] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [activePeers, setActivePeers] = useState({});
  
  // Video refs
  const userVideo = useRef();
  const otherVideo = useRef();

  // Video controls
  const [isMute, setMute] = useState(false);
  const [isVideoOff, setVideoOff] = useState(false);

  // Main initialization effect
  useEffect(() => {
    // Create and track peers object
    const myPeers = {};
    
    // Create Socket.IO connection
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    console.log("Connecting to socket server at:", socketUrl);
    
    const newSocket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    
    // Socket connection status handling
    newSocket.on('connect', () => {
      console.log('Socket connected successfully with ID:', newSocket.id);
      setConnectionStatus("Connected to server, waiting for peer...");
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(true);
      setConnectionStatus("Error connecting to server. Please try again.");
      alert('Error connecting to the server. Please check your internet connection and try again.');
    });
    
    setSocket(newSocket);

    // Configure PeerJS with multiple STUN/TURN servers for better connectivity
    const peerOptions = {
      debug: 3,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
          { 
            urls: 'turn:numb.viagenie.ca',
            credential: 'muazkh',
            username: 'webrtc@live.com'
          },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      }
    };
    
    // Generate a unique ID for this peer
    const uniqueId = `${match.params.id}-${type}-${Date.now()}`;
    console.log(`Creating peer with ID: ${uniqueId}`);
    
    // Create a new Peer instance wrapped in a try-catch
    try {
      const myPeer = new Peer(uniqueId, peerOptions);
      setPeerConnection(myPeer);
      
      // Handle peer connection events
      myPeer.on('open', (id) => {
        console.log(`Peer connection established with ID: ${id}`);
        setPeerId(id);
        setConnectionStatus("Peer connection established, joining room...");
        
        // Join the room with the peer ID
        newSocket.emit('join-room', match.params.id, id);
        console.log(`Joining room ${match.params.id} with peer ID ${id}`);
        
        // Send extra info to help with debugging
        newSocket.emit('message', `User ${id} (${type}) joined from client`);
      });
      
      // Handle peer connection errors
      myPeer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setConnectionError(true);
        setConnectionStatus(`Connection error: ${err.type}`);
        
        // Try to reconnect if it's a network issue
        if (err.type === 'network' || err.type === 'disconnected') {
          console.log("Network error - attempting to reconnect peer");
          setTimeout(() => {
            try {
              myPeer.reconnect();
            } catch (e) {
              console.error("Failed to reconnect peer:", e);
            }
          }, 2000);
        }
      });
      
      // Check browser support for WebRTC
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Your browser does not support video calls. Please use a modern browser like Chrome or Firefox.');
        setConnectionError(true);
        setConnectionStatus("Browser not supported");
        return;
      }
      
      // Access user's camera and microphone
      setConnectionStatus("Requesting camera and microphone access...");
      
      navigator.mediaDevices
        .getUserMedia({
          video: true,
          audio: true,
        })
        .then((mediaStream) => {
          console.log("Local media stream obtained successfully");
          setConnectionStatus("Camera access granted, waiting for other person...");
          setStream(mediaStream);
          
          // Display local video
          if (userVideo.current) {
            userVideo.current.srcObject = mediaStream;
            userVideo.current.onloadedmetadata = () => {
              userVideo.current.play().catch(e => console.error("Error playing local video:", e));
            };
          }
          
          // Handle incoming calls
          myPeer.on('call', (incomingCall) => {
            console.log("Receiving call from remote peer", incomingCall);
            setConnectionStatus("Incoming call, establishing connection...");
            
            // Answer the call with our mediaStream
            incomingCall.answer(mediaStream);
            setCallAccepted(true);
            
            // Get the remote stream
            incomingCall.on('stream', (remoteStream) => {
              console.log("Received remote stream", remoteStream);
              setConnectionStatus("Connected!");
              
              if (otherVideo.current) {
                otherVideo.current.srcObject = remoteStream;
                setCallAccepted(true);
                
                otherVideo.current.onloadedmetadata = () => {
                  console.log("Remote video metadata loaded, playing video");
                  otherVideo.current.play().catch(e => console.error("Error playing remote video:", e));
                };
              } else {
                console.error("Other video ref is not available");
              }
            });
            
            incomingCall.on('close', () => {
              console.log("Remote peer closed the call");
              setCallAccepted(false);
              setConnectionStatus("Call ended by remote peer");
              
              if (otherVideo.current) {
                otherVideo.current.srcObject = null;
              }
            });
            
            incomingCall.on('error', (err) => {
              console.error("Error in incoming call:", err);
              setConnectionError(true);
              setConnectionStatus("Call error: " + err.message);
            });
          });
          
          // When another user connects to the room
          newSocket.on('user-connected', (userId) => {
            console.log(`Remote user connected with ID: ${userId}`);
            setConnectionStatus("Remote user joined, connecting...");
            
            // Don't call ourselves
            if (userId === peerId) {
              console.log("Ignoring own user-connected event");
              return;
            }
            
            // Initiate call to new user
            connectToNewUser(userId, mediaStream, myPeer, myPeers);
          });
          
          // When a user disconnects
          newSocket.on('user-disconnected', (userId) => {
            console.log(`User disconnected: ${userId}`);
            setConnectionStatus("Remote user disconnected");
            
            if (myPeers[userId]) {
              console.log(`Closing connection to peer: ${userId}`);
              myPeers[userId].close();
              delete myPeers[userId];
              setActivePeers({...myPeers});
              setCallAccepted(false);
            }
          });
        })
        .catch((err) => {
          console.error('Media access error:', err);
          setConnectionError(true);
          
          if (err.name === 'NotAllowedError') {
            setConnectionStatus("Camera/microphone access denied");
            alert('You must allow camera and microphone access for the video call to work.');
          } else if (err.name === 'NotFoundError') {
            setConnectionStatus("Camera or microphone not found");
            alert('No camera or microphone found. Please connect these devices and try again.');
          } else {
            setConnectionStatus(`Media error: ${err.message}`);
            alert(`Error accessing camera/microphone: ${err.message}`);
          }
        });
      
      // Function to connect to a new user
      function connectToNewUser(userId, stream, peerInstance, peersObj) {
        console.log(`Initiating call to user: ${userId}`);
        setConnectionStatus("Calling remote user...");
        
        try {
          // Call the remote peer
          const call = peerInstance.call(userId, stream);
          
          if (!call) {
            console.error("Failed to create call object");
            setConnectionStatus("Error: Call failed to initialize");
            return;
          }
          
          call.on('stream', (remoteStream) => {
            console.log(`Received stream from user: ${userId}`);
            setConnectionStatus("Connected!");
            setCallAccepted(true);
            
            if (otherVideo.current) {
              otherVideo.current.srcObject = remoteStream;
              
              otherVideo.current.onloadedmetadata = () => {
                console.log("Remote video metadata loaded, playing video");
                otherVideo.current.play().catch(e => console.error("Error playing remote video:", e));
              };
            } else {
              console.error("Other video ref is not available");
            }
          });
          
          call.on('close', () => {
            console.log(`Call with user ${userId} closed`);
            setCallAccepted(false);
            setConnectionStatus("Call ended");
            
            if (otherVideo.current) {
              otherVideo.current.srcObject = null;
            }
            
            delete peersObj[userId];
            setActivePeers({...peersObj});
          });
          
          call.on('error', (err) => {
            console.error(`Error in call with user ${userId}:`, err);
            setConnectionError(true);
            setConnectionStatus(`Call error: ${err.message}`);
          });
          
          // Store the call in peers
          peersObj[userId] = call;
          setActivePeers({...peersObj});
          
        } catch (err) {
          console.error("Error connecting to new user:", err);
          setConnectionStatus(`Connection error: ${err.message}`);
        }
      }
    } catch (peerError) {
      console.error("Failed to initialize PeerJS:", peerError);
      setConnectionError(true);
      setConnectionStatus("Failed to initialize video call system. Please refresh and try again.");
      alert("Error initializing video call. Please refresh the page and try again.");
    }
    
    // Clean up on unmount
    return () => {
      console.log("Cleaning up video call component");
      
      // Stop media tracks
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
      }
      
      // Close all peer connections
      Object.values(myPeers).forEach(call => {
        if (call && typeof call.close === 'function') {
          call.close();
        }
      });
      
      // Destroy the peer connection
      if (peerConnection) {
        console.log("Destroying peer connection");
        try {
          peerConnection.destroy();
        } catch (err) {
          console.error("Error destroying peer:", err);
        }
      }
      
      // Disconnect socket
      if (newSocket) {
        console.log("Disconnecting socket");
        newSocket.disconnect();
      }
    };
  }, [match.params.id, type]);
  
  // Periodic connection check and retry
  useEffect(() => {
    // Skip if we don't have all required elements
    if (!socket || !peerConnection || !match.params.id || !stream) return;
    
    const connectionCheck = setInterval(() => {
      // Only check if we have a stream but no active call
      if (stream && !callAccepted) {
        console.log("Connection check: Still waiting for connection...");
        
        // Re-emit join room signal
        socket.emit('join-room', match.params.id, peerId || socket.id);
        
        // Check peer connection status
        if (peerConnection.disconnected) {
          console.log("Peer connection is disconnected, reconnecting...");
          try {
            peerConnection.reconnect();
          } catch (err) {
            console.error("Error reconnecting peer:", err);
          }
        }
      }
    }, 10000);
    
    return () => clearInterval(connectionCheck);
  }, [socket, peerConnection, stream, callAccepted, match.params.id, peerId]);
  
  // Prepare video elements
  let UserVideo;
  if (stream) {
    UserVideo = (
      <video
        className='w-auto rounded-3xl'
        playsInline
        muted
        ref={userVideo}
        autoPlay
        style={{maxWidth: '100%', maxHeight: '100%'}}
      />
    );
  }
  
  let PartnerVideo;
  if (callAccepted) {
    PartnerVideo = (
      <video
        className='w-full rounded-3xl'
        playsInline
        ref={otherVideo}
        autoPlay
        style={{maxWidth: '100%', maxHeight: '100%'}}
      />
    );
  }

  // Control handlers
  const mute = () => {
    if (!stream) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;
    
    const enabled = audioTracks[0].enabled;
    audioTracks[0].enabled = !enabled;
    setMute(!enabled);
  };
  
  const videoControl = () => {
    if (!stream) return;
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    
    const enabled = videoTracks[0].enabled;
    videoTracks[0].enabled = !enabled;
    setVideoOff(!enabled);
  };

  // Render UI
  return (
    <div>
      <div className='h-screen overflow-auto bg-gray-100 p-4'>
        <div className='flex content-center mx-6 my-2 h-5/6'>
          <div
            className='w-1/2 h- lg:shadow-lg rounded-lg flex lg:border-r border-gray-200 p-4'
            style={{backgroundColor: '#B5E3FE'}}
          >
            {UserVideo}
            {!stream && <div className="flex items-center justify-center h-full w-full">
              <p className="text-lg font-semibold text-gray-700">Waiting for camera access...</p>
            </div>}
          </div>
          <div
            className='w-1/2 h-full lg:shadow-lg rounded-lg flex lg:border-r border-gray-200 p-4 ml-4'
            style={{backgroundColor: '#FFCCD0'}}
          >
            {PartnerVideo ? PartnerVideo : 
              <div className="flex items-center justify-center h-full w-full flex-col">
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  {connectionError 
                    ? "Connection error. Please try again." 
                    : connectionStatus || "Waiting for the other person to join..."}
                </p>
                {connectionError && (
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            }
          </div>
        </div>
        <div className='flex mx-2 p-4 gap-2 mt-8'>
          <div className='w-3/4'>
            <div className='flex justify-start gap-2'>
              <button
                onClick={mute}
                className='h-12 w-12 items-center lg:shadow-sm rounded-lg bg-purple-500 hover:bg-purple-700 mr-1'
              >
                {isMute ? (
                  <i className='text-white fas fa-microphone-slash'></i>
                ) : (
                  <i className='text-white fa fa-microphone'></i>
                )}
              </button>
              <button
                onClick={videoControl}
                className='h-12 w-12 items-center lg:shadow-sm rounded-lg bg-purple-500 hover:bg-purple-700 mr-1'
              >
                {isVideoOff ? (
                  <i className='text-white fas fa-video-slash'></i>
                ) : (
                  <i className='text-white fas fa-video'></i>
                )}
              </button>
              { type==='doctor' && (
                (user && user.id && user.id !== 'null' && user.id !== 'undefined') ? (
                  <Link
                    to={{ pathname: `/manageMedicalRecord/${user.id}`, state: { patient: user }}}
                    target="_blank" rel="noopener noreferrer"
                    className='h-12 py-1 px-4 items-center inline-flex lg:shadow-sm rounded-lg bg-indigo-500 hover:bg-indigo-600'
                  >
                    <img className='w-8 py-1 -mr-3' src={medicalIcon} alt=""/>
                    <h1 className='ml-5 py-2 text-base text-white'>Medical Record</h1>
                  </Link>
                ) : (
                  <button 
                    onClick={() => alert("Patient information is not available. Please end the call and try again.")}
                    className='h-12 py-1 px-4 items-center inline-flex lg:shadow-sm rounded-lg bg-gray-400 cursor-not-allowed'
                  >
                    <img className='w-8 py-1 -mr-3' src={medicalIcon} alt=""/>
                    <h1 className='ml-5 py-2 text-base text-white'>Medical Record</h1>
                  </button>
                )
              )}
            </div>
          </div>
          <div className='w-1/4'>
            <div className='flex justify-end gap-2'>
              <a
                href={type === "patient" ? "/home" : "/doctor"}
                className='flex-col justify-center h-12 w-12 bg-red-400 hover:bg-red-500 font-bold py-2 px-2 rounded-lg inline-flex'
              >
                <img src={endCallIcon} alt=""/>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Call;
