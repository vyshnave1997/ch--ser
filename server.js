const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Client, Databases } = require('node-appwrite'); // Import Appwrite

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const client = new Client();
const databases = new Databases(client);

// Initialize Appwrite
client
  .setEndpoint('https://cloud.appwrite.io/v1') // Your Appwrite Endpoint
  .setProject('671aaf4d0021cac949a4') // Your project ID
  .setKey('standard_663498adfe82febd0aeb5f4357f24c762114f424eb3c875e5f2f20cd19288545859e14b5a3462db75bd1450a17fb41515bc841da74d5e6bcca8b29ea3d8edf38bf56454ac50ace32d5d30631d2f8644b5d32558232d60a876875dc89fd6eaf197c81863d563b436e5f9ec867b65c87e8e5b83e0a10652105d558317765b9dddd'); // Your Appwrite API key

const users = {};

// Save chat message to Appwrite database
const saveMessageToDatabase = async (data) => {
  try {
    const response = await databases.createDocument(
      '671ab0ac001b1e014e75', // Your Appwrite database ID
      '671ab0b5002cf0cd1989', // Your collection ID
      'unique()', // Unique document ID
      data
    );
    console.log('Message saved:', response);
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

// Fetch messages from Appwrite database
const fetchMessagesFromDatabase = async () => {
  try {
    const response = await databases.listDocuments(
      '671ab0ac001b1e014e75', // Your Appwrite database ID
      '671ab0b5002cf0cd1989' // Your collection ID
    );
    return response.documents;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

io.on('connection', async (socket) => {
    console.log('A user connected:', socket.id);
  
    // Send existing messages from the database to the newly connected user
    const previousMessages = await fetchMessagesFromDatabase();
    socket.emit('previousMessages', previousMessages);
  
    socket.on('setUsername', (username) => {
      users[socket.id] = username;
      const joinMessage = { username: 'System', message: `${username} has joined the chat`, time: new Date().toLocaleTimeString() };
      
      io.emit('chatMessage', joinMessage);
      io.emit('userList', Object.values(users));
  
      saveMessageToDatabase(joinMessage); // Save system message to the database
    });
  
    socket.on('chatMessage', (data) => {
      io.emit('chatMessage', data);
      saveMessageToDatabase(data); // Save user message to the database
    });
  
    socket.on('refreshMessages', async () => {
      const messages = await fetchMessagesFromDatabase();
      socket.emit('previousMessages', messages); // Send the latest messages to the client
    });
  
    socket.on('disconnect', () => {
      const username = users[socket.id];
      delete users[socket.id];
  
      const leaveMessage = { username: 'System', message: `${username} has left the chat`, time: new Date().toLocaleTimeString() };
      io.emit('chatMessage', leaveMessage);
      io.emit('userList', Object.values(users));
  
      saveMessageToDatabase(leaveMessage); // Save system message to the database
    });
  });
  
const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
