# Backend Server Documentation (`server/index.js`)

## Purpose
The server acts as a lightweight relay and user directory. It does **not** store messages or perform any decryption. Its primary roles are:
1.  Maintaining a list of active users (`users` object).
2.  Relaying signaling events (connection requests, acceptance).
3.  Relaying encrypted message payloads between partners.

## Data Structures

### `users` Object
An in-memory object mapping Socket IDs to user data.
```javascript
const users = {
    "socketId123": {
        username: "Alice",
        publicKey: { encryption: "...", signing: "..." }, // JWK Format
        status: "available", // or "busy"
        partnerId: "socketId456" // ID of current chat partner, or null
    }
};
```
*Note: This data is not persistent. Restarting the server clears it.*

## Socket Events

### Connection / Disconnection
-   **`connection`**: Triggered when a client connects.
-   **`disconnect`**: Triggered when a client leaves.
    -   **Logic**:
        1.  Check if user had a `partnerId`.
        2.  If yes, find the partner and reset their status to `'available'` and `partnerId` to `null` (so they don't get stuck).
        3.  Delete user from `users`.
        4.  Broadcast updated list via `update_users`.

### Login Flow
-   **`join`** `({ username, publicKey })`
    -   **Validation**: Checks if `username` already exists in `users`.
    -   **Success**: Stores user, emits `login_success`, broadcasts `update_users`.
    -   **Failure**: Emits `login_error` with message.

### Signaling (Connection Setup)
-   **`request_connect`** `({ targetId })`
    -   Checks if `targetId` exists and is not busy.
    -   Emits `connection_request` to target.
-   **`accept_connect`** `({ requesterId })`
    -   Updates both users' status to `'busy'`.
    -   Links them via `partnerId`.
    -   Broadcasts `update_users` (so they appear unavailable to others).
    -   Emits `chat_started` to the requester with the acceptor's details.

### Messaging
-   **`private_message`** `({ targetId, encryptedPayload })`
    -   **Behavior**: Blindly forwards `encryptedPayload` to `targetId`.
    -   **Payload**: Contains `{ iv, key, data }` (all Base64 encoded). The server cannot peek inside.

### Chat management
-   **`leave_chat`** `({ targetId })`
    -   Resets status to `'available'` for both parties.
    -   Emits `partner_left` to the target.
    -   Broadcasts `update_users`.
-   **`typing`** `({ targetId })`
    -   Forwards `partner_typing` event to target.
