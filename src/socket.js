import { io } from "socket.io-client";

// Connect to the server (assuming localhost:3000 based on server/index.js)
const URL = "http://localhost:3000";

export const socket = io(URL, {
    autoConnect: false
});

// Debugging
socket.onAny((event, ...args) => {
    console.log("[SOCKET]", event, args);
});
