const express = require ('express');
const http = require ('http');
const { disconnect } = require('process');
const socketIo = require ('socket.io')

const app = express();
const server = http.createServer(app)
const io = socketIo(server, 
{cors: {
    origin: "*",
    methords: ["GET", "POST"], 
}
});

const users = {}
    io.on('connection',  (socket) => {
        console.log ('A user is connected:',socket.id);

        socket.on('setUsername', (username) => {
            users[socket.id] = username;
            io.emit('chatMessage', {username: 'System', message: `${username} has joined the chat`,time: new Date().toLocaleTimeString() });
            io.emit('userList', Object.values(users));
        });

        socket.on ('chatMessage', (data) => {
            io.emit ('chatMessage', data);
        });

        socket.on('disconnect', () => {
            const username = users[socket.id];
            delete users[socket.id];
            io.emit('chatMessage', {
                username: 'System', message:  `${username} has left the chat`, time: new Date().toLocaleTimeString() 
            });
            io.emit('userList', Object.values(users));
        });
    });

    const PORT = 5000;
    server.listen(PORT, () => 
        console.log(`Server running on port ${PORT}`)
    );
