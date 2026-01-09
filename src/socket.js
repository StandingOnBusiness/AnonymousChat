import { io } from "socket.io-client";

// Connect to the server (assuming localhost:3000 based on server/index.js)
const URL = import.meta.env.VITE_API_URL || undefined;

export const socket = io(URL, {
    autoConnect: false
});

// Debugging
socket.onAny((event, ...args) => {
    console.log("[SOCKET]", event, args);
});
