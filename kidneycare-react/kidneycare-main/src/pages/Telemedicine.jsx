import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Phone, MessageSquare,
  ChevronLeft, Monitor, User, Loader2, AlertTriangle,
  Paperclip, Send, MonitorOff
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';
import { LanguageProvider, useLanguage } from '../components/shared/LanguageContext';
import AgoraRTC from 'agora-rtc-sdk-ng';

function TelemedicineContent() {
  const { language } = useLanguage();
  const clientRef = useRef(null);
  const localTrackRef = useRef({ video: null, audio: null, screen: null });

  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteUser, setRemoteUser] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const urlParams = new URLSearchParams(window.location.search);
  const channelName = urlParams.get('room') || `room-${Date.now()}`;

  useEffect(() => {
    let mounted = true;

    const joinChannel = async () => {
      try {
        const res = await base44.functions.invoke('agoraToken', { channel_name: channelName });
        if (!mounted) return;

        const { appId, token, uid } = res.data;

        const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
        clientRef.current = client;

        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          if (mediaType === 'video') {
            if (mounted) setRemoteUser(user);
            setTimeout(() => {
              if (remoteVideoRef.current) {
                user.videoTrack?.play(remoteVideoRef.current);
              }
            }, 100);
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video' && mounted) setRemoteUser(null);
        });

        await client.join(appId, channelName, token, uid);

        const [micTrack, camTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        localTrackRef.current.video = camTrack;
        localTrackRef.current.audio = micTrack;

        await client.publish([micTrack, camTrack]);

        if (localVideoRef.current) camTrack.play(localVideoRef.current);

        if (mounted) setStatus('connected');
      } catch (err) {
        if (mounted) {
          setError(err.message);
          setStatus('error');
        }
      }
    };

    joinChannel();

    return () => {
      mounted = false;
      const { video, audio, screen } = localTrackRef.current;
      video?.stop(); video?.close();
      audio?.stop(); audio?.close();
      screen?.stop(); screen?.close();
      clientRef.current?.leave();
    };
  }, [channelName]);

  const toggleVideo = async () => {
    const track = localTrackRef.current.video;
    if (track) {
      await track.setEnabled(!videoEnabled);
      setVideoEnabled(v => !v);
    }
  };

  const toggleAudio = async () => {
    const track = localTrackRef.current.audio;
    if (track) {
      await track.setEnabled(!audioEnabled);
      setAudioEnabled(a => !a);
    }
  };

  const toggleScreenShare = async () => {
    const client = clientRef.current;
    if (!client) return;
    try {
      if (!screenSharing) {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'disable');
        await client.unpublish(localTrackRef.current.video);
        await client.publish(screenTrack);
        localTrackRef.current.screen = screenTrack;
        setScreenSharing(true);
        // Stop screen share when user stops via browser UI
        screenTrack.on('track-ended', async () => {
          await client.unpublish(screenTrack);
          screenTrack.close();
          localTrackRef.current.screen = null;
          await client.publish(localTrackRef.current.video);
          if (localVideoRef.current) localTrackRef.current.video.play(localVideoRef.current);
          setScreenSharing(false);
        });
      } else {
        await client.unpublish(localTrackRef.current.screen);
        localTrackRef.current.screen?.stop();
        localTrackRef.current.screen?.close();
        localTrackRef.current.screen = null;
        await client.publish(localTrackRef.current.video);
        if (localVideoRef.current) localTrackRef.current.video.play(localVideoRef.current);
        setScreenSharing(false);
      }
    } catch (err) {
      console.error('Screen share error:', err.message);
    }
  };

  const handleDocumentShare = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setMessages(prev => [...prev, {
        text: file.name, url: file_url, sender: 'me',
        type: 'document', timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error(err);
    }
    setUploadingDoc(false);
    e.target.value = '';
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages(prev => [...prev, {
      text: newMessage, sender: 'me',
      type: 'text', timestamp: new Date().toISOString()
    }]);
    setNewMessage('');
  };

  const endCall = () => {
    const { video, audio, screen } = localTrackRef.current;
    video?.stop(); video?.close();
    audio?.stop(); audio?.close();
    screen?.stop(); screen?.close();
    clientRef.current?.leave();
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-900 relative overflow-hidden">
      {/* Connecting overlay */}
      {status === 'connecting' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-400" />
            <p className="text-lg font-medium">
              {language === 'hi' ? 'कनेक्ट हो रहे हैं...' : 'Connecting to call...'}
            </p>
            <p className="text-sm text-gray-400 mt-2">Room: {channelName}</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {status === 'error' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900 p-6">
          <div className="text-center text-white max-w-sm">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-lg font-semibold mb-2">Connection Failed</p>
            <p className="text-sm text-gray-400 mb-4 break-words">{error}</p>
            <p className="text-xs text-gray-500 mb-4">
              Ensure AGORA_APP_ID is set in App Settings → Environment Variables.
            </p>
            <Button variant="outline" className="text-white border-gray-600" onClick={() => window.history.back()}>
              Go Back
            </Button>
          </div>
        </div>
      )}

      {/* Remote video container */}
      <div ref={remoteVideoRef} className="absolute inset-0 bg-gray-800">
        {!remoteUser && status === 'connected' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <p className="text-gray-400">
                {language === 'hi' ? 'प्रतीक्षा कर रहे हैं...' : 'Waiting for other participant...'}
              </p>
              <p className="text-sm text-gray-500 mt-2">Room: {channelName}</p>
            </div>
          </div>
        )}
      </div>

      {/* Local video PIP */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-4 right-4 w-28 h-40 bg-gray-900 rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 z-10"
      >
        <div ref={localVideoRef} className="w-full h-full" />
        {!videoEnabled && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <VideoOff className="w-7 h-7 text-gray-500" />
          </div>
        )}
      </motion.div>

      {/* Header */}
      <div className="absolute top-4 left-4 flex items-center gap-3 z-10">
        <Button
          variant="ghost" size="icon"
          className="rounded-full bg-black/40 text-white hover:bg-black/60"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        {status === 'connected' && (
          <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <p className="text-white text-sm font-medium">Live</p>
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-3 z-10 px-4">
        <Button
          size="icon"
          className={`rounded-full w-12 h-12 text-white ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
          onClick={toggleAudio}
        >
          {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          size="icon"
          className={`rounded-full w-12 h-12 text-white ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'}`}
          onClick={toggleVideo}
        >
          {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>

        <Button
          size="icon"
          className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 text-white"
          onClick={endCall}
        >
          <Phone className="w-6 h-6 rotate-135" />
        </Button>

        <Button
          size="icon"
          className={`rounded-full w-12 h-12 text-white ${screenSharing ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={toggleScreenShare}
          title={screenSharing ? 'Stop sharing' : 'Share screen'}
        >
          {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
        </Button>

        <Button
          size="icon"
          className={`rounded-full w-12 h-12 text-white ${showChat ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
          onClick={() => setShowChat(s => !s)}
        >
          <MessageSquare className="w-5 h-5" />
        </Button>
      </div>

      {/* Chat + Document sharing sidebar */}
      {showChat && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          className="absolute top-0 right-0 w-80 h-full bg-white shadow-2xl flex flex-col z-20"
        >
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">
              {language === 'hi' ? 'चैट' : 'Chat & Documents'}
            </h3>
            <Button variant="ghost" size="icon" onClick={() => setShowChat(false)}>
              <ChevronLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-gray-400 text-sm mt-8">
                {language === 'hi' ? 'कोई संदेश नहीं' : 'No messages yet'}
              </p>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  msg.sender === 'me' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.type === 'document' ? (
                    <a href={msg.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:underline">
                      <Paperclip className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{msg.text}</span>
                    </a>
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t space-y-2">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={language === 'hi' ? 'संदेश लिखें...' : 'Type a message...'}
                className="h-10 rounded-full text-sm"
              />
              <Button size="icon" className="rounded-full bg-blue-500 hover:bg-blue-600 text-white" onClick={sendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <input type="file" id="doc-share" className="hidden" onChange={handleDocumentShare} />
              <label htmlFor="doc-share"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-500 cursor-pointer transition-colors">
                {uploadingDoc ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Paperclip className="w-4 h-4" />
                )}
                {language === 'hi' ? 'दस्तावेज़ शेयर करें' : 'Share Document'}
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function Telemedicine() {
  return (
    <LanguageProvider>
      <TelemedicineContent />
    </LanguageProvider>
  );
}