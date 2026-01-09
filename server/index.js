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

// Store connected users: { [socketId]: { username, publicKey, status } }
// status: 'available' | 'busy'
const users = {};

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // 1. User Login
    socket.on('join', ({ username, publicKey }) => {
        // Check for existing username
        const usernameExists = Object.values(users).some(u => u.username === username);

        if (usernameExists) {
            socket.emit('login_error', { message: 'Username is already taken. Please choose another one.' });
            return;
        }

        users[socket.id] = {
            username,
            publicKey,
            status: 'available'
        };
        console.log(`${username} joined.`);

        // Confirm login to client
        socket.emit('login_success', { username });

        // Broadcast updated user list to everyone
        io.emit('update_users', getUsersList());
    });

    // 2. Request Connection
    socket.on('request_connect', ({ targetId }) => {
        const requester = users[socket.id];
        const target = users[targetId];

        if (requester && target) {
            if (target.status === 'busy') {
                // Optional: Inform requester that user is busy if they somehow bypassed the UI
                return;
            }

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
            // Update statuses and link partners
            acceptee.status = 'busy';
            acceptee.partnerId = requesterId;

            requester.status = 'busy';
            requester.partnerId = socket.id;

            // Broadcast new user list so others see them as busy
            io.emit('update_users', getUsersList());

            // Notify Requester that it was accepted
            io.to(requesterId).emit('chat_started', {
                partnerId: socket.id,
                partnerName: acceptee.username,
                partnerPublicKey: acceptee.publicKey
            });
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
        // Mark both as available again
        if (users[socket.id]) {
            users[socket.id].status = 'available';
            users[socket.id].partnerId = null;
        }
        if (users[targetId]) {
            users[targetId].status = 'available';
            users[targetId].partnerId = null;
        }

        io.emit('update_users', getUsersList());

        if (users[targetId]) {
            console.log(`User ${users[socket.id]?.username} left chat with ${users[targetId]?.username}`);
            io.to(targetId).emit('partner_left', {
                senderId: socket.id
            });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        const disconnectedUser = users[socket.id];
        if (disconnectedUser && disconnectedUser.partnerId) {
            const partnerId = disconnectedUser.partnerId;
            const partner = users[partnerId];

            // If the partner is still there, free them
            if (partner) {
                console.log(`Resetting status for partner ${partner.username} since ${disconnectedUser.username} disconnected.`);
                partner.status = 'available';
                partner.partnerId = null;
            }
        }

        delete users[socket.id];
        io.emit('update_users', getUsersList());
    });
});

function getUsersList() {
    return Object.entries(users).map(([id, user]) => ({
        id,
        username: user.username,
        status: user.status
    }));
}

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
