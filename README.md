# Secure Anonymous Chat

An end-to-end encrypted, peer-to-peer style chat application built with Vue.js, Node.js, and the Web Crypto API.

**Live at: [https://p2p-chat.net](https://p2p-chat.net)**


## About the Project

This is a passion project I've had in mind for a long time. As a **Web Developer student at Accenture**, I wanted to challenge myself to build a truly private communication tool where the server knows nothing about the conversation. After diving deep into modern web technologies and cryptography, I finally brought this vision to life.

### Key Features
-   **Anonymous**: No accounts, no logins, no tracking.
-   **End-to-End Encrypted**: Messages are encrypted in the browser using Hybrid Encryption (RSA + AES). The server strictly acts as a relay.
-   **Ephemeral**: All data is stored in RAM. Refreshing the specific page or restarting the server wipes everything clean.
-   **Modern UI**: Built with Vue 3 and purely custom CSS (Glassmorphism, animated gradients).

## Tech Stack
-   **Frontend**: Vue.js 3, Vite
-   **Backend**: Node.js, Socket.io
-   **Security**: Native Web Crypto API
-   **Infrastructure**: Docker

## How to Run

The easiest way to run the application is using Docker.

```bash
# Clone the repository
git clone https://github.com/StandingOnBusiness/AnonymousChat.git
cd AnonymousChat

# Start the application
docker-compose up --build
```

Once running, access the app at:
-   **Frontend**: http://localhost:5173
-   **Backend**: http://localhost:3000

## Documentation

For a deep dive into how everything works, check out the `docs/` folder:
-   [Architecture](docs/ARCHITECTURE.md)
-   [Security Implementation](docs/SECURITY.md)
-   [Backend Logic](docs/SERVER.md)

---
*Built with love by a future Full Stack Developer.*
