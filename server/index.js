const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow Vite dev server
        methods: ["GET", "POST"]
    }
});

// Store connected users: { [socketId]: { username, publicKey } }
const users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. User Login
    socket.on('join', ({ username, publicKey }) => {
        users[socket.id] = { username, publicKey };
        console.log(`${username} joined.`);

        // Broadcast updated user list to everyone
        io.emit('update_users', getUsersList());
    });

    // 2. Request Connection
    socket.on('request_connect', ({ targetId }) => {
        const requester = users[socket.id];
        if (requester && users[targetId]) {
            io.to(targetId).emit('connection_request', {
                requesterId: socket.id,
                requesterName: requester.username,
                requesterPublicKey: requester.publicKey
            });
        }
    });

    // 3. Accept Connection
    socket.on('accept_connect', ({ requesterId }) => {
        const acceptee = users[socket.id]; // The one who accepted
        const requester = users[requesterId];

        if (acceptee && requester) {
            // Notify Requester that it was accepted
            io.to(requesterId).emit('chat_started', {
                partnerId: socket.id,
                partnerName: acceptee.username,
                partnerPublicKey: acceptee.publicKey
            });
            // Notify Acceptee (User who clicked accept) - just to confirm state
            // actually the client handles this immediately upon click, but good to be sync.
        }
    });

    // 4. Private Message
    socket.on('private_message', ({ targetId, encryptedPayload }) => {
        // payload is { iv, key, data } (Hybrid encrypted)
        if (users[targetId]) {
            io.to(targetId).emit('private_message', {
                senderId: socket.id,
                encryptedPayload
            });
        }
    });

    socket.on('typing', ({ targetId }) => {
        io.to(targetId).emit('partner_typing', {
            senderId: socket.id
        });
    });

    socket.on('leave_chat', ({ targetId }) => {
        if (users[targetId]) {
            console.log(`User ${users[socket.id]?.username} left chat with ${users[targetId]?.username}`);
            io.to(targetId).emit('partner_left', {
                senderId: socket.id
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        delete users[socket.id];
        io.emit('update_users', getUsersList());
    });
});

function getUsersList() {
    return Object.entries(users).map(([id, user]) => ({
        id,
        username: user.username
    }));
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
