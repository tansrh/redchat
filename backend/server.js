const express = require('express');
const http = require('http');
const { createClient } = require('redis');
const { Server } = require('socket.io');
require('dotenv').config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const redis_url = process.env.REDIS_URL;
const redis_pub = createClient({ url: redis_url });
const redis_sub = createClient({ url: redis_url });


(async () => {
  await redis_pub.connect();
  await redis_sub.connect();

  // Map to keep track of active user count per room
  const room_user_counts = new Map();
  // Set to keep track of which rooms are currently subscribed
  const subscribed_rooms = new Set();

  // Redis subscriber handler (shared for all rooms)
  redis_sub.on('error', (err) => console.error('Redis sub error:', err));

  // Handler for all room messages
  const handleRoomMessage = (message, channel) => {
    try {
      const { message: msg, sender } = JSON.parse(message);
      io.to(channel).emit('chat_message', { room: channel, message: msg, sender });
      console.log(`Message received in room ${channel}: ${msg} (by ${sender})`);
    } catch (e) {
      console.error('Failed to parse message:', message, e);
    }
  };

  io.on('connection', (socket) => {
    // Track all rooms joined by this socket
    const joined_rooms = new Set();
    console.log(`User connected: ${socket.id}`);

    socket.on('join_room', async (room_name) => {
      if (!joined_rooms.has(room_name)) {
        socket.join(room_name);
        joined_rooms.add(room_name);

        // Increment user count for this room
        room_user_counts.set(room_name, (room_user_counts.get(room_name) || 0) + 1);

        // Subscribe to this room if not already
        if (!subscribed_rooms.has(room_name)) {
          await redis_sub.subscribe(room_name, (message) => handleRoomMessage(message, room_name));
          subscribed_rooms.add(room_name);
          console.log(`Subscribed to Redis channel for room ${room_name}`);
        }
      }
    });

    socket.on('chat_message', ({ room, message, sender }) => {
      // Publish to the room's Redis channel
      console.log(`Publishing message to room ${room}: ${message}`);
      redis_pub.publish(room, JSON.stringify({ message, sender }));
    });

    async function leaveRoom(room_name) {
      if (joined_rooms.has(room_name)) {
        socket.leave(room_name);
        joined_rooms.delete(room_name);
        if (room_user_counts.has(room_name)) {
          room_user_counts.set(room_name, room_user_counts.get(room_name) - 1);
          // If no users left, clean up
          if (room_user_counts.get(room_name) <= 0) {
            room_user_counts.delete(room_name);
            if (subscribed_rooms.has(room_name)) {
              await redis_sub.unsubscribe(room_name);
              subscribed_rooms.delete(room_name);
              console.log(`Unsubscribed from Redis channel for room ${room_name}`);
            }
          }
        }
        console.log(`User ${socket.id} left room ${room_name}`);
      }
    }

    socket.on('leave_room', leaveRoom);

    socket.on('disconnect', async () => {
      // Leave all rooms this socket was in
      for (const room of Array.from(joined_rooms)) {
        await leaveRoom(room);
      }
      console.log(`User disconnected from rooms: ${Array.from(joined_rooms).join(', ')}`);
    });
  });

  server.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
  });
})();