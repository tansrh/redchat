import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

// Use environment variable for flexibility:
const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');

function ChatComponent() {
  const [room, setRoom] = useState('');
  const [notification, setNotification] = useState('');
  const [mode, setMode] = useState('join'); // 'join' or 'new'
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    socket.on('chat_message', ({ room: msgRoom, message, sender }) => {
      if (msgRoom === room) {
        setMessages((prev) => [...prev, { text: message, sender }]);
      }
    });
    return () => socket.off('chat_message');
  }, [room]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const [errors, setErrors] = useState({ username: '', room: '' });

  const joinRoom = () => {
    let hasError = false;
    const newErrors = { username: '', room: '' };
    if (!username.trim()) {
      newErrors.username = 'Username is required';
      hasError = true;
    }
    if (!room.trim()) {
      newErrors.room = 'Room is required';
      hasError = true;
    }
    setErrors(newErrors);
    if (hasError) return;
    socket.emit('join_room', room);
    setMessages([]);
    setJoined(true);
    
  };

  const sendMessage = () => {
    if (input.trim() && room && username.trim()) {
      socket.emit('chat_message', { room, message: input, sender: username });
      setInput('');
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 border-2 border-black rounded-md font-sans text-black bg-white">
      <h2 className="text-center font-bold text-xl mb-6 border-b border-black pb-2" style={{ color: 'crimson' }}>REDCHAT</h2>
      {!joined ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex gap-4 mb-2">
            <button
              className={`px-4 py-2 border border-black rounded font-semibold ${mode === 'join' ? 'bg-gray-200' : 'bg-white'}`}
              onClick={() => setMode('join')}
            >Join Existing</button>
            <button
              className={`px-4 py-2 border border-black rounded font-semibold ${mode === 'new' ? 'bg-gray-200' : 'bg-white'}`}
              onClick={async () => {
                setMode('new');
                const newRoom = uuidv4();
                setRoom(newRoom);
                try {
                  await navigator.clipboard.writeText(newRoom);
                  setNotification('Chat ID copied to clipboard!');
                  setTimeout(() => setNotification(''), 2000);
                } catch {
                  setNotification('Could not copy chat ID');
                  setTimeout(() => setNotification(''), 2000);
                }
              }}
            >Start New</button>
          </div>
          {notification && (
            <div className="text-green-700 text-sm font-semibold mb-1">{notification}</div>
          )}
          <div className="w-full max-w-xs flex flex-col gap-1">
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your name"
              maxLength={12}
              className={`px-3 py-2 border border-black rounded text-base w-full focus:outline-none ${errors.username ? 'border-red-500' : ''}`}
              onKeyDown={e => {
                if (e.key === 'Enter') joinRoom();
              }}
            />
            {errors.username && <span className="text-xs text-red-600">{errors.username}</span>}
          </div>
          {mode === 'join' ? (
            <div className="w-full max-w-xs flex flex-col gap-1">
              <input
                value={room}
                onChange={e => setRoom(e.target.value)}
                placeholder="Enter room name or ID"
                className={`px-3 py-2 border border-black rounded text-base w-full focus:outline-none ${errors.room ? 'border-red-500' : ''}`}
                onKeyDown={e => {
                  if (e.key === 'Enter') joinRoom();
                }}
              />
              {errors.room && <span className="text-xs text-red-600">{errors.room}</span>}
            </div>
          ) : (
            <div className="w-full max-w-xs flex flex-col gap-1">
              <input
                value={room}
                readOnly
                className="px-3 py-2 border border-black rounded text-base w-full bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <span className="text-xs text-gray-600">Share this room ID to invite others</span>
            </div>
          )}
          <button
            onClick={joinRoom}
            className="px-5 py-2 border border-black rounded bg-white text-black font-semibold w-full max-w-xs hover:bg-gray-100 transition-colors"
          >Join Room</button>
        </div>
      ) : (
        <>
        {notification && (
            <div className="text-green-700 text-sm font-semibold mb-1">{notification}</div>
          )}
          <div className="flex-col justify-between items-center mb-3 gap-4">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base">RoomId: {room}</span>
            </div>
             <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(room);
                    setNotification('Room ID copied!');
                    setTimeout(() => setNotification(''), 2000);
                  } catch {
                    setNotification('Could not copy Room ID');
                    setTimeout(() => setNotification(''), 2000);
                  }
                }}
                className="ml-1 mr-2 px-2 py-1 border border-black rounded bg-gray-100 text-xs font-semibold hover:bg-gray-200 transition-colors"
                title="Copy Room ID"
              >Copy</button>
            <button
              onClick={() => {
                socket.emit('leave_room', room);
                setJoined(false);
                setRoom('');
                setUsername('');
                setMessages([]);
              }}
              className="px-3 py-1 border border-black rounded bg-white text-black text-xs font-semibold hover:bg-gray-100 transition-colors"
            >Leave</button>
          </div>
          <div className="overflow-y-auto border border-black rounded mb-4 bg-white p-3 flex flex-col gap-2" style={{height: '60vh', minHeight: 180}}>
            {messages.map((m, i) => {
              const isMe = m.sender && m.sender === username;
              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-2 py-1 rounded border border-black text-sm bg-white max-w-[80%] break-words ${isMe ? 'text-right' : 'text-left'}`}>{m.text}</div>
                  <span className="text-xs text-gray-600 mt-1 max-w-[80%] truncate" style={{ maxWidth: '80%' }}>
                    {m.sender ? (m.sender.length > 12 ? m.sender.slice(0, 12) : m.sender) : 'Anonymous'}
                  </span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-3 py-2 border border-black rounded text-base focus:outline-none"
              placeholder="Type a message"
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            />
            <button
              onClick={sendMessage}
              className="px-5 py-2 border border-black rounded bg-white text-black font-semibold hover:bg-gray-100 transition-colors"
            >Send</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatComponent;