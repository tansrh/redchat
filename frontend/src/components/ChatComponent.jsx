import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';

// Use environment variable for flexibility:
const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001');

function ChatComponent({ theme }) {
  const [room, setRoom] = useState('');
  // Unique senderId for this user session
  const senderIdRef = React.useRef(uuidv4());
  const [notification, setNotification] = useState('');
  const [mode, setMode] = useState('join'); // 'join' or 'new'
  const [username, setUsername] = useState('');
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    socket.on('chat_message', ({ room: msgRoom, message, sender, senderId }) => {
      if (msgRoom === room) {
        setMessages((prev) => [...prev, { text: message, sender, senderId }]);
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
      socket.emit('chat_message', { room, message: input, sender: username, senderId: senderIdRef.current });
      setInput('');
    }
  };

  const isDark = theme === 'dark';
  // Custom radiant dark red for dark mode
  const darkBg = 'bg-gradient-to-br from-[#2a0a0a] via-[#3a0d0d] to-[#1a0101]';
  const darkPanel = 'bg-[#2a0a0a]';
  const darkAccent = 'bg-[#b91c1c]'; // Tailwind red-700
  const darkAccentHover = 'bg-[#991b1b]'; // Tailwind red-800
  const darkBorder = 'border-[#b91c1c]';
  const darkText = 'text-white';
  return (
    <div className={`max-w-lg mx-auto mt-10 p-6 border-2 rounded-md font-sans ${isDark ? `${darkText} ${darkBg} ${darkBorder}` : 'text-black bg-white border-black'}`}>
      <h2 className={`text-center font-bold text-xl mb-6 border-b pb-2 ${isDark ? darkBorder : 'border-black'}`} style={{ color: isDark ? '#ef4444' : 'crimson', borderColor: isDark ? '#b91c1c' : '#000' }}>REDCHAT</h2>
      {!joined ? (
        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex gap-4 mb-2">
            <button
              className={`px-4 py-2 border rounded font-semibold transition-colors 
                ${isDark ? `${darkBorder}` : 'border-black'}
                ${mode === 'join' ? (isDark ? `${darkAccent} text-white` : 'bg-gray-200 text-black') : (isDark ? `${darkPanel} text-white` : 'bg-white text-black')}
                ${isDark ? `hover:${darkAccentHover}` : 'hover:bg-gray-100'}`}
              onClick={() => setMode('join')}
            >Join Existing</button>
            <button
              className={`px-4 py-2 border rounded font-semibold transition-colors 
                ${isDark ? `${darkBorder}` : 'border-black'}
                ${mode === 'new' ? (isDark ? `${darkAccent} text-white` : 'bg-gray-200 text-black') : (isDark ? `${darkPanel} text-white` : 'bg-white text-black')}
                ${isDark ? `hover:${darkAccentHover}` : 'hover:bg-gray-100'}`}
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
            <div className={`${isDark ? 'text-green-400' : 'text-green-700'} text-sm font-semibold mb-1`}>{notification}</div>
          )}
          <div className="w-full max-w-xs flex flex-col gap-1">
            <input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your name"
              maxLength={12}
              className={`px-3 py-2 border ${isDark ? 'border-gray-400 bg-gray-800 text-white' : 'border-black bg-white text-black'} rounded text-base w-full focus:outline-none ${errors.username ? 'border-red-500' : ''}`}
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
                className={`px-3 py-2 border ${isDark ? 'border-gray-400 bg-gray-800 text-white' : 'border-black bg-white text-black'} rounded text-base w-full focus:outline-none ${errors.room ? 'border-red-500' : ''}`}
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
                className={`px-3 py-2 border ${isDark ? 'border-gray-400 bg-gray-700 text-gray-300' : 'border-black bg-gray-100 text-gray-600'} rounded text-base w-full cursor-not-allowed`}
              />
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Share this room ID to invite others</span>
            </div>
          )}
          <button
            onClick={joinRoom}
            className={`px-5 py-2 border rounded font-semibold w-full max-w-xs transition-colors 
              ${isDark ? `${darkBorder} ${darkAccent} text-white hover:${darkAccentHover}` : 'border-black bg-white text-black hover:bg-gray-100'}`}
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
              className={`ml-1 mr-2 px-2 py-1 border rounded text-xs font-semibold transition-colors 
                  ${isDark ? `${darkBorder} ${darkAccent} text-white hover:${darkAccentHover}` : 'border-black bg-gray-100 text-black hover:bg-gray-200'}`}
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
              className={`px-3 py-1 border rounded text-xs font-semibold transition-colors 
                ${isDark ? `${darkBorder} ${darkAccent} text-white hover:${darkAccentHover}` : 'border-black bg-white text-black hover:bg-gray-100'}`}
            >Leave</button>
          </div>
          <div className={`overflow-y-auto border rounded mb-4 p-3 flex flex-col gap-2 ${isDark ? `${darkBorder} ${darkPanel} text-white` : 'border-black bg-white text-black'}`} style={{ height: '60vh', minHeight: 180 }}>
            {messages.map((m, i) => {
              const isMe = (m.senderId === senderIdRef.current);
              return (
                <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className={`px-2 py-1 rounded border text-sm max-w-[80%] break-words ${isDark ? `${darkBorder} ${darkBg} text-white` : 'border-black bg-white text-black'} ${isMe ? 'text-right' : 'text-left'}`}>{m.text}</div>
                  { ((messages.length > (i+1) && messages[i+1].senderId !== m.senderId) || (messages.length === (i+1))) &&
                    <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} mt-1 max-w-[80%] truncate`} style={{ maxWidth: '80%' }}>
                      {m.sender ? (m.sender.length > 12 ? m.sender.slice(0, 12) : m.sender) : 'Anonymous'}
                    </span>
                  }
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2 flex-col sm:flex-row">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              className={`flex-1 px-3 py-2 border rounded text-base focus:outline-none ${isDark ? 'border-gray-400 bg-gray-800 text-white' : 'border-black bg-white text-black'}`}
              placeholder="Type a message"
              onKeyDown={e => { if (e.key === 'Enter') sendMessage(); }}
            />
            <button
              onClick={sendMessage}
              className={`px-5 py-2 border rounded font-semibold transition-colors 
                ${isDark ? `${darkBorder} ${darkAccent} text-white hover:${darkAccentHover}` : 'border-black bg-white text-black hover:bg-gray-100'}`}
            >Send</button>
          </div>
        </>
      )}
    </div>
  );
}

export default ChatComponent;